import Anthropic from '@anthropic-ai/sdk'
import { useDesignStore } from '../../store/designStore'
import type { Room, FurnitureItem } from '../../types'
import type { AIPreview } from '../../store/designStore'
import {
  SYSTEM_PLACEMENT, SYSTEM_PLAN, SYSTEM_STYLE,
  SYSTEM_SUGGESTION, SYSTEM_PHOTO,
} from './prompts'
import {
  AIPlacementResponseSchema, AIPlanResponseSchema,
  AIStyleResponseSchema, AISuggestionResponseSchema,
  AIPhotoResponseSchema,
} from './schemas'
import { aiCache, cacheKey } from './cache'

const MODEL_TEXT = 'claude-sonnet-4-6'
const MODEL_VISION = 'claude-sonnet-4-6'
const MAX_TOKENS = 4096

function getClient(): Anthropic {
  const key = useDesignStore.getState().aiApiKey
  if (!key) throw new Error('API key gerekli. Ayarlardan ekleyin.')
  return new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true })
}

/**
 * JSON çıkar — Claude bazen ```json ile sarıyor, bazen düz döner.
 *
 * BUG-008: Önceki impl sadece ilk { veya [ karakterini buluyordu; bu,
 * JSON öncesinde başka { içeren metinlerde (örn. hata açıklamaları) yanlış
 * parça alınmasına yol açıyordu. Şimdi:
 *   1. Kod bloğu → bloğun içini dengeli bracket ile parse et
 *   2. Yoksa outermost balanced {…} veya […] bul
 */
function extractJSON(text: string): unknown {
  // 1. Kod bloğu dene — bloğun içinden balanced bracket çıkar
  const blockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (blockMatch) {
    const candidate = tryBalancedBracket(blockMatch[1].trim())
    if (candidate !== null) {
      try { return JSON.parse(candidate) } catch { /* fall through to raw text */ }
    }
  }

  // 2. Ham metin: outermost balanced { } veya [ ]
  const candidate = tryBalancedBracket(text)
  if (candidate !== null) {
    try { return JSON.parse(candidate) } catch { /* fall through */ }
  }

  throw new Error(`JSON ayrıştırılamadı. Ham yanıt:\n${text.slice(0, 400)}`)
}

/** Metinden en dıştaki balanced {…} veya […] dilimini döner; bulunamazsa null. */
function tryBalancedBracket(text: string): string | null {
  const firstBrace = text.indexOf('{')
  const firstBracket = text.indexOf('[')
  let startPos: number
  if (firstBrace < 0 && firstBracket < 0) return null
  if (firstBrace < 0) startPos = firstBracket
  else if (firstBracket < 0) startPos = firstBrace
  else startPos = Math.min(firstBrace, firstBracket)

  const openChar = text[startPos] as '{' | '['
  const closeChar = openChar === '{' ? '}' : ']'
  let depth = 0
  let inString = false
  let escape = false
  for (let i = startPos; i < text.length; i++) {
    const ch = text[i]
    if (escape) { escape = false; continue }
    if (ch === '\\' && inString) { escape = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === openChar) depth++
    else if (ch === closeChar) {
      depth--
      if (depth === 0) return text.slice(startPos, i + 1)
    }
  }
  return null
}

async function callText(systemPrompt: string, userPrompt: string, count: number, cacheKeyVal: string): Promise<unknown> {
  const cached = aiCache.get(cacheKeyVal)
  if (cached) return cached

  // BUG-009: check API key BEFORE setting loading state — prevents the
  // "loading" spinner showing when the call will immediately fail.
  const client = getClient()
  useDesignStore.getState().setAiLoading(true)
  try {
    const response = await client.messages.create({
      model: MODEL_TEXT,
      max_tokens: MAX_TOKENS,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: `${userPrompt}\n\nLutfen ${count} farkli varyant uret.` }],
    })
    const textBlock = response.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') throw new Error('Beklenmeyen yanit')
    const raw = textBlock.text
    const parsed = extractJSON(raw)
    aiCache.set(cacheKeyVal, parsed)
    return parsed
  } finally {
    useDesignStore.getState().setAiLoading(false)
  }
}

async function callVision(systemPrompt: string, userPrompt: string, imageDataUrl: string): Promise<unknown> {
  // BUG-009: check API key BEFORE setting loading state
  const client = getClient()
  useDesignStore.getState().setAiLoading(true)
  try {
    // Strip data URL prefix
    const match = imageDataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/)
    if (!match) throw new Error('Gecersiz goruntu formati')
    const mediaType = match[1] as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
    const data = match[2]

    const response = await client.messages.create({
      model: MODEL_VISION,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data } },
          { type: 'text', text: userPrompt },
        ],
      }],
    })
    const textBlock = response.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') throw new Error('Beklenmeyen yanit')
    return extractJSON(textBlock.text)
  } finally {
    useDesignStore.getState().setAiLoading(false)
  }
}

