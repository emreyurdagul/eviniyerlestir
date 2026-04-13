// ── Room Types ──

export const ROOM_TYPES = [
  { type: 'salon',   label: 'Salon',        icon: '🛋', floorCol: 0xbcad92, wallCol: 0xe3ddd4, wDef: 405, lDef: 655 },
  { type: 'yatak',   label: 'Yatak Odası',  icon: '🛏', floorCol: 0xc4b89a, wallCol: 0xeae2d8, wDef: 320, lDef: 420 },
  { type: 'mutfak',  label: 'Mutfak',       icon: '🍳', floorCol: 0xb2b8a8, wallCol: 0xdde2d8, wDef: 280, lDef: 360 },
  { type: 'banyo',   label: 'Banyo',        icon: '🚿', floorCol: 0xa8b8c0, wallCol: 0xd8e2e8, wDef: 200, lDef: 260 },
  { type: 'koridor', label: 'Koridor',      icon: '🚪', floorCol: 0xb4a890, wallCol: 0xe2dcd4, wDef: 130, lDef: 500 },
  { type: 'cocuk',   label: 'Çocuk Odası',  icon: '🎮', floorCol: 0xccc0a0, wallCol: 0xeae8d8, wDef: 280, lDef: 360 },
] as const

export type RoomType = (typeof ROOM_TYPES)[number]['type']

export interface Room {
  id: string
  type: RoomType
  widthCm: number   // 20 - 5000
  lengthCm: number  // 20 - 5000
  position: [number, number]  // x, z (metre)
  rotation: number            // radyan
  color: number               // hex renk (selection indicator)
  wallColor: string           // hex string e.g. '#e3ddd4'
  floorType: FloorType
}

export const FLOOR_TYPES = [
  { type: 'parke',   label: 'Parke',    color: 0xbcad92 },
  { type: 'fayans',  label: 'Fayans',   color: 0xc8c0b0 },
  { type: 'hali',    label: 'Halı',     color: 0xa09078 },
  { type: 'laminat', label: 'Laminat',  color: 0xc4a870 },
  { type: 'mermer',  label: 'Mermer',   color: 0xd8d4cc },
  { type: 'beton',   label: 'Beton',    color: 0xb0b0a8 },
] as const

export type FloorType = (typeof FLOOR_TYPES)[number]['type']

// ── Furniture Types ──

export interface DimDef {
  key: string
  label: string
  unit: string
  min: number
  max: number
  def: number
}

export interface FurnitureConfig {
  type: string
  label: string
  icon: string
  category: 'oturma' | 'yatak' | 'yemek' | 'depolama' | 'aydinlatma' | 'dekor'
  dimDefs: DimDef[]
}

export const FURNITURE_CATALOG: FurnitureConfig[] = [
  { type: 'sofa',      label: "Koltuk (3'lü)", icon: '🛋', category: 'oturma',     dimDefs: [{ key: 'length', label: 'Uzunluk', unit: 'cm', min: 120, max: 400, def: 240 }] },
  { type: 'chair',     label: 'Tekli Koltuk',  icon: '💺', category: 'oturma',     dimDefs: [{ key: 'diameter', label: 'Çap', unit: 'cm', min: 60, max: 150, def: 90 }] },
  { type: 'dchair',    label: 'Yemek San.',    icon: '🪑', category: 'yemek',      dimDefs: [] },
  { type: 'ctable',    label: 'Orta Sehpa',    icon: '⭕', category: 'oturma',     dimDefs: [{ key: 'diameter', label: 'Çap', unit: 'cm', min: 40, max: 150, def: 100 }] },
  { type: 'tvunit',    label: 'TV Ünitesi',    icon: '📺', category: 'depolama',   dimDefs: [{ key: 'length', label: 'Uzunluk', unit: 'cm', min: 80, max: 350, def: 190 }] },
  { type: 'dtable',    label: 'Yemek Masası',  icon: '🍽', category: 'yemek',      dimDefs: [{ key: 'length', label: 'Boy', unit: 'cm', min: 80, max: 400, def: 180 }, { key: 'width', label: 'En', unit: 'cm', min: 60, max: 200, def: 90 }] },
  { type: 'bed',       label: 'Yatak',         icon: '🛏', category: 'yatak',      dimDefs: [{ key: 'length', label: 'Boy', unit: 'cm', min: 150, max: 250, def: 200 }, { key: 'width', label: 'En', unit: 'cm', min: 80, max: 200, def: 160 }] },
  { type: 'wardrobe',  label: 'Dolap',         icon: '🚪', category: 'depolama',   dimDefs: [{ key: 'width', label: 'Genişlik', unit: 'cm', min: 60, max: 300, def: 120 }, { key: 'depth', label: 'Derinlik', unit: 'cm', min: 40, max: 80, def: 60 }] },
  { type: 'shelf',     label: 'Raf / Kitaplık',icon: '📚', category: 'depolama',   dimDefs: [{ key: 'width', label: 'Genişlik', unit: 'cm', min: 40, max: 200, def: 80 }, { key: 'height', label: 'Yükseklik', unit: 'cm', min: 80, max: 240, def: 180 }] },
  { type: 'floorlamp', label: 'Lambader',      icon: '💡', category: 'aydinlatma', dimDefs: [] },
  { type: 'rug',       label: 'Halı',          icon: '🟫', category: 'dekor',      dimDefs: [{ key: 'length', label: 'Boy', unit: 'cm', min: 80, max: 400, def: 200 }, { key: 'width', label: 'En', unit: 'cm', min: 60, max: 300, def: 150 }] },
  { type: 'plant',     label: 'Bitki / Saksı', icon: '🌿', category: 'dekor',      dimDefs: [{ key: 'diameter', label: 'Çap', unit: 'cm', min: 20, max: 80, def: 40 }] },
]

export type FurnitureType = (typeof FURNITURE_CATALOG)[number]['type']

export interface FurnitureItem {
  id: string
  type: FurnitureType
  dims: Record<string, number>  // tip'e ozel boyutlar (cm)
  position: [number, number]    // x, z (metre)
  rotation: number              // radyan
  color: number                 // hex renk
  parentRoomId: string | null   // hibrit iliski: null = bagimsiz
}

// ── Layout (Serialization) ──

export interface LayoutData {
  version: number
  rooms: Room[]
  furniture: FurnitureItem[]
}

// ── Selection ──

export type SelectionKind = 'room' | 'furniture' | null

export interface Selection {
  kind: SelectionKind
  id: string | null
}

// ── Constants ──

export const ROOM_COLORS = [0x4488ff, 0x44cc88, 0xff8844, 0x44cccc, 0xcc8844, 0xff44cc]
export const FURNITURE_COLORS = [0xffcc44, 0x44cc88, 0x6688ff, 0xff6644, 0xaa66cc, 0x44aacc, 0xff88aa, 0x88cc44, 0xcc8844, 0x44cccc, 0xff4488, 0x44ffcc]

export const MIN_DIM_CM = 20
export const MAX_DIM_CM = 5000
