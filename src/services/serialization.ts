import type { LayoutData, Room, FurnitureItem, WallOpening, Floor } from '../types'
import { MIN_DIM_CM, MAX_DIM_CM } from '../types'

const CURRENT_VERSION = 1

// Valid sets used by sanitizeOpening
const VALID_OPENING_TYPES = new Set([
  'door', 'double-door', 'sliding-door', 'window',
  'panoramic', 'triple-window', 'french-balcony',
])
const VALID_WALL_SIDES = new Set(['left', 'right', 'front', 'back'])

function clampDim(val: unknown, min = MIN_DIM_CM, max = MAX_DIM_CM): number {
  const n = typeof val === 'number' ? val : Number(val)
  if (isNaN(n)) return min
  return Math.max(min, Math.min(max, n))
}

function isValidRoom(r: unknown): r is Room {
  if (!r || typeof r !== 'object') return false
  const o = r as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.type === 'string' &&
    typeof o.widthCm === 'number' &&
    typeof o.lengthCm === 'number' &&
    Array.isArray(o.position) && o.position.length === 2 &&
    typeof o.rotation === 'number' &&
    typeof o.color === 'number'
  )
}

function isValidFurniture(f: unknown): f is FurnitureItem {
  if (!f || typeof f !== 'object') return false
  const o = f as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.type === 'string' &&
    o.dims !== null && typeof o.dims === 'object' &&
    Array.isArray(o.position) && o.position.length === 2 &&
    typeof o.rotation === 'number' &&
    typeof o.color === 'number'
  )
}

// BUG-016: validate each opening field — corrupt/injected openings caused
// missing geometry or runtime errors in WallWithOpenings.
function sanitizeOpening(o: unknown): WallOpening | null {
  if (!o || typeof o !== 'object') return null
  const op = o as Record<string, unknown>
  if (typeof op.id !== 'string' || !op.id) return null
  if (!VALID_OPENING_TYPES.has(op.type as string)) return null
  if (!VALID_WALL_SIDES.has(op.wall as string)) return null
  return {
    id: op.id,
    type: op.type as WallOpening['type'],
    wall: op.wall as WallOpening['wall'],
    positionAlongWall: typeof op.positionAlongWall === 'number'
      ? Math.max(0, Math.min(1, op.positionAlongWall)) : 0.5,
    widthCm: clampDim(op.widthCm, 30, 600),
    heightCm: clampDim(op.heightCm, 60, 300),
    bottomCm: typeof op.bottomCm === 'number' ? Math.max(0, Math.min(250, op.bottomCm)) : 0,
  }
}

function sanitizeRoom(r: Room): Room {
  const openings: WallOpening[] = Array.isArray(r.openings)
    ? (r.openings as unknown[]).map(sanitizeOpening).filter(Boolean) as WallOpening[]
    : []
  return {
    id: r.id,
    type: r.type,
    widthCm: clampDim(r.widthCm),
    lengthCm: clampDim(r.lengthCm),
    position: [Number(r.position[0]) || 0, Number(r.position[1]) || 0],
    rotation: Number(r.rotation) || 0,
    color: Number(r.color) || 0x4488ff,
    wallColor: typeof r.wallColor === 'string' ? r.wallColor : '#e3ddd4',
    wallColorOuter: typeof r.wallColorOuter === 'string' ? r.wallColorOuter : '#c8c0b4',
    floorType: r.floorType ?? 'parke',
    openings,
    removedWalls: Array.isArray(r.removedWalls) ? r.removedWalls : [],
    // #6: floorId varsa taşı, yoksa importLayout defaultFloor'a bağlar
    ...(typeof r.floorId === 'string' && r.floorId ? { floorId: r.floorId } : {}),
  }
}

// #6 Multi-floor: kat tanımlarını doğrula
function sanitizeFloor(f: unknown): Floor | null {
  if (!f || typeof f !== 'object') return null
  const o = f as Record<string, unknown>
  if (typeof o.id !== 'string' || !o.id) return null
  return {
    id: o.id,
    label: typeof o.label === 'string' && o.label ? o.label : 'Kat',
    order: typeof o.order === 'number' && isFinite(o.order) ? o.order : 0,
    baseY: typeof o.baseY === 'number' && isFinite(o.baseY) ? o.baseY : 0,
  }
}

function sanitizeFurniture(f: FurnitureItem): FurnitureItem {
  const dims: Record<string, number> = {}
  if (f.dims && typeof f.dims === 'object') {
    for (const [k, v] of Object.entries(f.dims)) {
      dims[k] = clampDim(v, 10, 1000) // BUG-018: max 10 m (was 50 m)
    }
  }
  return {
    id: f.id,
    type: f.type,
    dims,
    position: [Number(f.position[0]) || 0, Number(f.position[1]) || 0],
    rotation: Number(f.rotation) || 0,
    color: Number(f.color) || 0xffcc44,
    parentRoomId: typeof f.parentRoomId === 'string' ? f.parentRoomId : null,
    // #6: floorId varsa taşı; yoksa importLayout ilk kata bağlar
    ...(typeof f.floorId === 'string' && f.floorId ? { floorId: f.floorId } : {}),
  }
}

