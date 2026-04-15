/**
 * Scene factories — oda / mobilya / açıklık nesnelerini üreten saf fonksiyonlar.
 *
 * designStore eskiden `addRoom`, `addFurniture`, `finalizeDrawing`, `addOpening`
 * içinde ~100 satır kurucu mantık barındırıyordu. Buraya taşıyarak:
 *   - Store aksiyonları thin wrapper'a indi (set(...) + append)
 *   - Kurucu mantık birim testi edilebilir hale geldi
 *   - İleride preset şablonlarında aynı factory'ler kullanılabilir
 */

import type {
  Room, FurnitureItem, FloorType, RoomType, FurnitureType, WallOpening, OpeningType,
} from '../types'
import {
  ROOM_TYPES, FURNITURE_CATALOG, ROOM_COLORS, FURNITURE_COLORS,
  DEFAULT_LUMENS, DEFAULT_KELVIN,
} from '../types'

// ── ID üreticileri (monotonic counter + timestamp suffix) ─────────────────────

let roomCounter = 0
let furnitureCounter = 0

function nextRoomId(): string {
  return `room-${++roomCounter}-${Date.now()}`
}

export function nextFurnitureId(): string {
  return `furn-${++furnitureCounter}-${Date.now()}`
}

/** Layout import / clear'da çağrılır — sayaçları sıfırlar. */
export function resetIdCounters(): void {
  roomCounter = 0
  furnitureCounter = 0
}

// ── Oda fabrikaları ────────────────────────────────────────────────────────────

const DEFAULT_WALL_COLORS: Record<string, string> = {
  salon: '#e3ddd4',
  yatak: '#eae2d8',
  mutfak: '#dde2d8',
  banyo: '#d8e2e8',
  koridor: '#e2dcd4',
  cocuk: '#eae8d8',
}

/**
 * Belirli bir oda tipinden yeni oda üretir.
 * - Pozisyon: mevcut oda sayısına göre sağa kaydır (0, 1.2, 2.4, ...)
 * - Renk: palet döngüsünden sırayla
 * - Zemin: banyo/mutfak için fayans, diğerleri için parke
 */
export function createRoomFromType(type: RoomType, existingRoomCount: number): Room {
  const cat = ROOM_TYPES.find(r => r.type === type) ?? ROOM_TYPES[0]
  const color = ROOM_COLORS[existingRoomCount % ROOM_COLORS.length]
  // BUG-003: Grid layout prevents rooms from stacking at same position.
  // Max 4 columns; ~5m horizontal gap, ~7m vertical gap between rooms.
  const col = existingRoomCount % 4
  const row = Math.floor(existingRoomCount / 4)
  return {
    id: nextRoomId(),
    type: cat.type as RoomType,
    widthCm: cat.wDef,
    lengthCm: cat.lDef,
    position: [col * 5, row * 7],
    rotation: 0,
    color,
    wallColor: DEFAULT_WALL_COLORS[cat.type] ?? '#e3ddd4',
    wallColorOuter: '#c8c0b4',
    floorType: (cat.type === 'banyo' || cat.type === 'mutfak' ? 'fayans' : 'parke') as FloorType,
    openings: [],
    removedWalls: [],
  }
}

/**
 * Çizim modundaki poligon noktalarını dikdörtgen bir odaya çevirir.
 * Bounding box alır, merkezi hesaplar, salon olarak oluşturur.
 * Geçersiz (3'ten az nokta veya <20cm boyut) ise null döner.
 */
export function polygonToBoundingRoom(
  points: [number, number][],
  existingRoomCount: number
): Room | null {
  if (points.length < 3) return null

  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity
  for (const [px, pz] of points) {
    if (px < minX) minX = px
    if (px > maxX) maxX = px
    if (pz < minZ) minZ = pz
    if (pz > maxZ) maxZ = pz
  }

  const widthM = maxX - minX
  const lengthM = maxZ - minZ
  if (widthM < 0.2 || lengthM < 0.2) return null

  const color = ROOM_COLORS[existingRoomCount % ROOM_COLORS.length]
  return {
    id: nextRoomId(),
    type: 'salon' as RoomType,
    widthCm: Math.round(widthM * 100),
    lengthCm: Math.round(lengthM * 100),
    position: [(minX + maxX) / 2, (minZ + maxZ) / 2],
    rotation: 0,
    color,
    wallColor: '#e3ddd4',
    wallColorOuter: '#c8c0b4',
    floorType: 'parke' as FloorType,
    openings: [],
    removedWalls: [],
  }
}

