import type { LayoutData, Room, FurnitureItem } from '../types'

/**
 * Hazır plan şablonları — kullanıcı boş başlamak zorunda kalmasın.
 * Her biri rooms + furniture içeren LayoutData. importLayout() ile yüklenir.
 *
 * Koordinatlar: metre. (0,0) dünya merkezi.
 * Odalar position = merkez, widthCm/lengthCm = kenar uzunlukları.
 */

export interface Preset {
  id: string
  label: string
  description: string
  icon: string            // UI'da kart başlığı için emoji
  /** SVG viewBox koordinatlarında oda listesi — küçük thumbnail çizimi */
  data: LayoutData
}

const VERSION = 1

// Yardımcı: oda + mobilya kimlikleri deterministik olsun
function mkRoom(
  id: string,
  type: Room['type'],
  widthCm: number,
  lengthCm: number,
  position: [number, number],
  color: number,
  opts: Partial<Pick<Room, 'rotation' | 'wallColor' | 'wallColorOuter' | 'floorType' | 'openings' | 'removedWalls'>> = {}
): Room {
  return {
    id,
    type,
    widthCm,
    lengthCm,
    position,
    rotation: opts.rotation ?? 0,
    color,
    wallColor: opts.wallColor ?? '#e3ddd4',
    wallColorOuter: opts.wallColorOuter ?? '#c8c0b4',
    floorType: opts.floorType ?? (type === 'banyo' || type === 'mutfak' ? 'fayans' : 'parke'),
    openings: opts.openings ?? [],
    removedWalls: opts.removedWalls ?? [],
  }
}

function mkFurn(
  id: string,
  type: string,
  position: [number, number],
  dims: Record<string, number>,
  parentRoomId: string,
  rotation = 0,
  variant?: string,
  color = 0xffcc44
): FurnitureItem {
  return {
    id,
    type: type as FurnitureItem['type'],
    ...(variant ? { variant } : {}),
    dims,
    position,
    rotation,
    color,
    parentRoomId,
  }
}

// ═══════════════════════════════════════════════════════════════════
//  1. STÜDYO — tek hacim (salon + yatak + mutfak nişi)
// ═══════════════════════════════════════════════════════════════════
const studio: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p1-salon', 'salon', 500, 400, [0, 0], 0x4488ff),
  ],
  furniture: [
    mkFurn('p1-f1', 'sofa',     [-1.5, 0.8], { length: 220 }, 'p1-salon', 0, 'classic'),
    mkFurn('p1-f2', 'ctable',   [-1.5, -0.1], { diameter: 90 }, 'p1-salon', 0, 'round'),
    mkFurn('p1-f3', 'tvunit',   [-1.5, -1.4], { length: 180 }, 'p1-salon', 0, 'classic'),
    mkFurn('p1-f4', 'bed',      [1.4, -1.2], { length: 200, width: 140 }, 'p1-salon', 0, 'classic'),
    mkFurn('p1-f5', 'wardrobe', [1.8, 1.0], { width: 140, depth: 55 }, 'p1-salon', 0, 'classic'),
    mkFurn('p1-f6', 'rug',      [-1.5, 0.3], { length: 200, width: 140 }, 'p1-salon'),
    mkFurn('p1-f7', 'plant',    [2.0, 1.6], { diameter: 50 }, 'p1-salon', 0, 'tall'),
  ],
}