// BUG-017: version migration — add future migrations here as:
//   if (fileVersion < 2) { /* migrate v1→v2 */ }
function migrateLayout(raw: Record<string, unknown>): Record<string, unknown> {
  const fileVersion = typeof raw.version === 'number' ? raw.version : 0
  if (fileVersion > CURRENT_VERSION) {
    // File from a newer app version — still try to parse (best-effort)
    console.warn(`[serialization] Layout version ${fileVersion} > current ${CURRENT_VERSION}. Proceeding best-effort.`)
  }
  // v0 → v1: no structural changes needed; version field was simply absent
  return raw
}

export function validateAndParse(json: string): LayoutData {
  const raw = JSON.parse(json)
  if (!raw || typeof raw !== 'object') throw new Error('Invalid layout data')

  const migrated = migrateLayout(raw as Record<string, unknown>)
  const rooms: Room[] = []
  const furniture: FurnitureItem[] = []

  if (Array.isArray(migrated.rooms)) {
    for (const r of migrated.rooms) {
      if (isValidRoom(r)) rooms.push(sanitizeRoom(r))
    }
  }

  if (Array.isArray(migrated.furniture)) {
    for (const f of migrated.furniture) {
      if (isValidFurniture(f)) furniture.push(sanitizeFurniture(f))
    }
  }

  // #6: floors opsiyonel — yoksa importLayout varsayılan kata fallback yapar
  let floors: Floor[] | undefined
  if (Array.isArray(migrated.floors)) {
    const sanitized = (migrated.floors as unknown[])
      .map(sanitizeFloor)
      .filter(Boolean) as Floor[]
    if (sanitized.length > 0) floors = sanitized.sort((a, b) => a.order - b.order)
  }

  return { version: CURRENT_VERSION, rooms, furniture, ...(floors ? { floors } : {}) }
}

export function exportToJSON(data: LayoutData): string {
  return JSON.stringify({ ...data, version: CURRENT_VERSION }, null, 2)
}

// ── .tsrm Özel Format ─────────────────────────────────────────────
// Pipeline: JSON → deflate (gzip) → base64 → TSRM header + checksum
//
// Dosya yapısı:
//   Satır 1: "TSRM/1" (magic header + format version)
//   Satır 2: base64 encoded gzip data
//   Satır 3: CRC checksum (data bütünlüğü)
//
// Avantajlar:
//   - %60-70 daha küçük dosya boyutu (gzip)
//   - Düz metin editörleriyle açılıp bozulamaz (binary → base64)
//   - Checksum ile veri bütünlüğü doğrulanır
//   - .tsrm uzantısı uygulamaya özel (çift tıkla → aç)

const TSRM_MAGIC = 'TSRM/1'

/** Basit checksum — veri bütünlüğü doğrulaması */
function crc32(str: string): string {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i)
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0)
    }
  }
  return ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).padStart(8, '0')
}

/** LayoutData → .tsrm formatında string */
export async function exportToTSRM(data: LayoutData): Promise<string> {
  const json = JSON.stringify({ ...data, version: CURRENT_VERSION })

  // Gzip sıkıştır (browser CompressionStream API)
  const encoder = new TextEncoder()
  const stream = new Blob([encoder.encode(json)])
    .stream()
    .pipeThrough(new CompressionStream('gzip'))
  const compressed = await new Response(stream).arrayBuffer()

  // Binary → base64
  const bytes = new Uint8Array(compressed)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  const b64 = btoa(binary)

  // Checksum
  const checksum = crc32(b64)

  return `${TSRM_MAGIC}\n${b64}\n${checksum}`
}

/** .tsrm formatından LayoutData'ya parse */
export async function importFromTSRM(content: string): Promise<LayoutData> {
  const lines = content.trim().split('\n')
  if (lines.length < 3 || !lines[0].startsWith('TSRM/')) {
    throw new Error('Geçersiz .tsrm dosyası: magic header bulunamadı')
  }

  const b64 = lines[1]
  const expectedChecksum = lines[2]

  // Checksum doğrula
  const actualChecksum = crc32(b64)
  if (actualChecksum !== expectedChecksum) {
    throw new Error(`Dosya bozulmuş: checksum uyuşmuyor (beklenen: ${expectedChecksum}, hesaplanan: ${actualChecksum})`)
  }

  // Base64 → binary
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

  // Gzip decompress
  const stream = new Blob([bytes])
    .stream()
    .pipeThrough(new DecompressionStream('gzip'))
  const decompressed = await new Response(stream).text()

  // JSON parse + validate
  return validateAndParse(decompressed)
}

// ── Download helpers ──────────────────────────────────────────────

/** .tsrm dosyası indir (birincil format) */
export function downloadTSRM(content: string, filename = 'eviniyerlestir-plan.tsrm') {
  const blob = new Blob([content], { type: 'application/x-tsrm' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** .json dosyası indir (geriye uyumluluk, paylaşım) */
export function downloadFile(json: string, filename = 'eviniyerlestir-plan.json') {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Dosya oku — .tsrm veya .json otomatik algıla */
export async function readAndParseFile(file: File): Promise<LayoutData> {
  const text = await readFileText(file)
  // .tsrm formatı mı kontrol et
  if (text.startsWith('TSRM/')) {
    return importFromTSRM(text)
  }
  // Düz JSON (geriye uyumluluk)
  return validateAndParse(text)
}

function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error('File read error'))
    reader.readAsText(file)
  })
}
