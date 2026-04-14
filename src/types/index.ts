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

export type WallSide = 'left' | 'right' | 'front' | 'back'
export type OpeningType =
  | 'door'            // Tek kanatlı kapı
  | 'double-door'     // Çift kanatlı kapı
  | 'sliding-door'    // Sürgülü kapı
  | 'window'          // Standart pencere
  | 'panoramic'       // Boydan boya / panoramik
  | 'triple-window'   // Kademeli / üç bölümlü
  | 'french-balcony'  // Fransız balkon

export interface WallOpening {
  id: string
  type: OpeningType
  wall: WallSide
  positionAlongWall: number  // 0-1 normalized (wall'in neresinde)
  widthCm: number            // aciklik genisligi
  heightCm: number           // aciklik yuksekligi
  bottomCm: number           // yerden yukseklik (kapi: 0, pencere: ~90)
}

export interface Room {
  id: string
  type: RoomType
  widthCm: number   // 20 - 5000
  lengthCm: number  // 20 - 5000
  position: [number, number]  // x, z (metre)
  rotation: number            // radyan
  color: number               // hex renk (selection indicator)
  wallColor: string           // ic cephe rengi hex string e.g. '#e3ddd4'
  wallColorOuter: string      // dis cephe rengi hex string e.g. '#c8c0b4'
  floorType: FloorType
  openings: WallOpening[]     // kapi ve pencereler
  removedWalls: WallSide[]    // kaldirilmis duvarlar (oda birlestirme icin)
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

export interface VariantDef {
  id: string          // 'classic', 'modern', ...
  label: string       // 'Klasik'
  icon?: string       // opsiyonel emoji
  description?: string
}

export interface FurnitureConfig {
  type: string
  label: string
  icon: string
  category: 'oturma' | 'yatak' | 'yemek' | 'depolama' | 'aydinlatma' | 'dekor' | 'mutfak'
  dimDefs: DimDef[]
  variants?: VariantDef[]   // opsiyonel; yoksa tek bir 'default' varyant kabul edilir
}

export const FURNITURE_CATALOG: FurnitureConfig[] = [
  { type: 'sofa',      label: "Koltuk (3'lü)", icon: '🛋', category: 'oturma',     dimDefs: [{ key: 'length', label: 'Uzunluk', unit: 'cm', min: 120, max: 400, def: 240 }],
    variants: [
      { id: 'classic',     label: 'Klasik',       icon: '🛋', description: 'Yastıklı kollar, üç ayrı sırt yastığı' },
      { id: 'modern',      label: 'Modern',       icon: '▬',  description: 'Düz hatlı, alçak profil, tek parça sırt' },
      { id: 'chesterfield',label: 'Chesterfield', icon: '◆',  description: 'Deri görünüm, tufted sırt, rolled kollar' },
      { id: 'minimal',     label: 'Minimal',      icon: '—',  description: 'İnce ayaklar, dar kol, sade dokuma' },
    ],
  },
  { type: 'chair',     label: 'Tekli Koltuk',  icon: '💺', category: 'oturma',     dimDefs: [{ key: 'diameter', label: 'Çap', unit: 'cm', min: 60, max: 150, def: 90 }],
    variants: [
      { id: 'berjer',   label: 'Berjer',   icon: '💺', description: 'Klasik yastıklı kol' },
      { id: 'accent',   label: 'Aksesuar', icon: '◯',  description: 'Kolsuz modern aksan' },
      { id: 'wingback', label: 'Kanatlı',  icon: 'W',  description: 'Yüksek sırt, yan kanatlar' },
    ],
  },
  { type: 'dchair',    label: 'Yemek San.',    icon: '🪑', category: 'yemek',      dimDefs: [] },
  { type: 'ctable',    label: 'Orta Sehpa',    icon: '⭕', category: 'oturma',     dimDefs: [{ key: 'diameter', label: 'Çap', unit: 'cm', min: 40, max: 150, def: 100 }],
    variants: [
      { id: 'round',     label: 'Yuvarlak', icon: '⭕' },
      { id: 'square',    label: 'Kare',     icon: '◼' },
      { id: 'marble',    label: 'Mermer',   icon: '◉' },
    ],
  },
  { type: 'tvunit',    label: 'TV Ünitesi',    icon: '📺', category: 'depolama',   dimDefs: [{ key: 'length', label: 'Uzunluk', unit: 'cm', min: 80, max: 350, def: 190 }] },
  { type: 'dtable',    label: 'Yemek Masası',  icon: '🍽', category: 'yemek',      dimDefs: [{ key: 'length', label: 'Boy', unit: 'cm', min: 80, max: 400, def: 180 }, { key: 'width', label: 'En', unit: 'cm', min: 60, max: 200, def: 90 }] },
  { type: 'bed',       label: 'Yatak',         icon: '🛏', category: 'yatak',      dimDefs: [{ key: 'length', label: 'Boy', unit: 'cm', min: 150, max: 250, def: 200 }, { key: 'width', label: 'En', unit: 'cm', min: 80, max: 200, def: 160 }],
    variants: [
      { id: 'classic', label: 'Klasik',    icon: '🛏', description: 'Yüksek başlık, yorgan + yastıklar' },
      { id: 'modern',  label: 'Modern',    icon: '▭',  description: 'Düşük panel başlık, sade hatlar' },
      { id: 'tufted',  label: 'Tufted',    icon: '◈',  description: 'Düğmeli yastıklı başlık' },
    ],
  },
  { type: 'wardrobe',  label: 'Dolap',         icon: '🚪', category: 'depolama',   dimDefs: [{ key: 'width', label: 'Genişlik', unit: 'cm', min: 60, max: 300, def: 120 }, { key: 'depth', label: 'Derinlik', unit: 'cm', min: 40, max: 80, def: 60 }],
    variants: [
      { id: 'classic', label: 'Klasik',   icon: '🚪', description: 'Menteşeli kapılar + taç silme' },
      { id: 'sliding', label: 'Sürgülü',  icon: '↔',  description: 'Büyük sürgülü panel kapı' },
    ],
  },
  { type: 'shelf',     label: 'Raf / Kitaplık',icon: '📚', category: 'depolama',   dimDefs: [{ key: 'width', label: 'Genişlik', unit: 'cm', min: 40, max: 200, def: 80 }, { key: 'height', label: 'Yükseklik', unit: 'cm', min: 80, max: 240, def: 180 }] },
  { type: 'floorlamp', label: 'Lambader',      icon: '💡', category: 'aydinlatma', dimDefs: [] },
  { type: 'rug',       label: 'Halı',          icon: '🟫', category: 'dekor',      dimDefs: [{ key: 'length', label: 'Boy', unit: 'cm', min: 80, max: 400, def: 200 }, { key: 'width', label: 'En', unit: 'cm', min: 60, max: 300, def: 150 }] },
  { type: 'plant',     label: 'Bitki / Saksı', icon: '🌿', category: 'dekor',      dimDefs: [{ key: 'diameter', label: 'Çap', unit: 'cm', min: 20, max: 80, def: 40 }] },
  // ── Mutfak ──
  { type: 'lsofa',      label: 'L Koltuk',       icon: '🛋', category: 'oturma',  dimDefs: [
      { key: 'length', label: 'Uzun Kenar',  unit: 'cm', min: 180, max: 420, def: 290 },
      { key: 'width',  label: 'Kısa Kenar',  unit: 'cm', min: 150, max: 280, def: 200 },
      { key: 'depth',  label: 'Oturma Der.', unit: 'cm', min:  80, max: 120, def:  95 },
    ],
    variants: [
      { id: 'classic', label: 'Klasik',   icon: '🛋', description: 'Klasik L, köşe paylaşımlı oturma' },
      { id: 'chaise',  label: 'Şezlonglu',icon: '◣',  description: 'Uzun şezlong ucu, açık kol' },
      { id: 'modern',  label: 'Modern',   icon: '▭',  description: 'Alçak profil, kolsuz modüler' },
    ],
  },
  { type: 'counter',    label: 'Mutfak Tezgahı', icon: '🍳', category: 'mutfak', dimDefs: [
      { key: 'length', label: 'Uzunluk', unit: 'cm', min: 60, max: 400, def: 180 },
      { key: 'depth',  label: 'Derinlik', unit: 'cm', min: 40, max: 80,  def: 60  },
  ]},
  { type: 'ankastre',   label: 'Ankastre Set',   icon: '🔥', category: 'mutfak', dimDefs: [
      { key: 'width', label: 'Genişlik', unit: 'cm', min: 55, max: 90, def: 60 },
  ]},
  { type: 'kitchencab', label: 'Mutfak Dolabı',  icon: '🗄', category: 'mutfak', dimDefs: [
      { key: 'width', label: 'Genişlik', unit: 'cm', min: 30, max: 120, def: 60 },
      { key: 'depth', label: 'Derinlik', unit: 'cm', min: 30, max: 70,  def: 35 },
  ]},
  { type: 'fridge',     label: 'Buzdolabı',      icon: '🧊', category: 'mutfak', dimDefs: [
      { key: 'width', label: 'Genişlik', unit: 'cm', min: 50, max: 100, def: 70 },
      { key: 'depth', label: 'Derinlik', unit: 'cm', min: 50, max: 80,  def: 65 },
  ]},
  { type: 'washer',     label: 'Çamaşır Mak.',  icon: '🌀', category: 'mutfak', dimDefs: [] },
  { type: 'dishwasher', label: 'Bulaşık Mak.',  icon: '🫧', category: 'mutfak', dimDefs: [] },
  { type: 'dryer',      label: 'Kurutma Mak.',  icon: '💨', category: 'mutfak', dimDefs: [] },
]

export type FurnitureType = (typeof FURNITURE_CATALOG)[number]['type'] | 'custom'

export interface FurnitureItem {
  id: string
  type: FurnitureType
  variant?: string              // varyant id (ör: 'classic', 'modern'); yoksa default
  dims: Record<string, number>  // tip'e ozel boyutlar (cm)
  position: [number, number]    // x, z (metre)
  rotation: number              // radyan
  color: number                 // hex renk
  customModelUrl?: string       // GLTF/GLB blob URL (custom modeller icin)
  customLabel?: string          // kullanici verdigi isim
  parentRoomId: string | null   // hibrit iliski: null = bagimsiz
}

// ── Layout (Serialization) ──

export interface LayoutData {
  version: number
  rooms: Room[]
  furniture: FurnitureItem[]
}

// ── Wall Color Palette ──

export const WALL_COLOR_PALETTE = [
  { label: 'Beyaz',       value: '#f5f5f0' },
  { label: 'Krem',        value: '#e3ddd4' },
  { label: 'Bej',         value: '#d4c8b0' },
  { label: 'Açık Gri',    value: '#d0d0cc' },
  { label: 'Gri',         value: '#b0b0a8' },
  { label: 'Koyu Gri',    value: '#808078' },
  { label: 'Açık Mavi',   value: '#c8d8e8' },
  { label: 'Mavi',        value: '#8fb5d4' },
  { label: 'Koyu Mavi',   value: '#4a7a9b' },
  { label: 'Açık Yeşil',  value: '#c8d8c0' },
  { label: 'Yeşil',       value: '#8aaa80' },
  { label: 'Açık Sarı',   value: '#e8dcc0' },
  { label: 'Sarı',        value: '#d4c080' },
  { label: 'Turuncu',     value: '#d4a870' },
  { label: 'Pembe',       value: '#e0c0c0' },
  { label: 'Mor',         value: '#b8a0c0' },
  { label: 'Kahve',       value: '#a08060' },
  { label: 'Koyu Kahve',  value: '#6a5040' },
  { label: 'Siyah',       value: '#303030' },
  { label: 'Terracotta',  value: '#c07050' },
]

// ── Selection ──

export type SelectionKind = 'room' | 'furniture' | 'opening' | null

export interface Selection {
  kind: SelectionKind
  id: string | null
  parentId?: string | null  // 'opening' için: roomId
}

// ── Constants ──

export const ROOM_COLORS = [0x4488ff, 0x44cc88, 0xff8844, 0x44cccc, 0xcc8844, 0xff44cc]
export const FURNITURE_COLORS = [0xffcc44, 0x44cc88, 0x6688ff, 0xff6644, 0xaa66cc, 0x44aacc, 0xff88aa, 0x88cc44, 0xcc8844, 0x44cccc, 0xff4488, 0x44ffcc]

export const MIN_DIM_CM = 20
export const MAX_DIM_CM = 5000