/** Zod parse + hatalı yanıtta okunabilir mesaj */
function safeValidate<T>(schema: { parse: (v: unknown) => T }, raw: unknown, context: string): T {
  try {
    return schema.parse(raw)
  } catch (e: unknown) {
    const detail = JSON.stringify(raw, null, 2).slice(0, 600)
    const zodMsg = e instanceof Error ? e.message : String(e)
    throw new Error(`${context} şema hatası:\n${zodMsg}\n\nClaude yanıtı:\n${detail}`)
  }
}

// ── Public API ──

/** Bir oda icin mobilya yerlesim onerisi */
export async function suggestPlacement(roomId: string, count = 2): Promise<AIPreview> {
  const state = useDesignStore.getState()
  const room = state.rooms.find(r => r.id === roomId)
  if (!room) throw new Error('Oda bulunamadi')
  const existing = state.furniture.filter(f => f.parentRoomId === roomId)

  const userPrompt = `Oda: ${room.type}, ${room.widthCm}x${room.lengthCm}cm
Mevcut mobilyalar: ${JSON.stringify(existing.map(f => ({ type: f.type, position: f.position, dims: f.dims })))}`

  const key = cacheKey('placement', { room: { type: room.type, widthCm: room.widthCm, lengthCm: room.lengthCm }, existing, count })
  const raw = await callText(SYSTEM_PLACEMENT, userPrompt, count, key)
  const validated = safeValidate(AIPlacementResponseSchema, raw, 'Yerleşim')

  return {
    type: 'placement',
    applyMode: 'merge',
    selectedIndex: 0,
    variants: validated.variants.map(v => ({
      label: v.label,
      description: v.description,
      furniture: v.furniture.map((f, i) => buildFurnitureItem(f, room, i)),
    })),
  }
}

/** Eksik mobilya onerisi */
export async function suggestFurniture(roomId: string, count = 2): Promise<AIPreview> {
  const state = useDesignStore.getState()
  const room = state.rooms.find(r => r.id === roomId)
  if (!room) throw new Error('Oda bulunamadi')
  const existing = state.furniture.filter(f => f.parentRoomId === roomId)

  const userPrompt = `Oda tipi: ${room.type}, ${room.widthCm}x${room.lengthCm}cm
Mevcut mobilyalar: ${JSON.stringify(existing.map(f => f.type))}`

  const key = cacheKey('suggestion', { roomType: room.type, widthCm: room.widthCm, lengthCm: room.lengthCm, existing: existing.map(f => f.type), count })
  const raw = await callText(SYSTEM_SUGGESTION, userPrompt, count, key)
  const validated = safeValidate(AISuggestionResponseSchema, raw, 'Mobilya önerisi')

  return {
    type: 'suggestion',
    applyMode: 'merge',
    selectedIndex: 0,
    variants: validated.variants.map(v => ({
      label: v.label,
      description: v.description,
      furniture: v.furniture.map((f, i) => buildFurnitureItem(f, room, i)),
    })),
  }
}

/** Metin sorgusundan kat plani */
export async function generatePlanFromText(query: string, count = 2): Promise<AIPreview> {
  const userPrompt = `Kullanici tarifi: "${query}"`
  const key = cacheKey('plan', { query, count })
  const raw = await callText(SYSTEM_PLAN, userPrompt, count, key)
  const validated = safeValidate(AIPlanResponseSchema, raw, 'Plan')

  return {
    type: 'plan',
    applyMode: 'replace',
    selectedIndex: 0,
    variants: validated.variants.map(v => ({
      label: v.label,
      description: v.description,
      rooms: v.rooms.map((r, i) => buildRoom(r, i)),
      furniture: [],
    })),
  }
}