// ── Mobilya fabrikası ──────────────────────────────────────────────────────────

/**
 * Katalogtan mobilya üretir.
 * - Varyant öncelik sırası: override → kullanıcı default → katalog ilk
 * - Aydınlatma tipleri için lumens / Kelvin / lightOn eklenir
 * - Bulunamazsa null döner (bilinmeyen tip)
 */
export function createFurnitureItem(
  type: FurnitureType,
  existingFurnitureCount: number,
  options: {
    variantOverride?: string
    userDefaultVariant?: string
    /** BUG-001: spawn konumu — caller (store) ilk odanın merkezini geçer */
    spawnPos?: [number, number]
  } = {}
): FurnitureItem | null {
  const cat = FURNITURE_CATALOG.find(f => f.type === type)
  if (!cat) return null

  const dims: Record<string, number> = {}
  cat.dimDefs.forEach(d => { dims[d.key] = d.def })
  const color = FURNITURE_COLORS[existingFurnitureCount % FURNITURE_COLORS.length]

  let chosenVariant: string | undefined
  if (cat.variants && cat.variants.length > 0) {
    chosenVariant = options.variantOverride
      ?? options.userDefaultVariant
      ?? cat.variants[0].id
  }

  const isLight = cat.category === 'aydinlatma'
  const lumensDefault = isLight ? (DEFAULT_LUMENS[cat.type] ?? 800) : undefined
  const kelvinDefault = isLight ? (DEFAULT_KELVIN[cat.type] ?? 2800) : undefined

  return {
    id: nextFurnitureId(),
    type: cat.type as FurnitureType,
    ...(chosenVariant ? { variant: chosenVariant } : {}),
    dims,
    position: options.spawnPos ?? [0, 0], // BUG-001: caller provides position; no random spawn
    rotation: 0,
    color,
    parentRoomId: null,
    ...(isLight ? { lumens: lumensDefault, colorTempK: kelvinDefault, lightOn: true } : {}),
  }
}

/** Kullanıcının yüklediği özel .glb modeli için mobilya kaydı üretir. */
export function createCustomFurnitureItem(
  label: string,
  modelUrl: string,
  existingFurnitureCount: number,
  /** BUG-001: spawn konumu — caller (store) ilk odanın merkezini geçer */
  spawnPos?: [number, number]
): FurnitureItem {
  const color = FURNITURE_COLORS[existingFurnitureCount % FURNITURE_COLORS.length]
  return {
    id: nextFurnitureId(),
    type: 'custom' as FurnitureType,
    dims: { scale: 100 },
    position: spawnPos ?? [0, 0], // BUG-001: caller provides position; no random spawn
    rotation: 0,
    color,
    parentRoomId: null,
    customModelUrl: modelUrl,
    customLabel: label,
  }
}

// ── Açıklık (kapı / pencere) fabrikası ─────────────────────────────────────────

/** Açıklık tipine göre varsayılan ölçüler (cm) — w: genişlik, h: yükseklik, b: zeminden yükseklik. */
const OPENING_DEFAULTS: Record<string, { w: number; h: number; b: number }> = {
  'door':           { w: 90,  h: 210, b: 0  },
  'double-door':    { w: 160, h: 210, b: 0  },
  'sliding-door':   { w: 180, h: 210, b: 0  },
  'window':         { w: 120, h: 120, b: 90 },
  'panoramic':      { w: 220, h: 230, b: 0  },
  'triple-window':  { w: 240, h: 140, b: 80 },
  'french-balcony': { w: 120, h: 230, b: 0  },
}

/** Yeni bir duvar açıklığı (kapı / pencere) üretir. */
export function createOpening(type: OpeningType, wall: WallOpening['wall']): WallOpening {
  const d = OPENING_DEFAULTS[type] ?? OPENING_DEFAULTS['window']
  return {
    id: `opening-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    wall,
    positionAlongWall: 0.5,
    widthCm: d.w,
    heightCm: d.h,
    bottomCm: d.b,
  }
}