// ═══════════════════════════════════════════════════════════════════
//  2. 1+1 DAİRE — salon + 1 yatak odası + mutfak + banyo + koridor
// ═══════════════════════════════════════════════════════════════════
const apt1plus1: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p2-salon',   'salon',   430, 500, [2.15, 0],          0x4488ff),
    mkRoom('p2-yatak',   'yatak',   330, 340, [-1.65, -1.80],    0x44cc88),
    mkRoom('p2-mutfak',  'mutfak',  250, 340, [-1.25, 2.20],     0xff8844),
    mkRoom('p2-banyo',   'banyo',   190, 180, [1.20, 2.60],      0x44cccc),
    mkRoom('p2-koridor', 'koridor', 120, 340, [-0.40, 0.20],     0xcc8844),
  ],
  furniture: [
    // Salon
    mkFurn('p2-f1', 'sofa',    [1.90, 1.20],  { length: 240 }, 'p2-salon', 0, 'classic'),
    mkFurn('p2-f2', 'ctable',  [1.90, 0.20],  { diameter: 95 }, 'p2-salon', 0, 'round'),
    mkFurn('p2-f3', 'tvunit',  [1.90, -1.40], { length: 200 }, 'p2-salon', 0, 'classic'),
    mkFurn('p2-f4', 'chair',   [3.40, 0.80],  { diameter: 95 }, 'p2-salon', 0, 'berjer'),
    mkFurn('p2-f5', 'floorlamp', [3.60, 1.80], {}, 'p2-salon', 0, 'classic'),
    mkFurn('p2-f6', 'rug',     [1.90, 0.40], { length: 260, width: 180 }, 'p2-salon'),
    mkFurn('p2-f7', 'ceilinglamp', [2.15, 0], { diameter: 55 }, 'p2-salon', 0, 'pendant'),
    // Yatak odası
    mkFurn('p2-f8', 'bed',      [-1.80, -1.80], { length: 200, width: 160 }, 'p2-yatak', 0, 'classic'),
    mkFurn('p2-f9', 'wardrobe', [-1.00, -2.95], { width: 180, depth: 60 }, 'p2-yatak', 0, 'classic'),
    mkFurn('p2-f10', 'ceilinglamp', [-1.65, -1.80], { diameter: 45 }, 'p2-yatak', 0, 'panel'),
    // Mutfak
    mkFurn('p2-f11', 'counter',  [-1.80, 2.30], { length: 200, depth: 60 }, 'p2-mutfak', 0),
    mkFurn('p2-f12', 'fridge',   [-1.80, 3.50], { width: 70, depth: 65 }, 'p2-mutfak', 0, 'classic'),
    mkFurn('p2-f13', 'ankastre', [-1.80, 2.10], { width: 60 }, 'p2-mutfak', 0),
    mkFurn('p2-f14', 'kitchencab', [-1.80, 1.20], { width: 90, depth: 35 }, 'p2-mutfak', 0),
    // Banyo
    mkFurn('p2-f15', 'washer', [0.90, 2.60], {}, 'p2-banyo', 0),
  ],
}

// ═══════════════════════════════════════════════════════════════════
//  3. 2+1 DAİRE
// ═══════════════════════════════════════════════════════════════════
const apt2plus1: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p3-salon',    'salon',    450, 520, [2.75, -0.60], 0x4488ff),
    mkRoom('p3-yatak1',   'yatak',    340, 360, [-2.00, -2.30], 0x44cc88),
    mkRoom('p3-yatak2',   'cocuk',    300, 320, [-2.10, 1.30], 0xff44cc),
    mkRoom('p3-mutfak',   'mutfak',   260, 340, [0.00, 2.80], 0xff8844),
    mkRoom('p3-banyo',    'banyo',    190, 200, [2.55, 2.80], 0x44cccc),
    mkRoom('p3-koridor',  'koridor',  140, 360, [-0.35, -0.30], 0xcc8844),
  ],
  furniture: [
    // Salon
    mkFurn('p3-f1', 'lsofa',  [2.70, 0.40], { length: 300, width: 220, depth: 95 }, 'p3-salon', 0, 'classic'),
    mkFurn('p3-f2', 'ctable', [2.70, -0.80], { diameter: 110 }, 'p3-salon', 0, 'square'),
    mkFurn('p3-f3', 'tvunit', [2.70, -2.60], { length: 220 }, 'p3-salon', 0, 'classic'),
    mkFurn('p3-f4', 'rug',    [2.70, -0.50], { length: 280, width: 200 }, 'p3-salon'),
    mkFurn('p3-f5', 'ceilinglamp', [2.75, -0.60], { diameter: 60 }, 'p3-salon', 0, 'chandelier'),
    mkFurn('p3-f6', 'plant', [4.20, 1.20], { diameter: 55 }, 'p3-salon', 0, 'tall'),
    // Yatak 1 (ebeveyn)
    mkFurn('p3-f7', 'bed',      [-2.20, -2.40], { length: 200, width: 160 }, 'p3-yatak1', 0, 'tufted'),
    mkFurn('p3-f8', 'wardrobe', [-1.20, -3.40], { width: 200, depth: 60 }, 'p3-yatak1', Math.PI / 2, 'sliding'),
    mkFurn('p3-f9', 'floorlamp', [-3.20, -1.50], {}, 'p3-yatak1', 0, 'classic'),
    // Çocuk odası
    mkFurn('p3-f10', 'bed',      [-2.30, 1.30], { length: 190, width: 110 }, 'p3-yatak2', 0, 'modern'),
    mkFurn('p3-f11', 'wardrobe', [-1.20, 2.30], { width: 140, depth: 55 }, 'p3-yatak2', 0, 'classic'),
    mkFurn('p3-f12', 'shelf',    [-3.20, 2.20], { width: 80, height: 160 }, 'p3-yatak2', 0, 'classic'),
    // Mutfak
    mkFurn('p3-f13', 'counter', [-0.20, 2.50], { length: 200, depth: 60 }, 'p3-mutfak', 0),
    mkFurn('p3-f14', 'fridge',  [0.90, 1.70], { width: 70, depth: 65 }, 'p3-mutfak', 0, 'classic'),
    mkFurn('p3-f15', 'dtable',  [-0.10, 3.50], { length: 140, width: 80 }, 'p3-mutfak', 0, 'classic'),
    mkFurn('p3-f16', 'dchair',  [-0.60, 3.50], {}, 'p3-mutfak', Math.PI / 2, 'classic'),
    mkFurn('p3-f17', 'dchair',  [0.40, 3.50], {}, 'p3-mutfak', -Math.PI / 2, 'classic'),
  ],
}