/** Stil onerisi */
export async function suggestStyle(roomId: string, count = 3): Promise<AIPreview> {
  const state = useDesignStore.getState()
  const room = state.rooms.find(r => r.id === roomId)
  if (!room) throw new Error('Oda bulunamadi')
  const existing = state.furniture.filter(f => f.parentRoomId === roomId)

  const userPrompt = `Oda: ${room.type}, mevcut renk: ${room.wallColor}, zemin: ${room.floorType}
Mobilyalar: ${JSON.stringify(existing.map(f => ({ type: f.type, color: '#' + f.color.toString(16).padStart(6, '0') })))}
Room ID: ${room.id}`

  const key = cacheKey('style', { roomId, wallColor: room.wallColor, floorType: room.floorType, existing: existing.map(f => f.type), count })
  const raw = await callText(SYSTEM_STYLE, userPrompt, count, key)
  const validated = safeValidate(AIStyleResponseSchema, raw, 'Stil')

  return {
    type: 'style',
    applyMode: 'style',
    selectedIndex: 0,
    variants: validated.variants.map(v => ({
      label: v.label,
      description: v.description,
      styleUpdates: v.styleUpdates,
    })),
  }
}

/** Fotograf analizi - yaklasik mobilya */
export async function analyzePhoto(imageDataUrl: string): Promise<{ type: string; label: string; dims: Record<string, number>; confidence: number }> {
  const raw = await callVision(SYSTEM_PHOTO, 'Bu mobilyayi tani.', imageDataUrl)
  const validated = safeValidate(AIPhotoResponseSchema, raw, 'Fotoğraf')
  const f = validated.furniture
  // Map estimated dims to standard dims based on type
  const dims: Record<string, number> = {}
  if (f.estimatedDimsCm.width) dims.width = f.estimatedDimsCm.width
  if (f.estimatedDimsCm.length) dims.length = f.estimatedDimsCm.length
  if (f.estimatedDimsCm.depth) dims.depth = f.estimatedDimsCm.depth
  if (f.estimatedDimsCm.height) dims.height = f.estimatedDimsCm.height
  if (f.estimatedDimsCm.diameter) dims.diameter = f.estimatedDimsCm.diameter

  return { type: f.type, label: f.label, dims, confidence: f.confidence }
}

/** Blueprint analizi - kroki -> oda listesi */
export async function parseBlueprint(imageDataUrl: string, count = 1): Promise<AIPreview> {
  const userPrompt = `Bu kat plani gorseline bakarak odalari tahmin et. Yanit JSON formatinda olsun:\n${SYSTEM_PLAN}`
  const raw = await callVision(SYSTEM_PLAN, userPrompt, imageDataUrl)
  const validated = safeValidate(AIPlanResponseSchema, raw, 'Plan')

  return {
    type: 'blueprint',
    applyMode: 'replace',
    selectedIndex: 0,
    variants: validated.variants.slice(0, count).map(v => ({
      label: v.label,
      description: v.description,
      rooms: v.rooms.map((r, i) => buildRoom(r, i)),
      furniture: [],
    })),
  }
}

// ── Helpers ──

function buildRoom(r: { type: string; widthCm: number; lengthCm: number; position: [number, number]; wallColor?: string; wallColorOuter?: string; floorType?: string }, idx: number): Room {
  const id = `ai-room-${Date.now()}-${idx}`
  return {
    id,
    type: r.type as Room['type'],
    widthCm: r.widthCm,
    lengthCm: r.lengthCm,
    position: r.position,
    rotation: 0,
    color: 0x4488ff,
    wallColor: r.wallColor ?? '#e3ddd4',
    wallColorOuter: r.wallColorOuter ?? '#c8c0b4',
    floorType: (r.floorType ?? 'parke') as Room['floorType'],
    openings: [],
    removedWalls: [],
  }
}

function buildFurnitureItem(f: { type: string; position: [number, number]; rotation: number; dims: Record<string, number> }, room: Room, idx: number): FurnitureItem {
  const id = `ai-furn-${Date.now()}-${idx}`

  // BUG-007: AI sometimes returns room-local positions in cm rather than metres.
  // Heuristic: if |pos| > 3× the room's half-size in metres, assume cm.
  const halfW = room.widthCm  / 200  // half-width  in metres
  const halfL = room.lengthCm / 200  // half-length in metres
  const rawX = f.position[0]
  const rawZ = f.position[1]
  const localX = Math.abs(rawX) > halfW * 3  ? rawX / 100 : rawX
  const localZ = Math.abs(rawZ) > halfL * 3  ? rawZ / 100 : rawZ
  // Clamp to room footprint so furniture never spawns outside the room
  const clampedX = Math.max(-halfW, Math.min(halfW, localX))
  const clampedZ = Math.max(-halfL, Math.min(halfL, localZ))

  // Convert room-local position to world position
  const worldPos: [number, number] = [
    room.position[0] + clampedX,
    room.position[1] + clampedZ,
  ]
  return {
    id,
    type: f.type as FurnitureItem['type'],
    dims: f.dims,
    position: worldPos,
    rotation: f.rotation,
    color: 0xffcc44,
    parentRoomId: room.id,
  }
}
