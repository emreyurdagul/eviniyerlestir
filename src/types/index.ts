// ── Room Types ──

export const ROOM_TYPES = [
  { type: 'salon',   label: 'Salon',        icon: '🛋', floorCol: 0xbcad92, wallCol: 0xe3ddd4, wDef: 405, lDef: 655 },
  { type: 'yatak',   label: 'Yatak Odası',  icon: '🛏', floorCol: 0xc4b89a, wallCol: 0xeae2d8, wDef: 320, lDef: 420 },
  { type: 'mutfak',  label: 'Mutfak',       icon: '🍳', floorCol: 0xb2b8a8, wallCol: 0xdde2d8, wDef: 280, lDef: 360 },
  { type: 'banyo',   label: 'Banyo',        icon: '🚿', floorCol: 0xa8b8c0, wallCol: 0xd8e2e8, wDef: 200, lDef: 260 },
  { type: 'koridor', label: 'Koridor',      icon: '🚪', floorCol: 0xb4a890, wallCol: 0xe2dcd4, wDef: 130, lDef: 500 },
  { type: 'cocuk',   label: 'Çocuk Odası',  icon: '🎮', floorCol: 0xccc0a0, wallCol: 0xeae8d8, wDef: 280, lDef: 360 },
  { type: 'balkon',  label: 'Balkon',       icon: '🌇', floorCol: 0xc0c8b0, wallCol: 0xe8e4dc, wDef: 300, lDef: 150 },
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
  widthCm: number   // 20 - 5000 (polygon için bounding-box genişliği)
  lengthCm: number  // 20 - 5000 (polygon için bounding-box uzunluğu)
  position: [number, number]  // x, z (metre) — oda merkezi
  rotation: number            // radyan
  color: number               // hex renk (selection indicator)
  wallColor: string           // ic cephe rengi hex string e.g. '#e3ddd4'
  wallColorOuter: string      // dis cephe rengi hex string e.g. '#c8c0b4'
  floorType: FloorType
  openings: WallOpening[]     // kapi ve pencereler (dikdörtgen odalar için)
  removedWalls: WallSide[]    // kaldirilmis duvarlar (oda birlestirme icin)
  /**
   * #6 Multi-floor: Odanın bağlı olduğu kat ID'si. Eski dosyalarda eksik
   * olabilir — serialization katmanında varsayılan "floor-ground"a fallback
   * yapılır. Tek kat senaryoda bu alan görmezden gelinir.
   */
  floorId?: string
  /**
   * Oda şekli. 'rectangle' (varsayılan / undefined) mevcut BoxGeometry
   * tabanlı renderer kullanır. 'polygon' çok köşeli ShapeGeometry/
   * ExtrudeGeometry tabanlı PolygonRoomMesh'e yönlendirir.
   */
  shape?: 'rectangle' | 'polygon'
  /**
   * Polygon oda köşeleri — yerel koordinatlarda (metre), position merkezine
   * göre. CCW (saat yönünün tersi) sıralı olmalı — ShapeGeometry uyumu için.
   * Yalnızca shape === 'polygon' durumunda doldurulur; dikdörtgen odalar için
   * widthCm / lengthCm yeterlidir.
   */
  vertices?: [number, number][]
}

/**
 * #6 Multi-floor: Bir kat tanımı.
 * - `baseY` metre cinsinden zemin seviyesi; altındaki katların yüksekliklerinin toplamı.
 * - `order` alt→üst sıralama için (negatif = bodrum).
 * - `ceilingHeight` her katın kendi tavan yüksekliği (2.0–4.0 m).
 *   Eksikse (eski layout) global `ceilingHeight`'a düşer.
 */
/**
 * Çatı tipleri — en üst katın "üstüne" render edilir. 'none' = düz tavan
 * (klasik daire). 'flat' = düz çatı (teras benzeri), 'gable' = üçgen iki
 * eğimli, 'hip' = dört yönlü piramit, 'mansard' = iki kademeli.
 */
export type RoofType = 'none' | 'flat' | 'gable' | 'hip' | 'mansard'