// ═══════════════════════════════════════════════════════════════════
//  4. 3+1 DAİRE
// ═══════════════════════════════════════════════════════════════════
const apt3plus1: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p4-salon',   'salon',   480, 540, [3.00, -0.50], 0x4488ff),
    mkRoom('p4-yatak1',  'yatak',   360, 380, [-2.30, -2.50], 0x44cc88),
    mkRoom('p4-yatak2',  'yatak',   310, 340, [-2.30, 0.55], 0x6688ff),
    mkRoom('p4-cocuk',   'cocuk',   310, 320, [-2.30, 2.95], 0xff44cc),
    mkRoom('p4-mutfak',  'mutfak',  290, 360, [0.30, 3.20],  0xff8844),
    mkRoom('p4-banyo',   'banyo',   190, 200, [2.85, 3.30],  0x44cccc),
    mkRoom('p4-koridor', 'koridor', 140, 460, [-0.35, 0.00], 0xcc8844),
  ],
  furniture: [
    // Salon
    mkFurn('p4-f1', 'lsofa',  [3.10, 0.40], { length: 320, width: 240, depth: 100 }, 'p4-salon', 0, 'chaise'),
    mkFurn('p4-f2', 'ctable', [3.10, -0.90], { diameter: 110 }, 'p4-salon', 0, 'marble'),
    mkFurn('p4-f3', 'tvunit', [3.10, -2.80], { length: 240 }, 'p4-salon', 0, 'floating'),
    mkFurn('p4-f4', 'rug',    [3.10, -0.60], { length: 300, width: 220 }, 'p4-salon'),
    mkFurn('p4-f5', 'ceilinglamp', [3.00, -0.50], { diameter: 65 }, 'p4-salon', 0, 'chandelier'),
    mkFurn('p4-f6', 'plant', [4.80, 1.30], { diameter: 60 }, 'p4-salon', 0, 'tall'),
    mkFurn('p4-f7', 'chair', [4.80, -1.00], { diameter: 100 }, 'p4-salon', -Math.PI / 4, 'accent'),
    // Ebeveyn yatak
    mkFurn('p4-f8', 'bed',      [-2.50, -2.60], { length: 200, width: 180 }, 'p4-yatak1', 0, 'tufted'),
    mkFurn('p4-f9', 'wardrobe', [-1.30, -3.80], { width: 220, depth: 60 }, 'p4-yatak1', Math.PI / 2, 'sliding'),
    // Misafir yatak
    mkFurn('p4-f10', 'bed',     [-2.50, 0.55], { length: 200, width: 140 }, 'p4-yatak2', 0, 'classic'),
    mkFurn('p4-f11', 'wardrobe', [-1.40, 0.10], { width: 140, depth: 55 }, 'p4-yatak2', Math.PI / 2, 'classic'),
    // Çocuk
    mkFurn('p4-f12', 'bed',      [-2.50, 2.95], { length: 190, width: 110 }, 'p4-cocuk', 0, 'modern'),
    mkFurn('p4-f13', 'shelf',    [-3.20, 3.60], { width: 100, height: 180 }, 'p4-cocuk', 0, 'cube'),
    // Mutfak
    mkFurn('p4-f14', 'counter', [0.00, 2.85], { length: 240, depth: 60 }, 'p4-mutfak', 0),
    mkFurn('p4-f15', 'fridge',  [1.40, 2.20], { width: 80, depth: 70 }, 'p4-mutfak', 0, 'french'),
    mkFurn('p4-f16', 'dtable',  [0.30, 3.80], { length: 160, width: 90 }, 'p4-mutfak', 0, 'classic'),
    mkFurn('p4-f17', 'dchair',  [-0.30, 3.80], {}, 'p4-mutfak', Math.PI / 2, 'classic'),
    mkFurn('p4-f18', 'dchair',  [0.90, 3.80], {}, 'p4-mutfak', -Math.PI / 2, 'classic'),
    mkFurn('p4-f19', 'washer',  [3.60, 3.30], {}, 'p4-banyo', 0),
  ],
}

// ═══════════════════════════════════════════════════════════════════
//  5. GENİŞ AÇIK PLAN — minimalist villa yaklaşımı
// ═══════════════════════════════════════════════════════════════════
const openPlan: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p5-salon',  'salon',   680, 620, [0.00, 0.00], 0x4488ff),
    mkRoom('p5-yatak',  'yatak',   420, 440, [-5.10, -1.00], 0x44cc88),
    mkRoom('p5-banyo',  'banyo',   250, 260, [-5.00, 2.00], 0x44cccc),
  ],
  furniture: [
    // Salon + yemek birleşik
    mkFurn('p5-f1', 'lsofa',  [-1.00, 1.00], { length: 340, width: 240, depth: 100 }, 'p5-salon', 0, 'modern'),
    mkFurn('p5-f2', 'ctable', [-1.00, -0.40], { diameter: 120 }, 'p5-salon', 0, 'marble'),
    mkFurn('p5-f3', 'tvunit', [-1.00, -2.60], { length: 260 }, 'p5-salon', 0, 'floating'),
    mkFurn('p5-f4', 'rug',    [-1.00, -0.20], { length: 340, width: 240 }, 'p5-salon'),
    mkFurn('p5-f5', 'ceilinglamp', [-1.00, -0.30], { diameter: 70 }, 'p5-salon', 0, 'chandelier'),
    // Yemek alanı (salon içinde)
    mkFurn('p5-f6', 'dtable',  [2.20, -0.50], { length: 200, width: 95 }, 'p5-salon', 0, 'modern'),
    mkFurn('p5-f7', 'dchair',  [1.30, -0.50], {}, 'p5-salon', Math.PI / 2, 'upholstered'),
    mkFurn('p5-f8', 'dchair',  [3.10, -0.50], {}, 'p5-salon', -Math.PI / 2, 'upholstered'),
    mkFurn('p5-f9', 'dchair',  [2.20, 0.10], {}, 'p5-salon', 0, 'upholstered'),
    mkFurn('p5-f10', 'dchair', [2.20, -1.10], {}, 'p5-salon', Math.PI, 'upholstered'),
    // Açık mutfak
    mkFurn('p5-f11', 'counter',   [2.50, -2.70], { length: 300, depth: 65 }, 'p5-salon', 0),
    mkFurn('p5-f12', 'fridge',    [3.20, -1.80], { width: 90, depth: 75 }, 'p5-salon', 0, 'sidebyside'),
    mkFurn('p5-f13', 'kitchencab', [1.50, -2.70], { width: 120, depth: 40 }, 'p5-salon', 0, 'classic'),
    mkFurn('p5-f14', 'plant',     [3.10, 2.50], { diameter: 70 }, 'p5-salon', 0, 'tall'),
    // Yatak odası
    mkFurn('p5-f15', 'bed',      [-5.20, -1.00], { length: 210, width: 180 }, 'p5-yatak', 0, 'tufted'),
    mkFurn('p5-f16', 'wardrobe', [-3.90, -2.30], { width: 240, depth: 60 }, 'p5-yatak', Math.PI / 2, 'sliding'),
    mkFurn('p5-f17', 'ceilinglamp', [-5.10, -1.00], { diameter: 50 }, 'p5-yatak', 0, 'pendant'),
    // Banyo
    mkFurn('p5-f18', 'washer',    [-4.40, 2.00], {}, 'p5-banyo', 0),
  ],
}

export const PRESETS: Preset[] = [
  {
    id: 'studio',
    label: 'Stüdyo',
    description: 'Tek hacimli stüdyo — salon + yatak + mutfak nişi bir arada. Küçük metrekare için.',
    icon: '🏢',
    data: studio,
  },
  {
    id: '1plus1',
    label: '1+1 Daire',
    description: 'Salon, 1 yatak odası, mutfak, banyo ve koridor. Genç çift için klasik plan.',
    icon: '🏠',
    data: apt1plus1,
  },
  {
    id: '2plus1',
    label: '2+1 Daire',
    description: 'Salon, ebeveyn + çocuk odası, mutfak, banyo. Küçük aile için.',
    icon: '🏡',
    data: apt2plus1,
  },
  {
    id: '3plus1',
    label: '3+1 Daire',
    description: 'Salon + 3 yatak odası + geniş mutfak + banyo. Geniş aile için.',
    icon: '🏘',
    data: apt3plus1,
  },
  {
    id: 'open-plan',
    label: 'Açık Plan',
    description: 'Salon + yemek + mutfak tek hacim, geniş yatak + banyo. Modern minimalist.',
    icon: '🏛',
    data: openPlan,
  },
]