export interface Floor {
  id: string
  label: string     // "Zemin Kat", "1. Kat", "Çatı Katı" vb.
  order: number     // sıralama (0 = zemin, 1 = 1. kat, -1 = bodrum)
  baseY: number     // metre; alt katların ceilingHeight toplamı
  ceilingHeight?: number  // metre (2.0–4.0); yoksa global ceilingHeight kullanılır
  /**
   * Bu kat "çatı katı" (attic) mı? true ise tavanı eğimli render edilir,
   * mobilya erişimi kısıtlanır. Kullanıcı etiketi serbest ("Çatı Katı" vb).
   */
  isAttic?: boolean
  /**
   * Bu katın ÜSTÜNDE render edilecek çatı tipi. Genelde en üst kata atanır.
   * 'none' varsayılan (çatı yok, düz tavan).
   */
  roofType?: RoofType
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
    | 'banyo' | 'calisma' | 'cocuk' | 'bahce' | 'yapisal'
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
  { type: 'dchair',    label: 'Yemek San.',    icon: '🪑', category: 'yemek',      dimDefs: [],
    variants: [
      { id: 'classic', label: 'Klasik Ahşap', icon: '🪑', description: 'Spindle sırt, ahşap ayak' },
      { id: 'upholstered', label: 'Yastıklı',  icon: '◼', description: 'Üst sırt yastıklı, modern' },
      { id: 'scandi',  label: 'Skandinav',     icon: 'Ⓝ', description: 'Açık ahşap, eğimli sırt' },
    ],
  },
  { type: 'ctable',    label: 'Orta Sehpa',    icon: '⭕', category: 'oturma',     dimDefs: [{ key: 'diameter', label: 'Çap', unit: 'cm', min: 40, max: 150, def: 100 }],
    variants: [
      { id: 'round',     label: 'Yuvarlak', icon: '⭕' },
      { id: 'square',    label: 'Kare',     icon: '◼' },
      { id: 'marble',    label: 'Mermer',   icon: '◉' },
    ],
  },
  { type: 'tvunit',    label: 'TV Ünitesi',    icon: '📺', category: 'depolama',   dimDefs: [{ key: 'length', label: 'Uzunluk', unit: 'cm', min: 80, max: 350, def: 190 }],
    variants: [
      { id: 'classic', label: 'Klasik',  icon: '📺', description: 'Alt dolap + çekmeceler + TV' },
      { id: 'floating',label: 'Floating',icon: '▬', description: 'Duvara monteli, taşan hat' },
    ],
  },
  { type: 'dtable',    label: 'Yemek Masası',  icon: '🍽', category: 'yemek',      dimDefs: [{ key: 'length', label: 'Boy', unit: 'cm', min: 80, max: 400, def: 180 }, { key: 'width', label: 'En', unit: 'cm', min: 60, max: 200, def: 90 }],
    variants: [
      { id: 'classic', label: 'Klasik Ahşap', icon: '🍽', description: '4 ayaklı + çapraz bağ' },
      { id: 'modern',  label: 'Modern Cam',   icon: '◻', description: 'Cam tabla + metal ayak' },
      { id: 'pedestal',label: 'Tek Ayak',     icon: '◉', description: 'Merkez sütun + geniş taban' },
    ],
  },
  { type: 'bed',       label: 'Yatak',         icon: '🛏', category: 'yatak',      dimDefs: [{ key: 'length', label: 'Boy', unit: 'cm', min: 150, max: 250, def: 200 }, { key: 'width', label: 'En', unit: 'cm', min: 80, max: 200, def: 160 }],
    variants: [
      { id: 'classic', label: 'Klasik',    icon: '🛏', description: 'Yüksek başlık, yorgan + yastıklar' },
      { id: 'modern',  label: 'Modern',    icon: '▭',  description: 'Düşük panel başlık, sade hatlar' },
      { id: 'tufted',  label: 'Tufted',    icon: '◈',  description: 'Düğmeli yastıklı başlık' },
      { id: 'single',  label: 'Tek Kişilik',icon: '🛏', description: '90×190 dar yatak' },
      { id: 'queen',   label: 'Queen',     icon: '◻',  description: '160×200 standart' },
      { id: 'king',    label: 'King',      icon: '◼',  description: '200×200 geniş' },
      { id: 'canopy',  label: 'Cibinlikli',icon: '⛱', description: '4 sütunlu klasik' },
    ],
  },
  { type: 'wardrobe',  label: 'Dolap',         icon: '🚪', category: 'depolama',   dimDefs: [{ key: 'width', label: 'Genişlik', unit: 'cm', min: 60, max: 300, def: 120 }, { key: 'depth', label: 'Derinlik', unit: 'cm', min: 40, max: 80, def: 60 }],
    variants: [
      { id: 'classic', label: 'Klasik',   icon: '🚪', description: 'Menteşeli kapılar + taç silme' },
      { id: 'sliding', label: 'Sürgülü',  icon: '↔',  description: 'Büyük sürgülü panel kapı' },
    ],
  },
  { type: 'shelf',     label: 'Raf / Kitaplık',icon: '📚', category: 'depolama',   dimDefs: [{ key: 'width', label: 'Genişlik', unit: 'cm', min: 40, max: 200, def: 80 }, { key: 'height', label: 'Yükseklik', unit: 'cm', min: 80, max: 240, def: 180 }],
    variants: [
      { id: 'classic', label: 'Klasik',   icon: '📚', description: 'Arkalı, kitaplı kitaplık' },
      { id: 'ladder',  label: 'Merdiven', icon: '🪜', description: 'Arkasız, arkaya eğimli' },
      { id: 'cube',    label: 'Küp Raf',  icon: '▦', description: 'Kare bölmeli düzenli grid' },
    ],
  },
  { type: 'floorlamp', label: 'Lambader',      icon: '💡', category: 'aydinlatma', dimDefs: [],
    variants: [
      { id: 'classic', label: 'Klasik Abajur', icon: '💡', description: 'Ahşap gövde, kumaş abajur' },
      { id: 'arc',     label: 'Arc Lamp',      icon: '⤴',  description: 'Kavisli metal kol, büyük abajur' },
      { id: 'tripod',  label: 'Tripod',        icon: '△',  description: 'Üç ayaklı modern' },
    ],
  },
  { type: 'ceilinglamp', label: 'Tavan Lambası',    icon: '💡', category: 'aydinlatma',
    dimDefs: [{ key: 'diameter', label: 'Çap', unit: 'cm', min: 20, max: 150, def: 55 }],
    variants: [
      { id: 'chandelier', label: 'Avize',   icon: '✦', description: 'Çok kollu klasik avize' },
      { id: 'pendant',    label: 'Sarkıt',  icon: '◯', description: 'Tek sarkıt globe' },
      { id: 'panel',      label: 'LED Panel',icon: '▭', description: 'Yuvarlak LED panel' },
    ],
  },
  { type: 'wallsconce',  label: 'Duvar Aydınlatması', icon: '🕯', category: 'aydinlatma',
    dimDefs: [{ key: 'width', label: 'Genişlik', unit: 'cm', min: 10, max: 60, def: 25 }],
    variants: [
      { id: 'modern',  label: 'Modern',  icon: '▭', description: 'Yukarı/aşağı yönlü LED' },
      { id: 'classic', label: 'Klasik',  icon: '✧', description: 'Mum formu, dekoratif' },
    ],
  },
  { type: 'rug',       label: 'Halı',          icon: '🟫', category: 'dekor',      dimDefs: [{ key: 'length', label: 'Boy', unit: 'cm', min: 80, max: 400, def: 200 }, { key: 'width', label: 'En', unit: 'cm', min: 60, max: 300, def: 150 }] },
  { type: 'plant',     label: 'Bitki / Saksı', icon: '🌿', category: 'dekor',      dimDefs: [{ key: 'diameter', label: 'Çap', unit: 'cm', min: 20, max: 80, def: 40 }],
    variants: [
      { id: 'classic', label: 'Orta Boy', icon: '🌿', description: 'Çok yapraklı saksı bitkisi' },
      { id: 'tall',    label: 'Ficus',    icon: '🌳', description: 'Yüksek iç mekan ağacı' },
      { id: 'cactus',  label: 'Kaktüs',   icon: '🌵', description: 'Çöl saksısı, bakımsız' },
    ],
  },
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
    ],
    variants: [
      { id: 'classic',   label: 'Tek Kapılı', icon: '🧊', description: 'Üst freezer, tek kapı' },
      { id: 'sidebyside',label: 'Gardıroplu',  icon: '▯▯', description: 'İki yandan açılan' },
      { id: 'french',    label: 'French Door', icon: '⫝', description: 'Üst çift kapı + alt freezer' },
    ],
  },
  { type: 'washer',     label: 'Çamaşır Mak.',  icon: '🌀', category: 'mutfak', dimDefs: [] },
  { type: 'dishwasher', label: 'Bulaşık Mak.',  icon: '🫧', category: 'mutfak', dimDefs: [] },
  { type: 'dryer',      label: 'Kurutma Mak.',  icon: '💨', category: 'mutfak', dimDefs: [] },

  // ══════════════════════════════════════════════════════════════════
  //  Banyo (5 tip — Agent A)
  // ══════════════════════════════════════════════════════════════════
  { type: 'toilet', label: 'Klozet', icon: '🚽', category: 'banyo',
    dimDefs: [{ key: 'depth', label: 'Derinlik', unit: 'cm', min: 50, max: 80, def: 70 }],
    variants: [
      { id: 'classic', label: 'Yerde',  icon: '🚽', description: 'Klasik yere oturan' },
      { id: 'wall',    label: 'Asılı',  icon: '▭',  description: 'Duvara monteli' },
    ],
  },
  { type: 'sink', label: 'Lavabo', icon: '🚰', category: 'banyo',
    dimDefs: [{ key: 'width', label: 'Genişlik', unit: 'cm', min: 40, max: 140, def: 60 }],
    variants: [
      { id: 'round',  label: 'Yuvarlak Ayaklı', icon: '◯', description: 'Klasik ayaklı seramik' },
      { id: 'square', label: 'Köşeli Modern',   icon: '◻', description: 'Tezgah üstü + ahşap dolap' },
      { id: 'double', label: 'İkiz',            icon: '◫', description: 'İki çanaklı geniş tezgah' },
    ],
  },
  { type: 'shower', label: 'Duşakabin', icon: '🚿', category: 'banyo',
    dimDefs: [
      { key: 'width', label: 'Genişlik', unit: 'cm', min: 70, max: 160, def: 90 },
      { key: 'depth', label: 'Derinlik', unit: 'cm', min: 70, max: 160, def: 90 },
    ],
    variants: [
      { id: 'straight', label: 'Düz Panel', icon: '▭', description: 'Düz cam panelli' },
      { id: 'corner',   label: 'Köşe',      icon: '◟', description: 'Çeyrek daire köşe' },
    ],
  },
  { type: 'bathtub', label: 'Küvet', icon: '🛁', category: 'banyo',
    dimDefs: [
      { key: 'length', label: 'Boy', unit: 'cm', min: 140, max: 200, def: 170 },
      { key: 'width',  label: 'En',  unit: 'cm', min:  70, max: 100, def:  75 },
    ],
    variants: [
      { id: 'classic',      label: 'Gömme Klasik', icon: '🛁', description: 'Duvar kenarı gömme' },
      { id: 'freestanding', label: 'Freestanding', icon: '◉',  description: 'Ayaklı oval' },
    ],
  },
  { type: 'bathroom-cabinet', label: 'Banyo Dolabı', icon: '🪞', category: 'banyo',
    dimDefs: [
      { key: 'width',  label: 'Genişlik',   unit: 'cm', min: 40, max: 140, def: 60 },
      { key: 'height', label: 'Yükseklik',  unit: 'cm', min: 50, max: 100, def: 70 },
    ],
    variants: [
      { id: 'single', label: 'Tek Kapı',  icon: '▯',  description: 'Aynalı tek kapı' },
      { id: 'double', label: 'Çift Kapı', icon: '▯▯', description: 'İki aynalı kapı' },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  //  Oturma aksesuar (5 tip — Agent A, "oturma" kategorisi)
  // ══════════════════════════════════════════════════════════════════
  { type: 'barstool', label: 'Bar Taburesi', icon: '🪑', category: 'oturma',
    dimDefs: [{ key: 'diameter', label: 'Oturma Çapı', unit: 'cm', min: 30, max: 50, def: 38 }],
    variants: [
      { id: 'modern',  label: 'Modern',  icon: '◯', description: 'Tek metal kolon' },
      { id: 'classic', label: 'Klasik',  icon: '🪑', description: 'Ahşap 4 ayaklı' },
    ],
  },
  { type: 'ottoman', label: 'Puf / Otoman', icon: '◼', category: 'oturma',
    dimDefs: [
      { key: 'width',  label: 'Genişlik', unit: 'cm', min: 40, max: 120, def: 60 },
      { key: 'length', label: 'Uzunluk',  unit: 'cm', min: 40, max: 140, def: 60 },
    ],
  },
  { type: 'recliner', label: 'Rahatlık Koltuğu', icon: '🛋', category: 'oturma',
    dimDefs: [
      { key: 'width', label: 'Genişlik', unit: 'cm', min: 80, max: 120, def:  95 },
      { key: 'depth', label: 'Derinlik', unit: 'cm', min: 90, max: 130, def: 100 },
    ],
    variants: [
      { id: 'fabric',  label: 'Kumaş', icon: '◳', description: 'Yüksek sırt kumaş' },
      { id: 'leather', label: 'Deri',  icon: '◆', description: 'Segmanlı modern deri' },
    ],
  },
  { type: 'beanbag', label: 'Armut Koltuk', icon: '🫘', category: 'oturma',
    dimDefs: [{ key: 'diameter', label: 'Çap', unit: 'cm', min: 70, max: 140, def: 100 }],
  },
  { type: 'bench', label: 'Bank', icon: '🪑', category: 'oturma',
    dimDefs: [
      { key: 'length', label: 'Uzunluk',  unit: 'cm', min:  80, max: 240, def: 120 },
      { key: 'width',  label: 'Derinlik', unit: 'cm', min:  30, max:  60, def:  40 },
    ],
    variants: [
      { id: 'wood',        label: 'Ahşap',    icon: '🪵', description: 'Sade ahşap' },
      { id: 'upholstered', label: 'Yastıklı', icon: '◼', description: 'Tufted yastık' },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  //  Çalışma Odası (5 tip — Agent B)
  // ══════════════════════════════════════════════════════════════════
  { type: 'desk', label: 'Çalışma Masası', icon: '💻', category: 'calisma',
    dimDefs: [
      { key: 'length', label: 'Uzunluk', unit: 'cm', min: 80,  max: 200, def: 140 },
      { key: 'depth',  label: 'Derinlik', unit: 'cm', min: 50, max: 90,  def: 70  },
    ],
    variants: [
      { id: 'classic', label: 'Düz',       icon: '▭', description: 'Düz tabla + çekmece' },
      { id: 'lshape',  label: 'L Şekli',   icon: '◣', description: 'Köşe L çalışma alanı' },
      { id: 'drawer',  label: 'Çekmeceli', icon: '▦', description: 'Çoklu çekmeceli blok' },
    ],
  },
  { type: 'office-chair', label: 'Ofis Sandalyesi', icon: '🪑', category: 'calisma', dimDefs: [],
    variants: [
      { id: 'ergonomic', label: 'Ergonomik', icon: '◈', description: 'Bel destekli file sırt' },
      { id: 'basic',     label: 'Basit',     icon: '—', description: 'Sade yastıklı ofis' },
      { id: 'executive', label: 'Yönetici',  icon: '♚', description: 'Geniş sırtlı yönetici' },
    ],
  },
  { type: 'filing-cabinet', label: 'Dosya Dolabı', icon: '🗄', category: 'calisma',
    dimDefs: [
      { key: 'width',  label: 'Genişlik', unit: 'cm', min: 35, max: 80,  def: 45  },
      { key: 'height', label: 'Yükseklik',unit: 'cm', min: 60, max: 140, def: 100 },
      { key: 'depth',  label: 'Derinlik', unit: 'cm', min: 40, max: 60,  def: 50  },
    ],
  },
  { type: 'bookcase', label: 'Ofis Kitaplığı', icon: '📚', category: 'calisma',
    dimDefs: [
      { key: 'width',  label: 'Genişlik',  unit: 'cm', min: 50, max: 150, def: 80  },
      { key: 'height', label: 'Yükseklik', unit: 'cm', min: 120, max: 240, def: 200 },
    ],
    variants: [
      { id: '3shelf',  label: '3 Raflı',    icon: '☰', description: 'Az raflı düşük' },
      { id: '5shelf',  label: '5 Raflı',    icon: '≣', description: 'Standart uzun' },
      { id: 'glass',   label: 'Cam Kapılı', icon: '◫', description: 'Camlı üst bölme' },
    ],
  },
  { type: 'monitor', label: 'Monitör', icon: '🖥', category: 'calisma',
    dimDefs: [{ key: 'diagonal', label: 'Ekran', unit: 'inç', min: 22, max: 34, def: 27 }],
  },

  // ══════════════════════════════════════════════════════════════════
  //  Çocuk Odası (5 tip — Agent B)
  // ══════════════════════════════════════════════════════════════════
  { type: 'crib', label: 'Beşik', icon: '🛏', category: 'cocuk',
    dimDefs: [
      { key: 'length', label: 'Uzunluk', unit: 'cm', min: 100, max: 140, def: 120 },
      { key: 'width',  label: 'Genişlik',unit: 'cm', min: 55,  max: 75,  def: 60  },
    ],
    variants: [
      { id: 'classic', label: 'Klasik', icon: '▦', description: 'Standart parmaklıklı' },
      { id: 'modern',  label: 'Modern', icon: '▭', description: 'Sade hatlı' },
    ],
  },
  { type: 'bunk-bed', label: 'Ranza', icon: '🏗', category: 'cocuk',
    dimDefs: [
      { key: 'length', label: 'Boy', unit: 'cm', min: 160, max: 220, def: 200 },
      { key: 'width',  label: 'En',  unit: 'cm', min: 80,  max: 120, def: 90  },
    ],
    variants: [
      { id: 'classic', label: 'Klasik',      icon: '⏚', description: 'İki katlı ranza' },
      { id: 'drawer',  label: 'Çekmeceli',   icon: '▦', description: 'Alt çekmeceli' },
      { id: 'desk',    label: 'Masalı Alt',  icon: '▣', description: 'Alt kat çalışma' },
    ],
  },
  { type: 'toy-storage', label: 'Oyuncak Kutusu', icon: '🧸', category: 'cocuk',
    dimDefs: [
      { key: 'width',  label: 'Genişlik',  unit: 'cm', min: 60, max: 140, def: 90 },
      { key: 'height', label: 'Yükseklik', unit: 'cm', min: 50, max: 100, def: 70 },
    ],
  },
  { type: 'kids-desk', label: 'Çocuk Masası', icon: '✏', category: 'cocuk',
    dimDefs: [
      { key: 'length', label: 'Uzunluk', unit: 'cm', min: 60, max: 100, def: 80 },
      { key: 'depth',  label: 'Derinlik',unit: 'cm', min: 40, max: 60,  def: 50 },
    ],
  },
  { type: 'changing-table', label: 'Bebek Bakım Masası', icon: '👶', category: 'cocuk',
    dimDefs: [
      { key: 'width', label: 'Genişlik', unit: 'cm', min: 70, max: 110, def: 90 },
      { key: 'depth', label: 'Derinlik', unit: 'cm', min: 45, max: 70,  def: 55 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  //  Bahçe / Dış Mekan (5 tip — Agent C)
  // ══════════════════════════════════════════════════════════════════
  { type: 'garden-chair', label: 'Bahçe Sandalyesi', icon: '🪑', category: 'bahce',
    dimDefs: [{ key: 'diameter', label: 'Çap', unit: 'cm', min: 40, max: 80, def: 55 }],
    variants: [
      { id: 'rattan', label: 'Rattan', icon: '🪑', description: 'Örgü rattan, doğal' },
      { id: 'metal',  label: 'Metal',  icon: '▭',  description: 'Ferforje dış mekan' },
    ],
  },
  { type: 'garden-table', label: 'Bahçe Masası', icon: '🍽', category: 'bahce',
    dimDefs: [{ key: 'diameter', label: 'Çap', unit: 'cm', min: 60, max: 180, def: 90 }],
    variants: [
      { id: 'round',  label: 'Yuvarlak', icon: '⭕', description: 'Cam üstlü' },
      { id: 'square', label: 'Köşeli',   icon: '◼', description: 'Kare ahşap' },
    ],
  },
  { type: 'umbrella', label: 'Güneş Şemsiyesi', icon: '⛱', category: 'bahce',
    dimDefs: [{ key: 'diameter', label: 'Çap', unit: 'cm', min: 150, max: 400, def: 250 }],
  },
  { type: 'hammock', label: 'Hamak', icon: '🛌', category: 'bahce',
    dimDefs: [{ key: 'length', label: 'Uzunluk', unit: 'cm', min: 180, max: 320, def: 220 }],
  },
  { type: 'bbq-grill', label: 'Mangal', icon: '🔥', category: 'bahce',
    dimDefs: [{ key: 'diameter', label: 'Çap', unit: 'cm', min: 40, max: 100, def: 55 }],
  },

  // ══════════════════════════════════════════════════════════════════
  //  Dekor genişleme (6 tip — Agent C)
  // ══════════════════════════════════════════════════════════════════
  { type: 'mirror', label: 'Ayna', icon: '🪞', category: 'dekor',
    dimDefs: [
      { key: 'width',  label: 'Genişlik',  unit: 'cm', min: 30, max: 150, def: 60 },
      { key: 'height', label: 'Yükseklik', unit: 'cm', min: 40, max: 200, def: 80 },
    ],
    variants: [
      { id: 'rectangle', label: 'Dikdörtgen', icon: '▭', description: 'Klasik çerçeve' },
      { id: 'round',     label: 'Yuvarlak',   icon: '⭕', description: 'Dairesel' },
      { id: 'oval',      label: 'Oval',       icon: '⬭', description: 'Uzun oval' },
    ],
  },
  { type: 'wall-art', label: 'Tablo', icon: '🖼', category: 'dekor',
    dimDefs: [
      { key: 'width',  label: 'Genişlik',  unit: 'cm', min: 30, max: 150, def: 60 },
      { key: 'height', label: 'Yükseklik', unit: 'cm', min: 30, max: 150, def: 80 },
    ],
    variants: [
      { id: 'modern',  label: 'Modern',   icon: '◻', description: 'Soyut, siyah' },
      { id: 'classic', label: 'Klasik',   icon: '◆', description: 'Altın yaldız' },
      { id: 'set',     label: 'Üçlü Set', icon: '▦', description: 'Üç parça' },
    ],
  },
  { type: 'vase', label: 'Vazo', icon: '🏺', category: 'dekor',
    dimDefs: [
      { key: 'diameter', label: 'Çap',       unit: 'cm', min: 10, max: 40, def: 20 },
      { key: 'height',   label: 'Yükseklik', unit: 'cm', min: 20, max: 80, def: 45 },
    ],
    variants: [
      { id: 'tall',  label: 'Uzun',  icon: '⬆', description: 'Uzun ince seramik' },
      { id: 'short', label: 'Kısa',  icon: '▢', description: 'Alçak masa üstü' },
      { id: 'wide',  label: 'Geniş', icon: '◎', description: 'Yayvan cam' },
    ],
  },
  { type: 'wall-clock', label: 'Duvar Saati', icon: '🕰', category: 'dekor',
    dimDefs: [{ key: 'diameter', label: 'Çap', unit: 'cm', min: 20, max: 80, def: 35 }],
    variants: [
      { id: 'round',  label: 'Yuvarlak', icon: '⭕', description: 'Klasik kadran' },
      { id: 'square', label: 'Köşeli',   icon: '◼', description: 'Modern kare' },
    ],
  },
  { type: 'curtain', label: 'Perde', icon: '🪟', category: 'dekor',
    dimDefs: [
      { key: 'width',  label: 'Genişlik',  unit: 'cm', min: 80,  max: 400, def: 180 },
      { key: 'height', label: 'Yükseklik', unit: 'cm', min: 150, max: 300, def: 220 },
    ],
    variants: [
      { id: 'pleated', label: 'Pileli',  icon: '⦚', description: 'Dalgalı pleated' },
      { id: 'flat',    label: 'Düz',     icon: '▤', description: 'Düz dökümlü' },
      { id: 'shades',  label: 'Stor',    icon: '☰', description: 'Yatay stor' },
    ],
  },
  { type: 'candle', label: 'Mum / Mumluk', icon: '🕯', category: 'dekor',
    dimDefs: [{ key: 'diameter', label: 'Çap', unit: 'cm', min: 15, max: 50, def: 25 }],
  },

  // ══════════════════════════════════════════════════════════════════
  //  Yapısal — Merdivenler (katlar arası bağlantı)
  // ══════════════════════════════════════════════════════════════════
  { type: 'stair', label: 'Merdiven', icon: '🪜', category: 'yapisal',
    dimDefs: [
      { key: 'height', label: 'Yükseklik', unit: 'cm', min: 240, max: 380, def: 280 },
      { key: 'width',  label: 'Genişlik',  unit: 'cm', min:  80, max: 140, def: 100 },
      { key: 'length', label: 'Uzunluk',   unit: 'cm', min: 250, max: 500, def: 350 },
    ],
    variants: [
      { id: 'straight', label: 'Düz',     icon: '↗', description: 'Tek yön düz merdiven' },
      { id: 'lshape',   label: 'L Şekli', icon: '⤴', description: 'Ortada 90° dönüş' },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  //  Yapısal Bahçe (Agent E) — havuz, çit, kapı, sera, çim, ağaç
  // ══════════════════════════════════════════════════════════════════
  { type: 'pool', label: 'Havuz', icon: '🏊', category: 'bahce',
    dimDefs: [
      { key: 'length', label: 'Uzunluk',  unit: 'cm', min: 300, max: 1500, def: 800 },
      { key: 'width',  label: 'Genişlik', unit: 'cm', min: 200, max: 800,  def: 400 },
      { key: 'depth',  label: 'Derinlik', unit: 'cm', min: 80,  max: 250,  def: 150 },
    ],
    variants: [
      { id: 'rectangle', label: 'Dikdörtgen', icon: '▭', description: 'Standart dikdörtgen' },
      { id: 'kidney',    label: 'Böbrek',     icon: '◐', description: 'Eğrisel böbrek şekli' },
      { id: 'lap',       label: 'Yüzme',      icon: '▬', description: 'Uzun yüzme kulvarı' },
    ],
  },
  { type: 'fence', label: 'Çit', icon: '🔲', category: 'bahce',
    dimDefs: [
      { key: 'length', label: 'Uzunluk',   unit: 'cm', min: 100, max: 800, def: 200 },
      { key: 'height', label: 'Yükseklik', unit: 'cm', min: 60,  max: 220, def: 120 },
    ],
    variants: [
      { id: 'wood',    label: 'Ahşap',  icon: '🪵', description: 'Tahta çubuklu klasik' },
      { id: 'metal',   label: 'Metal',  icon: '⚙',  description: 'Ferforje görünüm' },
      { id: 'privacy', label: 'Yüksek', icon: '▮',  description: 'Sık paneller, gizlilik' },
    ],
  },
  { type: 'gate', label: 'Bahçe Kapısı', icon: '🚪', category: 'bahce',
    dimDefs: [{ key: 'width', label: 'Genişlik', unit: 'cm', min: 80, max: 300, def: 150 }],
    variants: [
      { id: 'arched', label: 'Kemerli', icon: '⌒', description: 'Üstte kemer, demir kanatlar' },
      { id: 'flat',   label: 'Düz',     icon: '▭', description: 'Düz üst kiriş, sade' },
    ],
  },
  { type: 'greenhouse', label: 'Sera', icon: '🏡', category: 'bahce',
    dimDefs: [
      { key: 'width', label: 'Genişlik',  unit: 'cm', min: 150, max: 600, def: 300 },
      { key: 'depth', label: 'Derinlik',  unit: 'cm', min: 150, max: 500, def: 250 },
    ],
  },
  { type: 'grass-patch', label: 'Çim Alan', icon: '🌱', category: 'bahce',
    dimDefs: [
      { key: 'length', label: 'Uzunluk',  unit: 'cm', min: 100, max: 1500, def: 400 },
      { key: 'width',  label: 'Genişlik', unit: 'cm', min: 100, max: 1000, def: 300 },
    ],
  },
  { type: 'tree', label: 'Ağaç', icon: '🌳', category: 'bahce',
    dimDefs: [
      { key: 'height',   label: 'Yükseklik', unit: 'cm', min: 150, max: 900, def: 400 },
      { key: 'diameter', label: 'Taç Çapı',  unit: 'cm', min: 80,  max: 600, def: 200 },
    ],
    variants: [
      { id: 'round', label: 'Yaprak', icon: '🌳', description: 'Geniş küresel taç' },
      { id: 'pine',  label: 'Çam',    icon: '🌲', description: 'Sivri konik çam formu' },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  //  Yatak odası aksesuar (Agent F) — komodin + şifonyer
  // ══════════════════════════════════════════════════════════════════
  { type: 'nightstand', label: 'Komodin', icon: '🔲', category: 'yatak',
    dimDefs: [
      { key: 'width',  label: 'Genişlik',   unit: 'cm', min: 35, max: 70, def: 50 },
      { key: 'height', label: 'Yükseklik',  unit: 'cm', min: 40, max: 70, def: 55 },
    ],
  },
  { type: 'dresser', label: 'Şifonyer', icon: '🗄', category: 'yatak',
    dimDefs: [
      { key: 'width',  label: 'Genişlik',  unit: 'cm', min: 80,  max: 200, def: 140 },
      { key: 'height', label: 'Yükseklik', unit: 'cm', min: 70,  max: 120, def: 85  },
    ],
    variants: [
      { id: '3drawer', label: '3 Çekmece', icon: '☰' },
      { id: '4drawer', label: '4 Çekmece', icon: '▦' },
      { id: '6drawer', label: '6 Çekmece', icon: '⏚' },
    ],
  },
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
  lightIntensity?: number       // DEPRECATED — legacy 0-1 değeri (migration için saklanır)
  lumens?: number               // lümen (lm) — detaylı aydınlatma analizi
  colorTempK?: number           // renk sıcaklığı (Kelvin) 2200-6500
  lightOn?: boolean             // lamba açık/kapalı (default true)
  /**
   * #6 Multi-floor: Mobilyanın bağlı olduğu kat ID'si. Bir odaya pin'liyse
   * o odanın floorId'si; bağımsızsa oluşturulduğu andaki activeFloorId.
   * Eski layout'larda eksik olabilir — serialization varsayılan kata çeker.
   */
  floorId?: string
}

// ── Layout (Serialization) ──

export interface LayoutData {
  version: number
  rooms: Room[]
  furniture: FurnitureItem[]
  /** #6 Multi-floor: opsiyonel; eski layout'larda yok → varsayılan tek zemin */
  floors?: Floor[]
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

export type SelectionKind = 'room' | 'furniture' | 'opening' | 'wall' | null

export interface Selection {
  kind: SelectionKind
  id: string | null                // 'wall' için: wall side ('left' | 'right' | ...)
  parentId?: string | null         // 'opening' ve 'wall' için: roomId
}

// ── Constants ──

export const ROOM_COLORS = [0x4488ff, 0x44cc88, 0xff8844, 0x44cccc, 0xcc8844, 0xff44cc]
export const FURNITURE_COLORS = [0xffcc44, 0x44cc88, 0x6688ff, 0xff6644, 0xaa66cc, 0x44aacc, 0xff88aa, 0x88cc44, 0xcc8844, 0x44cccc, 0xff4488, 0x44ffcc]

export const MIN_DIM_CM = 20
export const MAX_DIM_CM = 5000

// ── Aydınlatma sabitleri ─────────────────────────────────────────
// Lümen ve Kelvin aralıkları UI slider sınırları ve default değerler.
// Referans: tipik LED ampul 800 lm ≈ 60W akkor eşdeğeri, 2700-3000K sıcak beyaz.
export const LUMEN_MIN = 100
export const LUMEN_MAX = 6000
export const KELVIN_MIN = 2200
export const KELVIN_MAX = 6500

/** Aydınlatma tipine göre varsayılan lümen (oda ortalaması için makul başlangıç) */
export const DEFAULT_LUMENS: Record<string, number> = {
  ceilinglamp: 1800,   // tavan — geniş alan aydınlatır
  floorlamp:    800,   // lambader — odak aydınlatma
  wallsconce:   400,   // duvar apliği — aksan
}

/** Aydınlatma tipine göre varsayılan renk sıcaklığı (K) */
export const DEFAULT_KELVIN: Record<string, number> = {
  ceilinglamp: 3000,   // sıcak beyaz (yaşam alanı)
  floorlamp:   2800,   // sıcak sarı (rahatlatıcı)
  wallsconce:  2700,   // çok sıcak (atmosferik)
}
