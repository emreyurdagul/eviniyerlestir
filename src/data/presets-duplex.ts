/**
 * Dubleks (2 katlı) ev varyasyonları — 6 farklı plan.
 *
 * Her preset 2 kat içerir; oda.floorId ile katlara bağlanır.
 * Zemin kat: salon + mutfak + WC + yemek + merdiven
 * 1. kat   : yatak odaları + ebeveyn banyosu
 *
 * KOORDİNAT SİSTEMİ: presets.ts dosyasındaki ile aynı.
 *   position = [x, z] → odanın DÜNYA MERKEZİ (metre)
 *   widthCm  → X eksenindeki genişlik (cm)
 *   lengthCm → Z eksenindeki derinlik (cm)
 *
 * ÖNEMLİ: Farklı katlarda aynı (x,z) koordinat kullanılabilir; çakışma
 * YOKTUR çünkü Y ekseninde (baseY) ayrılırlar. Sadece AYNI KAT içindeki
 * odaların X-Z bbox'ları çakışmamalıdır.
 *
 * MERDİVEN: Her dubleks'te MUTLAKA bir `stair` mobilyası vardır. Merdiven
 * zemin katta bir odanın içine yerleştirilir (salon kenarı / hol) ve yukarı
 * çıkar. 1. kattaki devamı render katmanının sorumluluğundadır.
 */

import type { LayoutData, Room, FurnitureItem, Floor } from '../types'
import type { Preset } from './presets'

const VERSION = 1

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

/** mkRoom + floorId (tek adımda). */
function mkRoomOnFloor(
  floorId: string,
  id: string,
  type: Room['type'],
  widthCm: number,
  lengthCm: number,
  position: [number, number],
  color: number,
  opts: Partial<Pick<Room, 'rotation' | 'wallColor' | 'wallColorOuter' | 'floorType' | 'openings' | 'removedWalls'>> = {}
): Room {
  return { ...mkRoom(id, type, widthCm, lengthCm, position, color, opts), floorId }
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

/** Mobilyaya floorId ekleyen tek adım helper. */
function mkFurnOnFloor(
  floorId: string,
  id: string,
  type: string,
  position: [number, number],
  dims: Record<string, number>,
  parentRoomId: string,
  rotation = 0,
  variant?: string,
  color = 0xffcc44
): FurnitureItem {
  return { ...mkFurn(id, type, position, dims, parentRoomId, rotation, variant, color), floorId }
}

/**
 * 2 katlı standart kat tanımı.
 * Zemin kat y=0, 1. kat y=ceilingHeight (varsayılan 2.80 m).
 */
function mkFloors(ceilingH = 2.80): Floor[] {
  return [
    { id: 'floor-ground', label: 'Zemin Kat', order: 0, baseY: 0,         ceilingHeight: ceilingH },
    { id: 'floor-1',      label: '1. Kat',    order: 1, baseY: ceilingH,  ceilingHeight: ceilingH },
  ]
}

const G = 'floor-ground'
const U = 'floor-1'

// ═══════════════════════════════════════════════════════════════════
//  1. DUBLEKS KLASİK
//  Zemin kat:
//    SALON   500×450  center (0.00, 0.00)   bbox x[-2.50, 2.50]  z[-2.25, 2.25]
//    MUTFAK  280×300  center (-3.90,-0.75)  bbox x[-5.30,-2.50]  z[-2.25, 0.75]
//    WC      180×200  center (-3.40, 2.25)  bbox x[-4.30,-2.50]  z[ 1.25, 3.25]
//    YEMEK   240×220  center (0.00, 3.35)   bbox x[-1.20, 1.20]  z[ 2.25, 4.45]
//  1. kat:
//    EBEVEYN 360×400  center (-1.20, 0.00)  bbox x[-3.00, 0.60]  z[-2.00, 2.00]
//    COCUK1  300×340  center ( 2.10, -0.30) bbox x[ 0.60, 3.60]  z[-2.00, 1.40]
//    BANYO   200×260  center ( 2.10,  2.70) bbox x[ 1.10, 3.10]  z[ 1.40, 4.00]
// ═══════════════════════════════════════════════════════════════════
const duplexClassic: LayoutData = {
  version: VERSION,
  floors: mkFloors(2.80),
  rooms: [
    // Zemin kat
    mkRoomOnFloor(G, 'd1-salon',  'salon',  500, 450, [ 0.00,  0.00], 0x4488ff),
    mkRoomOnFloor(G, 'd1-mutfak', 'mutfak', 280, 300, [-3.90, -0.75], 0xff8844, { removedWalls: ['right'] }),
    mkRoomOnFloor(G, 'd1-wc',     'banyo',  180, 200, [-3.40,  2.25], 0x44cccc, { removedWalls: ['right'] }),
    mkRoomOnFloor(G, 'd1-yemek',  'salon',  240, 220, [ 0.00,  3.35], 0xcc8844, { removedWalls: ['back'] }),
    // 1. kat
    mkRoomOnFloor(U, 'd1-ebeveyn','yatak',  360, 400, [-1.20,  0.00], 0x44cc88),
    mkRoomOnFloor(U, 'd1-cocuk1', 'cocuk',  300, 340, [ 2.10, -0.30], 0xff44cc, { removedWalls: ['left'] }),
    mkRoomOnFloor(U, 'd1-banyo',  'banyo',  200, 260, [ 2.10,  2.70], 0x44cccc, { removedWalls: ['back', 'left'] }),
  ],
  furniture: [
    // ── Zemin kat ─────────────────────────────────
    // Salon — bbox x[-2.5,2.5] z[-2.25,2.25]
    mkFurnOnFloor(G, 'd1-f1',  'lsofa',       [ 0.00,  0.80], { length: 280, width: 200, depth: 95 }, 'd1-salon', Math.PI, 'classic'),
    mkFurnOnFloor(G, 'd1-f2',  'ctable',      [ 0.00, -0.20], { diameter: 100 },                      'd1-salon', 0,       'square'),
    mkFurnOnFloor(G, 'd1-f3',  'tvunit',      [ 0.00, -1.95], { length: 220 },                        'd1-salon', 0, 'classic'),
    mkFurnOnFloor(G, 'd1-f4',  'chair',       [ 2.00,  0.40], { diameter: 95 },                       'd1-salon', -Math.PI/4, 'berjer'),
    mkFurnOnFloor(G, 'd1-f5',  'rug',         [ 0.00,  0.10], { length: 240, width: 180 },            'd1-salon'),
    mkFurnOnFloor(G, 'd1-f6',  'plant',       [ 2.20, -1.80], { diameter: 55 },                       'd1-salon', 0,       'tall'),
    mkFurnOnFloor(G, 'd1-f7',  'wall-art',    [-2.30, -1.50], { width: 90, height: 60 },              'd1-salon', Math.PI/2, 'modern'),
    mkFurnOnFloor(G, 'd1-f8',  'mirror',      [ 2.30,  1.80], { width: 50, height: 120 },             'd1-salon', -Math.PI/2, 'rectangle'),
    mkFurnOnFloor(G, 'd1-f9',  'ceilinglamp', [ 0.00,  0.00], { diameter: 55 },                       'd1-salon', 0,       'chandelier'),
    // Merdiven — salonun sağ arka köşesi
    mkFurnOnFloor(G, 'd1-stair','stair',      [ 1.80,  1.70], { height: 280, width: 100, length: 300 },'d1-salon', Math.PI, 'straight'),
    // Mutfak — bbox x[-5.3,-2.5] z[-2.25,0.75]
    mkFurnOnFloor(G, 'd1-f11', 'counter',     [-3.90, -1.90], { length: 240, depth: 60 },             'd1-mutfak', 0),
    mkFurnOnFloor(G, 'd1-f12', 'kitchencab',  [-5.05, -0.80], { width: 60, depth: 35 },               'd1-mutfak', Math.PI/2),
    mkFurnOnFloor(G, 'd1-f13', 'fridge',      [-5.00,  0.40], { width: 70, depth: 60 },               'd1-mutfak', Math.PI/2, 'french'),
    mkFurnOnFloor(G, 'd1-f14', 'ankastre',    [-3.20, -1.90], { width: 60 },                          'd1-mutfak', 0),
    mkFurnOnFloor(G, 'd1-f15', 'dishwasher',  [-4.50, -1.90], {},                                     'd1-mutfak', 0),
    // WC — bbox x[-4.3,-2.5] z[1.25,3.25]
    mkFurnOnFloor(G, 'd1-f16', 'toilet',      [-4.00,  3.00], { depth: 65 },                          'd1-wc', Math.PI, 'wall'),
    mkFurnOnFloor(G, 'd1-f17', 'sink',        [-2.75,  2.25], { width: 50 },                          'd1-wc', -Math.PI/2, 'round'),
    // Yemek — bbox x[-1.2,1.2] z[2.25,4.45]
    mkFurnOnFloor(G, 'd1-f18', 'dtable',      [ 0.00,  3.30], { length: 180, width: 90 },             'd1-yemek', 0, 'classic'),
    mkFurnOnFloor(G, 'd1-f19', 'dchair',      [-0.70,  2.70], {},                                     'd1-yemek', Math.PI, 'classic'),
    mkFurnOnFloor(G, 'd1-f20', 'dchair',      [ 0.00,  2.70], {},                                     'd1-yemek', Math.PI, 'classic'),
    mkFurnOnFloor(G, 'd1-f21', 'dchair',      [ 0.70,  2.70], {},                                     'd1-yemek', Math.PI, 'classic'),
    mkFurnOnFloor(G, 'd1-f22', 'dchair',      [-0.70,  3.90], {},                                     'd1-yemek', 0, 'classic'),
    mkFurnOnFloor(G, 'd1-f23', 'dchair',      [ 0.00,  3.90], {},                                     'd1-yemek', 0, 'classic'),
    mkFurnOnFloor(G, 'd1-f24', 'dchair',      [ 0.70,  3.90], {},                                     'd1-yemek', 0, 'classic'),
    // ── 1. kat ─────────────────────────────────
    // Ebeveyn — bbox x[-3.0,0.6] z[-2.0,2.0]
    mkFurnOnFloor(U, 'd1-f30', 'bed',         [-1.20, -0.60], { length: 210, width: 180 },            'd1-ebeveyn', 0,       'tufted'),
    mkFurnOnFloor(U, 'd1-f31', 'nightstand',  [-2.30, -1.40], {},                                     'd1-ebeveyn', 0),
    mkFurnOnFloor(U, 'd1-f32', 'nightstand',  [-0.10, -1.40], {},                                     'd1-ebeveyn', 0),
    mkFurnOnFloor(U, 'd1-f33', 'wardrobe',    [-1.20,  1.60], { width: 220, depth: 60 },              'd1-ebeveyn', Math.PI, 'sliding'),
    mkFurnOnFloor(U, 'd1-f34', 'dresser',     [-2.70,  1.00], { width: 120, depth: 50 },              'd1-ebeveyn', Math.PI/2),
    mkFurnOnFloor(U, 'd1-f35', 'mirror',      [-2.80,  0.10], { width: 60, height: 140 },             'd1-ebeveyn', -Math.PI/2, 'oval'),
    mkFurnOnFloor(U, 'd1-f36', 'ceilinglamp', [-1.20,  0.00], { diameter: 50 },                       'd1-ebeveyn', 0,       'pendant'),
    // Çocuk1 — bbox x[0.6,3.6] z[-2.0,1.4]
    mkFurnOnFloor(U, 'd1-f40', 'bed',         [ 1.20, -1.10], { length: 200, width: 100 },            'd1-cocuk1', 0,        'modern'),
    mkFurnOnFloor(U, 'd1-f41', 'wardrobe',    [ 3.20,  0.70], { width: 120, depth: 55 },              'd1-cocuk1', -Math.PI/2, 'classic'),
    mkFurnOnFloor(U, 'd1-f42', 'desk',        [ 2.10,  1.15], { length: 120, depth: 60 },             'd1-cocuk1', Math.PI, 'classic'),
    mkFurnOnFloor(U, 'd1-f43', 'office-chair',[ 2.10,  0.50], {},                                     'd1-cocuk1', 0,        'ergonomic'),
    mkFurnOnFloor(U, 'd1-f44', 'bookcase',    [ 3.30, -0.90], { width: 80, height: 180 },             'd1-cocuk1', -Math.PI/2, '5shelf'),
    mkFurnOnFloor(U, 'd1-f45', 'toy-storage', [ 0.85,  0.80], { width: 90, height: 60 },              'd1-cocuk1', Math.PI/2),
    // Banyo — bbox x[1.1,3.1] z[1.4,4.0]
    mkFurnOnFloor(U, 'd1-f50', 'toilet',      [ 1.40,  3.70], { depth: 68 },                          'd1-banyo', Math.PI, 'wall'),
    mkFurnOnFloor(U, 'd1-f51', 'sink',        [ 1.40,  1.70], { width: 80 },                          'd1-banyo', 0,        'square'),
    mkFurnOnFloor(U, 'd1-f52', 'bathtub',     [ 2.60,  2.70], { length: 170, width: 75 },             'd1-banyo', Math.PI/2, 'classic'),
    mkFurnOnFloor(U, 'd1-f53', 'bathroom-cabinet',[ 1.40,  1.90], { width: 80, height: 70 },          'd1-banyo', 0,        'double'),
  ],
}

// ═══════════════════════════════════════════════════════════════════
//  2. DUBLEKS MODERN — açık plan, büyük salon
//  Zemin kat:
//    SALON   650×500  center ( 0.00, 0.00)  bbox x[-3.25, 3.25]  z[-2.50, 2.50]
//    MUTFAK  300×280  center (-4.75,-1.10)  bbox x[-6.25,-3.25]  z[-2.50, 0.30]
//    WC      180×200  center (-4.15, 1.50)  bbox x[-5.05,-3.25]  z[ 0.50, 2.50]
//  1. kat:
//    EBEVEYN 400×380  center (-1.80, 0.10)  bbox x[-3.80, 0.20]  z[-1.80, 2.00]
//    COCUK1  320×340  center ( 1.80,-0.10)  bbox x[ 0.20, 3.40]  z[-1.80, 1.60]
//    BANYO   220×260  center ( 2.30, 3.00)  bbox x[ 1.20, 3.40]  z[ 1.70, 4.30]
// ═══════════════════════════════════════════════════════════════════
const duplexModern: LayoutData = {
  version: VERSION,
  floors: mkFloors(3.00),
  rooms: [
    mkRoomOnFloor(G, 'd2-salon',  'salon',  650, 500, [ 0.00,  0.00], 0x4488ff, { wallColor: '#f5f5f0' }),
    mkRoomOnFloor(G, 'd2-mutfak', 'mutfak', 300, 280, [-4.75, -1.10], 0xff8844, { removedWalls: ['right'] }),
    mkRoomOnFloor(G, 'd2-wc',     'banyo',  180, 200, [-4.15,  1.50], 0x44cccc, { removedWalls: ['right'] }),
    mkRoomOnFloor(U, 'd2-ebeveyn','yatak',  400, 380, [-1.80,  0.10], 0x44cc88),
    mkRoomOnFloor(U, 'd2-cocuk1', 'cocuk',  320, 340, [ 1.80, -0.10], 0xff44cc, { removedWalls: ['left'] }),
    mkRoomOnFloor(U, 'd2-banyo',  'banyo',  220, 260, [ 2.30,  3.00], 0x44cccc),
  ],
  furniture: [
    // Salon
    mkFurnOnFloor(G, 'd2-f1',  'lsofa',       [-0.80,  1.00], { length: 320, width: 220, depth: 100 }, 'd2-salon', Math.PI, 'modern'),
    mkFurnOnFloor(G, 'd2-f2',  'ctable',      [-0.80, -0.20], { diameter: 120 },                       'd2-salon', 0,       'marble'),
    mkFurnOnFloor(G, 'd2-f3',  'tvunit',      [-0.80, -2.20], { length: 280 },                        'd2-salon', 0, 'floating'),
    mkFurnOnFloor(G, 'd2-f4',  'rug',         [-0.80,  0.20], { length: 300, width: 220 },            'd2-salon'),
    mkFurnOnFloor(G, 'd2-f5',  'floorlamp',   [-2.80,  1.70], {},                                     'd2-salon', 0,       'arc'),
    mkFurnOnFloor(G, 'd2-f6',  'plant',       [ 2.80, -2.10], { diameter: 60 },                       'd2-salon', 0,       'tall'),
    // Yemek alanı salon içinde (açık plan)
    mkFurnOnFloor(G, 'd2-f7',  'dtable',      [ 2.20,  0.80], { length: 200, width: 100 },            'd2-salon', 0,       'modern'),
    mkFurnOnFloor(G, 'd2-f8',  'dchair',      [ 1.40,  0.20], {},                                     'd2-salon', Math.PI, 'upholstered'),
    mkFurnOnFloor(G, 'd2-f9',  'dchair',      [ 2.20,  0.20], {},                                     'd2-salon', Math.PI, 'upholstered'),
    mkFurnOnFloor(G, 'd2-f10', 'dchair',      [ 3.00,  0.20], {},                                     'd2-salon', Math.PI, 'upholstered'),
    mkFurnOnFloor(G, 'd2-f11', 'dchair',      [ 1.40,  1.40], {},                                     'd2-salon', 0,       'upholstered'),
    mkFurnOnFloor(G, 'd2-f12', 'dchair',      [ 2.20,  1.40], {},                                     'd2-salon', 0,       'upholstered'),
    mkFurnOnFloor(G, 'd2-f13', 'dchair',      [ 3.00,  1.40], {},                                     'd2-salon', 0,       'upholstered'),
    mkFurnOnFloor(G, 'd2-f14', 'ceilinglamp', [ 2.20,  0.80], { diameter: 60 },                       'd2-salon', 0,       'pendant'),
    // Merdiven (modern L)
    mkFurnOnFloor(G, 'd2-stair','stair',      [ 2.70,  2.00], { height: 300, width: 110, length: 320 },'d2-salon', 0,       'lshape'),
    // Mutfak
    mkFurnOnFloor(G, 'd2-f20', 'counter',     [-4.75, -2.15], { length: 260, depth: 60 },             'd2-mutfak', 0),
    mkFurnOnFloor(G, 'd2-f21', 'kitchencab',  [-6.00, -1.10], { width: 70, depth: 40 },               'd2-mutfak', Math.PI/2),
    mkFurnOnFloor(G, 'd2-f22', 'fridge',      [-5.90, -0.10], { width: 80, depth: 65 },               'd2-mutfak', Math.PI/2, 'sidebyside'),
    mkFurnOnFloor(G, 'd2-f23', 'ankastre',    [-4.30, -2.10], { width: 70 },                          'd2-mutfak', 0),
    mkFurnOnFloor(G, 'd2-f24', 'dishwasher',  [-5.20, -2.10], {},                                     'd2-mutfak', 0),
    // WC
    mkFurnOnFloor(G, 'd2-f25', 'toilet',      [-4.80,  2.25], { depth: 65 },                          'd2-wc', Math.PI, 'wall'),
    mkFurnOnFloor(G, 'd2-f26', 'sink',        [-3.50,  1.50], { width: 50 },                          'd2-wc', -Math.PI/2, 'square'),
    // Ebeveyn
    mkFurnOnFloor(U, 'd2-f30', 'bed',         [-1.80, -0.50], { length: 210, width: 180 },            'd2-ebeveyn', 0,       'modern'),
    mkFurnOnFloor(U, 'd2-f31', 'nightstand',  [-2.90, -1.30], {},                                     'd2-ebeveyn', 0),
    mkFurnOnFloor(U, 'd2-f32', 'nightstand',  [-0.70, -1.30], {},                                     'd2-ebeveyn', 0),
    mkFurnOnFloor(U, 'd2-f33', 'wardrobe',    [-1.80,  1.70], { width: 260, depth: 65 },              'd2-ebeveyn', Math.PI, 'sliding'),
    mkFurnOnFloor(U, 'd2-f34', 'dresser',     [-3.50,  0.80], { width: 140, depth: 50 },              'd2-ebeveyn', Math.PI/2),
    mkFurnOnFloor(U, 'd2-f35', 'mirror',      [-3.55, -0.20], { width: 70, height: 150 },             'd2-ebeveyn', -Math.PI/2, 'rectangle'),
    mkFurnOnFloor(U, 'd2-f36', 'ceilinglamp', [-1.80,  0.10], { diameter: 50 },                       'd2-ebeveyn', 0,       'pendant'),
    // Çocuk
    mkFurnOnFloor(U, 'd2-f40', 'bunk-bed',    [ 0.80, -1.00], { length: 200, width: 100 },            'd2-cocuk1', 0,        'drawer'),
    mkFurnOnFloor(U, 'd2-f41', 'wardrobe',    [ 3.00,  0.90], { width: 140, depth: 55 },              'd2-cocuk1', -Math.PI/2),
    mkFurnOnFloor(U, 'd2-f42', 'kids-desk',   [ 1.80,  1.20], { length: 90, depth: 55 },              'd2-cocuk1', Math.PI),
    mkFurnOnFloor(U, 'd2-f43', 'toy-storage', [ 0.55,  1.10], { width: 90, height: 70 },              'd2-cocuk1', Math.PI/2),
    // Banyo
    mkFurnOnFloor(U, 'd2-f50', 'toilet',      [ 1.50,  4.00], { depth: 68 },                          'd2-banyo', Math.PI, 'wall'),
    mkFurnOnFloor(U, 'd2-f51', 'sink',        [ 1.50,  2.10], { width: 70 },                          'd2-banyo', 0,        'double'),
    mkFurnOnFloor(U, 'd2-f52', 'bathtub',     [ 2.90,  3.00], { length: 170, width: 75 },             'd2-banyo', Math.PI/2, 'freestanding'),
    mkFurnOnFloor(U, 'd2-f53', 'bathroom-cabinet',[ 1.50,  2.30], { width: 70, height: 70 },          'd2-banyo', 0,        'double'),
  ],
}

// ═══════════════════════════════════════════════════════════════════
//  3. DUBLEKS 2+1 — küçük dubleks
//  Zemin kat:
//    SALON  450×420  center ( 0.00, 0.00)  bbox x[-2.25, 2.25]  z[-2.10, 2.10]
//    MUTFAK 260×260  center (-3.55,-0.80)  bbox x[-4.85,-2.25]  z[-2.10, 0.50]
//    WC     160×180  center (-3.05, 1.50)  bbox x[-3.85,-2.25]  z[ 0.60, 2.40]
//    YEMEK  180×180  center ( 0.00, 3.00)  bbox x[-0.90, 0.90]  z[ 2.10, 3.90]
//  1. kat:
//    EBEVEYN 300×360 center (-1.55, 0.00) bbox x[-3.05,-0.05]  z[-1.80, 1.80]
//    COCUK1  280×320 center ( 1.45,-0.20) bbox x[ 0.05, 2.85]  z[-1.80, 1.40]
//    BANYO   180×220 center ( 1.75, 2.60) bbox x[ 0.85, 2.65]  z[ 1.50, 3.70]
// ═══════════════════════════════════════════════════════════════════
const duplex2plus1: LayoutData = {
  version: VERSION,
  floors: mkFloors(2.70),
  rooms: [
    mkRoomOnFloor(G, 'd3-salon',  'salon',  450, 420, [ 0.00,  0.00], 0x4488ff),
    mkRoomOnFloor(G, 'd3-mutfak', 'mutfak', 260, 260, [-3.55, -0.80], 0xff8844, { removedWalls: ['right'] }),
    mkRoomOnFloor(G, 'd3-wc',     'banyo',  160, 180, [-3.05,  1.50], 0x44cccc, { removedWalls: ['right'] }),
    mkRoomOnFloor(G, 'd3-yemek',  'salon',  180, 180, [ 0.00,  3.00], 0xcc8844, { removedWalls: ['back'] }),
    mkRoomOnFloor(U, 'd3-ebeveyn','yatak',  300, 360, [-1.55,  0.00], 0x44cc88),
    mkRoomOnFloor(U, 'd3-cocuk1', 'cocuk',  280, 320, [ 1.45, -0.20], 0xff44cc, { removedWalls: [] }),
    mkRoomOnFloor(U, 'd3-banyo',  'banyo',  180, 220, [ 1.75,  2.60], 0x44cccc),
  ],
  furniture: [
    // Salon
    mkFurnOnFloor(G, 'd3-f1',  'sofa',        [ 0.00,  0.80], { length: 240 },                        'd3-salon', Math.PI, 'classic'),
    mkFurnOnFloor(G, 'd3-f2',  'ctable',      [ 0.00, -0.10], { diameter: 90 },                       'd3-salon', 0,       'round'),
    mkFurnOnFloor(G, 'd3-f3',  'tvunit',      [ 0.00, -1.85], { length: 200 },                        'd3-salon', 0, 'classic'),
    mkFurnOnFloor(G, 'd3-f4',  'chair',       [ 1.70,  0.30], { diameter: 90 },                       'd3-salon', -Math.PI/4, 'berjer'),
    mkFurnOnFloor(G, 'd3-f5',  'rug',         [ 0.00,  0.20], { length: 220, width: 160 },            'd3-salon'),
    mkFurnOnFloor(G, 'd3-f6',  'plant',       [-1.95, -1.80], { diameter: 45 },                       'd3-salon', 0,       'classic'),
    mkFurnOnFloor(G, 'd3-f7',  'ceilinglamp', [ 0.00,  0.00], { diameter: 45 },                       'd3-salon', 0,       'pendant'),
    // Merdiven
    mkFurnOnFloor(G, 'd3-stair','stair',      [-1.70,  1.60], { height: 270, width: 95, length: 280 }, 'd3-salon', 0,       'straight'),
    // Mutfak
    mkFurnOnFloor(G, 'd3-f10', 'counter',     [-3.55, -1.80], { length: 220, depth: 60 },             'd3-mutfak', 0),
    mkFurnOnFloor(G, 'd3-f11', 'fridge',      [-4.55, -1.75], { width: 60, depth: 60 },               'd3-mutfak', Math.PI/2, 'classic'),
    mkFurnOnFloor(G, 'd3-f12', 'ankastre',    [-3.00, -1.80], { width: 60 },                          'd3-mutfak', 0),
    mkFurnOnFloor(G, 'd3-f13', 'dishwasher',  [-3.80, -1.80], {},                                     'd3-mutfak', 0),
    mkFurnOnFloor(G, 'd3-f14', 'kitchencab',  [-4.55,  0.00], { width: 50, depth: 35 },               'd3-mutfak', Math.PI/2),
    // WC
    mkFurnOnFloor(G, 'd3-f15', 'toilet',      [-3.55,  2.20], { depth: 60 },                          'd3-wc', Math.PI, 'classic'),
    mkFurnOnFloor(G, 'd3-f16', 'sink',        [-2.45,  1.50], { width: 45 },                          'd3-wc', -Math.PI/2, 'round'),
    // Yemek
    mkFurnOnFloor(G, 'd3-f17', 'dtable',      [ 0.00,  3.00], { length: 140, width: 90 },             'd3-yemek', 0, 'classic'),
    mkFurnOnFloor(G, 'd3-f18', 'dchair',      [-0.50,  2.40], {},                                     'd3-yemek', Math.PI, 'classic'),
    mkFurnOnFloor(G, 'd3-f19', 'dchair',      [ 0.50,  2.40], {},                                     'd3-yemek', Math.PI, 'classic'),
    mkFurnOnFloor(G, 'd3-f20', 'dchair',      [-0.50,  3.60], {},                                     'd3-yemek', 0, 'classic'),
    mkFurnOnFloor(G, 'd3-f21', 'dchair',      [ 0.50,  3.60], {},                                     'd3-yemek', 0, 'classic'),
    // Ebeveyn
    mkFurnOnFloor(U, 'd3-f30', 'bed',         [-1.55, -0.50], { length: 200, width: 160 },            'd3-ebeveyn', 0,       'classic'),
    mkFurnOnFloor(U, 'd3-f31', 'nightstand',  [-2.60, -1.20], {},                                     'd3-ebeveyn', 0),
    mkFurnOnFloor(U, 'd3-f32', 'nightstand',  [-0.50, -1.20], {},                                     'd3-ebeveyn', 0),
    mkFurnOnFloor(U, 'd3-f33', 'wardrobe',    [-1.55,  1.45], { width: 200, depth: 60 },              'd3-ebeveyn', Math.PI, 'classic'),
    mkFurnOnFloor(U, 'd3-f34', 'dresser',     [-2.75,  0.70], { width: 90, depth: 45 },               'd3-ebeveyn', Math.PI/2),
    // Çocuk
    mkFurnOnFloor(U, 'd3-f40', 'bed',         [ 0.80, -0.90], { length: 200, width: 90 },             'd3-cocuk1', 0,        'modern'),
    mkFurnOnFloor(U, 'd3-f41', 'wardrobe',    [ 2.55,  0.60], { width: 120, depth: 55 },              'd3-cocuk1', -Math.PI/2, 'classic'),
    mkFurnOnFloor(U, 'd3-f42', 'desk',        [ 1.45,  1.00], { length: 100, depth: 55 },             'd3-cocuk1', Math.PI, 'classic'),
    mkFurnOnFloor(U, 'd3-f43', 'office-chair',[ 1.45,  0.40], {},                                     'd3-cocuk1', 0,        'basic'),
    mkFurnOnFloor(U, 'd3-f44', 'bookcase',    [ 2.65, -0.80], { width: 60, height: 160 },             'd3-cocuk1', -Math.PI/2, '3shelf'),
    // Banyo
    mkFurnOnFloor(U, 'd3-f50', 'toilet',      [ 1.10,  3.45], { depth: 65 },                          'd3-banyo', Math.PI, 'classic'),
    mkFurnOnFloor(U, 'd3-f51', 'sink',        [ 1.10,  1.80], { width: 55 },                          'd3-banyo', 0,        'round'),
    mkFurnOnFloor(U, 'd3-f52', 'shower',      [ 2.25,  3.15], { width: 90, depth: 90 },               'd3-banyo', 0,        'corner'),
    mkFurnOnFloor(U, 'd3-f53', 'bathroom-cabinet',[ 1.10,  2.05], { width: 55, height: 65 },          'd3-banyo', 0,        'single'),
  ],
}

// ═══════════════════════════════════════════════════════════════════
//  4. DUBLEKS BAHÇELİ — zemin katta geniş açılım, bahçe dekoru
//  Zemin kat:
//    SALON   600×480  center ( 0.00, 0.00)  bbox x[-3.00, 3.00]  z[-2.40, 2.40]
//    MUTFAK  300×300  center ( 4.50,-0.90)  bbox x[ 3.00, 6.00]  z[-2.40, 0.60]
//    WC      180×200  center ( 3.90, 1.50)  bbox x[ 3.00, 4.80]  z[ 0.50, 2.50]
//    BAHCE (salon tipi geniş teras olarak sim.) 450×220 center (0.00,3.50) bbox x[-2.25,2.25] z[2.40,4.60]
//  1. kat:
//    EBEVEYN 380×420  center (-1.10, 0.00)  bbox x[-3.00, 0.80]  z[-2.10, 2.10]
//    COCUK1  320×340  center ( 2.40,-0.20)  bbox x[ 0.80, 4.00]  z[-2.10, 1.30]
//    BANYO   220×260  center ( 2.40, 2.60)  bbox x[ 1.30, 3.50]  z[ 1.30, 3.90]
// ═══════════════════════════════════════════════════════════════════
const duplexGarden: LayoutData = {
  version: VERSION,
  floors: mkFloors(2.90),
  rooms: [
    mkRoomOnFloor(G, 'd4-salon',  'salon',  600, 480, [ 0.00,  0.00], 0x4488ff),
    mkRoomOnFloor(G, 'd4-mutfak', 'mutfak', 300, 300, [ 4.50, -0.90], 0xff8844, { removedWalls: ['left'] }),
    mkRoomOnFloor(G, 'd4-wc',     'banyo',  180, 200, [ 3.90,  1.50], 0x44cccc, { removedWalls: ['left'] }),
    mkRoomOnFloor(G, 'd4-bahce',  'salon',  450, 220, [ 0.00,  3.50], 0x88cc44, { removedWalls: ['back'], floorType: 'beton', wallColor: '#c8d8c0' }),
    mkRoomOnFloor(U, 'd4-ebeveyn','yatak',  380, 420, [-1.10,  0.00], 0x44cc88),
    mkRoomOnFloor(U, 'd4-cocuk1', 'cocuk',  320, 340, [ 2.40, -0.20], 0xff44cc, { removedWalls: ['left'] }),
    mkRoomOnFloor(U, 'd4-banyo',  'banyo',  220, 260, [ 2.40,  2.60], 0x44cccc, { removedWalls: ['back', 'left'] }),
  ],
  furniture: [
    // Salon
    mkFurnOnFloor(G, 'd4-f1',  'lsofa',       [-0.50,  0.80], { length: 310, width: 220, depth: 100 }, 'd4-salon', Math.PI, 'chaise'),
    mkFurnOnFloor(G, 'd4-f2',  'ctable',      [-0.50, -0.40], { diameter: 110 },                      'd4-salon', 0,       'marble'),
    mkFurnOnFloor(G, 'd4-f3',  'tvunit',      [-0.50, -2.10], { length: 260 },                        'd4-salon', 0, 'floating'),
    mkFurnOnFloor(G, 'd4-f4',  'rug',         [-0.50,  0.10], { length: 280, width: 200 },            'd4-salon'),
    mkFurnOnFloor(G, 'd4-f5',  'recliner',    [ 2.40,  0.20], { width: 100, depth: 105 },             'd4-salon', -Math.PI/2, 'leather'),
    mkFurnOnFloor(G, 'd4-f6',  'plant',       [ 2.70, -2.10], { diameter: 60 },                       'd4-salon', 0,       'tall'),
    mkFurnOnFloor(G, 'd4-f7',  'wall-art',    [-2.80, -1.40], { width: 100, height: 70 },             'd4-salon', Math.PI/2, 'set'),
    mkFurnOnFloor(G, 'd4-f8',  'ceilinglamp', [-0.50,  0.00], { diameter: 65 },                       'd4-salon', 0,       'chandelier'),
    // Merdiven
    mkFurnOnFloor(G, 'd4-stair','stair',      [ 2.40,  1.90], { height: 290, width: 100, length: 320 },'d4-salon', 0,       'lshape'),
    // Mutfak
    mkFurnOnFloor(G, 'd4-f20', 'counter',     [ 4.50, -2.00], { length: 260, depth: 60 },             'd4-mutfak', 0),
    mkFurnOnFloor(G, 'd4-f21', 'kitchencab',  [ 5.75, -0.80], { width: 70, depth: 40 },               'd4-mutfak', -Math.PI/2),
    mkFurnOnFloor(G, 'd4-f22', 'fridge',      [ 5.70,  0.20], { width: 75, depth: 65 },               'd4-mutfak', -Math.PI/2, 'french'),
    mkFurnOnFloor(G, 'd4-f23', 'ankastre',    [ 5.00, -1.95], { width: 65 },                          'd4-mutfak', 0),
    mkFurnOnFloor(G, 'd4-f24', 'dishwasher',  [ 4.10, -1.95], {},                                     'd4-mutfak', 0),
    // WC
    mkFurnOnFloor(G, 'd4-f25', 'toilet',      [ 4.55,  2.25], { depth: 65 },                          'd4-wc', Math.PI, 'wall'),
    mkFurnOnFloor(G, 'd4-f26', 'sink',        [ 3.25,  1.50], { width: 50 },                          'd4-wc', Math.PI/2, 'square'),
    // Bahçe / teras
    mkFurnOnFloor(G, 'd4-f30', 'garden-table',[ 0.00,  3.40], { diameter: 130 },                      'd4-bahce', 0, 'round'),
    mkFurnOnFloor(G, 'd4-f31', 'garden-chair',[-1.00,  3.40], { diameter: 55 },                       'd4-bahce', Math.PI/2, 'rattan'),
    mkFurnOnFloor(G, 'd4-f32', 'garden-chair',[ 1.00,  3.40], { diameter: 55 },                       'd4-bahce', -Math.PI/2, 'rattan'),
    mkFurnOnFloor(G, 'd4-f33', 'garden-chair',[ 0.00,  2.70], { diameter: 55 },                       'd4-bahce', Math.PI, 'rattan'),
    mkFurnOnFloor(G, 'd4-f34', 'garden-chair',[ 0.00,  4.10], { diameter: 55 },                       'd4-bahce', 0, 'rattan'),
    mkFurnOnFloor(G, 'd4-f35', 'umbrella',    [ 0.00,  3.40], { diameter: 250 },                      'd4-bahce', 0),
    mkFurnOnFloor(G, 'd4-f36', 'bbq-grill',   [-1.90,  4.30], { diameter: 60 },                       'd4-bahce', 0),
    mkFurnOnFloor(G, 'd4-f37', 'plant',       [ 1.90,  4.30], { diameter: 55 },                       'd4-bahce', 0, 'tall'),
    // Ebeveyn
    mkFurnOnFloor(U, 'd4-f40', 'bed',         [-1.10, -0.50], { length: 210, width: 180 },            'd4-ebeveyn', 0,       'tufted'),
    mkFurnOnFloor(U, 'd4-f41', 'nightstand',  [-2.20, -1.30], {},                                     'd4-ebeveyn', 0),
    mkFurnOnFloor(U, 'd4-f42', 'nightstand',  [ 0.00, -1.30], {},                                     'd4-ebeveyn', 0),
    mkFurnOnFloor(U, 'd4-f43', 'wardrobe',    [-1.10,  1.75], { width: 240, depth: 60 },              'd4-ebeveyn', Math.PI, 'sliding'),
    mkFurnOnFloor(U, 'd4-f44', 'dresser',     [-2.70,  0.80], { width: 120, depth: 50 },              'd4-ebeveyn', Math.PI/2),
    mkFurnOnFloor(U, 'd4-f45', 'chair',       [ 0.30,  1.70], { diameter: 85 },                       'd4-ebeveyn', Math.PI, 'wingback'),
    mkFurnOnFloor(U, 'd4-f46', 'ceilinglamp', [-1.10,  0.10], { diameter: 55 },                       'd4-ebeveyn', 0,       'chandelier'),
    // Çocuk
    mkFurnOnFloor(U, 'd4-f50', 'bed',         [ 1.80, -1.10], { length: 200, width: 100 },            'd4-cocuk1', 0,        'modern'),
    mkFurnOnFloor(U, 'd4-f51', 'wardrobe',    [ 3.60,  0.70], { width: 140, depth: 55 },              'd4-cocuk1', -Math.PI/2, 'sliding'),
    mkFurnOnFloor(U, 'd4-f52', 'desk',        [ 2.40,  1.10], { length: 120, depth: 55 },             'd4-cocuk1', Math.PI, 'classic'),
    mkFurnOnFloor(U, 'd4-f53', 'office-chair',[ 2.40,  0.50], {},                                     'd4-cocuk1', 0,        'ergonomic'),
    mkFurnOnFloor(U, 'd4-f54', 'bookcase',    [ 3.70, -0.90], { width: 80, height: 180 },             'd4-cocuk1', -Math.PI/2, '5shelf'),
    mkFurnOnFloor(U, 'd4-f55', 'toy-storage', [ 1.00,  0.90], { width: 90, height: 70 },              'd4-cocuk1', Math.PI/2),
    // Banyo
    mkFurnOnFloor(U, 'd4-f60', 'toilet',      [ 1.60,  3.60], { depth: 68 },                          'd4-banyo', Math.PI, 'wall'),
    mkFurnOnFloor(U, 'd4-f61', 'sink',        [ 1.60,  1.70], { width: 80 },                          'd4-banyo', 0,        'double'),
    mkFurnOnFloor(U, 'd4-f62', 'bathtub',     [ 3.00,  2.60], { length: 170, width: 75 },             'd4-banyo', Math.PI/2, 'freestanding'),
    mkFurnOnFloor(U, 'd4-f63', 'bathroom-cabinet',[ 1.60,  1.90], { width: 70, height: 70 },          'd4-banyo', 0,        'double'),
  ],
}

// ═══════════════════════════════════════════════════════════════════
//  5. DUBLEKS MEZZANINE — zemin yüksek tavanlı salon + küçük 1. kat
//  Zemin kat:
//    SALON   550×520  center ( 0.00, 0.00)  bbox x[-2.75, 2.75]  z[-2.60, 2.60]
//    MUTFAK  260×280  center (-4.05,-1.20)  bbox x[-5.35,-2.75]  z[-2.60, 0.20]
//    WC      180×200  center (-3.65, 1.60)  bbox x[-4.55,-2.75]  z[ 0.60, 2.60]
//  1. kat (mezzanine — küçük):
//    EBEVEYN 320×360  center (-0.75, 0.00) bbox x[-2.35, 0.85]  z[-1.80, 1.80]
//    BANYO   180×220  center ( 2.00, 0.90) bbox x[ 1.10, 2.90]  z[-0.20, 2.00]
// ═══════════════════════════════════════════════════════════════════
const duplexMezzanine: LayoutData = {
  version: VERSION,
  floors: mkFloors(3.50),
  rooms: [
    mkRoomOnFloor(G, 'd5-salon',  'salon',  550, 520, [ 0.00,  0.00], 0x4488ff, { wallColor: '#f5f5f0' }),
    mkRoomOnFloor(G, 'd5-mutfak', 'mutfak', 260, 280, [-4.05, -1.20], 0xff8844, { removedWalls: ['right'] }),
    mkRoomOnFloor(G, 'd5-wc',     'banyo',  180, 200, [-3.65,  1.60], 0x44cccc, { removedWalls: ['right'] }),
    mkRoomOnFloor(U, 'd5-ebeveyn','yatak',  320, 360, [-0.75,  0.00], 0x44cc88),
    mkRoomOnFloor(U, 'd5-banyo',  'banyo',  180, 220, [ 2.00,  0.90], 0x44cccc),
  ],
  furniture: [
    // Salon — loft benzeri, büyük
    mkFurnOnFloor(G, 'd5-f1',  'lsofa',       [ 0.00,  0.80], { length: 330, width: 230, depth: 105 }, 'd5-salon', Math.PI, 'modern'),
    mkFurnOnFloor(G, 'd5-f2',  'ctable',      [ 0.00, -0.40], { diameter: 130 },                      'd5-salon', 0,       'marble'),
    mkFurnOnFloor(G, 'd5-f3',  'tvunit',      [ 0.00, -2.30], { length: 280 },                        'd5-salon', 0, 'floating'),
    mkFurnOnFloor(G, 'd5-f4',  'rug',         [ 0.00,  0.10], { length: 300, width: 220 },            'd5-salon'),
    mkFurnOnFloor(G, 'd5-f5',  'dtable',      [-1.80,  2.00], { length: 160, width: 90 },             'd5-salon', 0, 'modern'),
    mkFurnOnFloor(G, 'd5-f6',  'dchair',      [-2.40,  1.50], {},                                     'd5-salon', Math.PI, 'scandi'),
    mkFurnOnFloor(G, 'd5-f7',  'dchair',      [-1.20,  1.50], {},                                     'd5-salon', Math.PI, 'scandi'),
    mkFurnOnFloor(G, 'd5-f8',  'dchair',      [-2.40,  2.50], {},                                     'd5-salon', 0,       'scandi'),
    mkFurnOnFloor(G, 'd5-f9',  'dchair',      [-1.20,  2.50], {},                                     'd5-salon', 0,       'scandi'),
    mkFurnOnFloor(G, 'd5-f10', 'floorlamp',   [ 2.40, -2.20], {},                                     'd5-salon', 0,       'arc'),
    mkFurnOnFloor(G, 'd5-f11', 'plant',       [-2.40, -2.20], { diameter: 60 },                       'd5-salon', 0,       'tall'),
    mkFurnOnFloor(G, 'd5-f12', 'wall-art',    [ 2.55,  0.00], { width: 120, height: 80 },             'd5-salon', -Math.PI/2, 'modern'),
    mkFurnOnFloor(G, 'd5-f13', 'ceilinglamp', [ 0.00,  0.00], { diameter: 80 },                       'd5-salon', 0,       'pendant'),
    // Mezzanine merdiveni
    mkFurnOnFloor(G, 'd5-stair','stair',      [ 2.20,  1.90], { height: 350, width: 110, length: 380 },'d5-salon', 0,       'lshape'),
    // Mutfak
    mkFurnOnFloor(G, 'd5-f20', 'counter',     [-4.05, -2.25], { length: 220, depth: 60 },             'd5-mutfak', 0),
    mkFurnOnFloor(G, 'd5-f21', 'kitchencab',  [-5.10, -1.20], { width: 60, depth: 40 },               'd5-mutfak', Math.PI/2),
    mkFurnOnFloor(G, 'd5-f22', 'fridge',      [-5.05, -0.10], { width: 70, depth: 65 },               'd5-mutfak', Math.PI/2, 'sidebyside'),
    mkFurnOnFloor(G, 'd5-f23', 'ankastre',    [-3.50, -2.20], { width: 60 },                          'd5-mutfak', 0),
    mkFurnOnFloor(G, 'd5-f24', 'dishwasher',  [-4.30, -2.20], {},                                     'd5-mutfak', 0),
    mkFurnOnFloor(G, 'd5-f25', 'barstool',    [-2.90, -0.60], { diameter: 38 },                       'd5-mutfak', 0, 'modern'),
    mkFurnOnFloor(G, 'd5-f26', 'barstool',    [-2.90, -1.30], { diameter: 38 },                       'd5-mutfak', 0, 'modern'),
    // WC
    mkFurnOnFloor(G, 'd5-f27', 'toilet',      [-4.30,  2.35], { depth: 65 },                          'd5-wc', Math.PI, 'wall'),
    mkFurnOnFloor(G, 'd5-f28', 'sink',        [-2.95,  1.60], { width: 50 },                          'd5-wc', -Math.PI/2, 'square'),
    // Mezzanine — ebeveyn
    mkFurnOnFloor(U, 'd5-f30', 'bed',         [-0.75, -0.60], { length: 210, width: 180 },            'd5-ebeveyn', 0,       'modern'),
    mkFurnOnFloor(U, 'd5-f31', 'nightstand',  [-1.85, -1.40], {},                                     'd5-ebeveyn', 0),
    mkFurnOnFloor(U, 'd5-f32', 'nightstand',  [ 0.35, -1.40], {},                                     'd5-ebeveyn', 0),
    mkFurnOnFloor(U, 'd5-f33', 'wardrobe',    [-0.75,  1.50], { width: 220, depth: 55 },              'd5-ebeveyn', Math.PI, 'sliding'),
    mkFurnOnFloor(U, 'd5-f34', 'dresser',     [-2.10,  0.80], { width: 100, depth: 45 },              'd5-ebeveyn', Math.PI/2),
    mkFurnOnFloor(U, 'd5-f35', 'mirror',      [-2.15, -0.10], { width: 55, height: 130 },             'd5-ebeveyn', -Math.PI/2, 'rectangle'),
    // Mezzanine — banyo
    mkFurnOnFloor(U, 'd5-f40', 'toilet',      [ 1.35,  1.80], { depth: 65 },                          'd5-banyo', Math.PI, 'wall'),
    mkFurnOnFloor(U, 'd5-f41', 'sink',        [ 1.35, -0.00], { width: 60 },                          'd5-banyo', 0,        'square'),
    mkFurnOnFloor(U, 'd5-f42', 'shower',      [ 2.50,  1.50], { width: 90, depth: 90 },               'd5-banyo', 0,        'straight'),
    mkFurnOnFloor(U, 'd5-f43', 'bathroom-cabinet',[ 1.35,  0.25], { width: 60, height: 70 },          'd5-banyo', 0,        'single'),
  ],
}

// ═══════════════════════════════════════════════════════════════════
//  6. DUBLEKS LOFT — endüstriyel loft tipi dubleks
//  Zemin kat:
//    YASAMA  700×520  center ( 0.00, 0.00)  bbox x[-3.50, 3.50]  z[-2.60, 2.60]
//    BANYO   220×240  center ( 4.60,-1.40)  bbox x[ 3.50, 5.70]  z[-2.60,-0.20]
//  1. kat (loft — mezzanine yatak + çalışma):
//    LOFT    520×420  center ( 0.00, 0.00)  bbox x[-2.60, 2.60]  z[-2.10, 2.10]
//    CALISMA 240×260  center ( 3.80,-0.80)  bbox x[ 2.60, 5.00]  z[-2.10, 0.50]
// ═══════════════════════════════════════════════════════════════════
const duplexStudio: LayoutData = {
  version: VERSION,
  floors: mkFloors(3.20),
  rooms: [
    mkRoomOnFloor(G, 'd6-yasama', 'salon',  700, 520, [ 0.00,  0.00], 0x4488ff, { wallColor: '#d0d0cc', floorType: 'beton' }),
    mkRoomOnFloor(G, 'd6-banyo',  'banyo',  220, 240, [ 4.60, -1.40], 0x44cccc, { removedWalls: ['left'] }),
    mkRoomOnFloor(U, 'd6-loft',   'salon',  520, 420, [ 0.00,  0.00], 0x44cc88, { wallColor: '#e3ddd4' }),
    mkRoomOnFloor(U, 'd6-calisma','salon',  240, 260, [ 3.80, -0.80], 0xcc8844, { removedWalls: ['left'] }),
  ],
  furniture: [
    // Zemin — yaşama alanı (açık plan: salon + mutfak + yemek)
    mkFurnOnFloor(G, 'd6-f1',  'lsofa',       [-1.50,  1.00], { length: 300, width: 210, depth: 95 },  'd6-yasama', Math.PI, 'modern'),
    mkFurnOnFloor(G, 'd6-f2',  'ctable',      [-1.50, -0.20], { diameter: 110 },                      'd6-yasama', 0,       'square'),
    mkFurnOnFloor(G, 'd6-f3',  'tvunit',      [-1.50, -2.20], { length: 240 },                        'd6-yasama', 0, 'floating'),
    mkFurnOnFloor(G, 'd6-f4',  'rug',         [-1.50,  0.20], { length: 280, width: 200 },            'd6-yasama'),
    mkFurnOnFloor(G, 'd6-f5',  'beanbag',     [ 0.40,  0.20], { diameter: 110 },                      'd6-yasama'),
    mkFurnOnFloor(G, 'd6-f6',  'plant',       [-3.20, -2.30], { diameter: 60 },                       'd6-yasama', 0,       'tall'),
    mkFurnOnFloor(G, 'd6-f7',  'wall-art',    [-3.30, -0.80], { width: 120, height: 80 },             'd6-yasama', Math.PI/2, 'modern'),
    // Mutfak bölümü (aynı oda içinde)
    mkFurnOnFloor(G, 'd6-f10', 'counter',     [ 2.70, -2.20], { length: 220, depth: 60 },             'd6-yasama', 0),
    mkFurnOnFloor(G, 'd6-f11', 'fridge',      [ 3.30, -1.80], { width: 75, depth: 60 },               'd6-yasama', Math.PI, 'french'),
    mkFurnOnFloor(G, 'd6-f12', 'ankastre',    [ 2.20, -2.15], { width: 65 },                          'd6-yasama', 0),
    mkFurnOnFloor(G, 'd6-f13', 'dishwasher',  [ 3.00, -2.15], {},                                     'd6-yasama', 0),
    mkFurnOnFloor(G, 'd6-f14', 'kitchencab',  [ 1.70, -2.20], { width: 60, depth: 40 },               'd6-yasama', 0),
    mkFurnOnFloor(G, 'd6-f15', 'dtable',      [ 2.40, -0.40], { length: 180, width: 90 },             'd6-yasama', 0, 'modern'),
    mkFurnOnFloor(G, 'd6-f16', 'dchair',      [ 1.80, -1.00], {},                                     'd6-yasama', Math.PI, 'scandi'),
    mkFurnOnFloor(G, 'd6-f17', 'dchair',      [ 2.40, -1.00], {},                                     'd6-yasama', Math.PI, 'scandi'),
    mkFurnOnFloor(G, 'd6-f18', 'dchair',      [ 3.00, -1.00], {},                                     'd6-yasama', Math.PI, 'scandi'),
    mkFurnOnFloor(G, 'd6-f19', 'dchair',      [ 1.80,  0.20], {},                                     'd6-yasama', 0, 'scandi'),
    mkFurnOnFloor(G, 'd6-f20', 'dchair',      [ 2.40,  0.20], {},                                     'd6-yasama', 0, 'scandi'),
    mkFurnOnFloor(G, 'd6-f21', 'dchair',      [ 3.00,  0.20], {},                                     'd6-yasama', 0, 'scandi'),
    mkFurnOnFloor(G, 'd6-f22', 'ceilinglamp', [-1.50,  0.00], { diameter: 60 },                       'd6-yasama', 0,       'pendant'),
    mkFurnOnFloor(G, 'd6-f23', 'ceilinglamp', [ 2.40, -0.40], { diameter: 55 },                       'd6-yasama', 0,       'pendant'),
    // Loft merdiveni
    mkFurnOnFloor(G, 'd6-stair','stair',      [ 2.90,  2.00], { height: 320, width: 110, length: 350 },'d6-yasama', Math.PI, 'lshape'),
    // Banyo
    mkFurnOnFloor(G, 'd6-f30', 'toilet',      [ 5.30, -2.25], { depth: 68 },                          'd6-banyo', Math.PI, 'wall'),
    mkFurnOnFloor(G, 'd6-f31', 'sink',        [ 3.85, -1.40], { width: 70 },                          'd6-banyo', Math.PI/2, 'square'),
    mkFurnOnFloor(G, 'd6-f32', 'shower',      [ 5.15, -0.60], { width: 100, depth: 100 },             'd6-banyo', 0,        'straight'),
    mkFurnOnFloor(G, 'd6-f33', 'bathroom-cabinet',[ 4.20, -1.40], { width: 60, height: 70 },          'd6-banyo', Math.PI/2, 'double'),
    // Loft — yatak alanı
    mkFurnOnFloor(U, 'd6-f40', 'bed',         [-0.80, -0.60], { length: 210, width: 180 },            'd6-loft', 0,       'modern'),
    mkFurnOnFloor(U, 'd6-f41', 'nightstand',  [-1.90, -1.40], {},                                     'd6-loft', 0),
    mkFurnOnFloor(U, 'd6-f42', 'nightstand',  [ 0.30, -1.40], {},                                     'd6-loft', 0),
    mkFurnOnFloor(U, 'd6-f43', 'wardrobe',    [-0.80,  1.75], { width: 240, depth: 55 },              'd6-loft', Math.PI, 'sliding'),
    mkFurnOnFloor(U, 'd6-f44', 'rug',         [-0.80, -0.30], { length: 220, width: 160 },            'd6-loft'),
    mkFurnOnFloor(U, 'd6-f45', 'chair',       [ 1.80,  1.40], { diameter: 90 },                       'd6-loft', -Math.PI*3/4, 'wingback'),
    mkFurnOnFloor(U, 'd6-f46', 'floorlamp',   [ 2.20,  1.80], {},                                     'd6-loft', 0,       'tripod'),
    mkFurnOnFloor(U, 'd6-f47', 'ceilinglamp', [-0.80,  0.00], { diameter: 50 },                       'd6-loft', 0,       'pendant'),
    mkFurnOnFloor(U, 'd6-f48', 'mirror',      [-2.45,  0.50], { width: 60, height: 160 },             'd6-loft', -Math.PI/2, 'oval'),
    // Çalışma ofisi
    mkFurnOnFloor(U, 'd6-f50', 'desk',        [ 3.80, -1.70], { length: 180, depth: 70 },             'd6-calisma', 0, 'lshape'),
    mkFurnOnFloor(U, 'd6-f51', 'office-chair',[ 3.80, -0.90], {},                                     'd6-calisma', Math.PI, 'executive'),
    mkFurnOnFloor(U, 'd6-f52', 'monitor',     [ 3.50, -1.95], { diagonal: 27 },                       'd6-calisma', 0),
    mkFurnOnFloor(U, 'd6-f53', 'monitor',     [ 4.10, -1.95], { diagonal: 27 },                       'd6-calisma', 0),
    mkFurnOnFloor(U, 'd6-f54', 'bookcase',    [ 4.80,  0.20], { width: 100, height: 200 },            'd6-calisma', -Math.PI/2, '5shelf'),
    mkFurnOnFloor(U, 'd6-f55', 'filing-cabinet',[ 2.80, -0.10], { width: 45, height: 100, depth: 50 },'d6-calisma', Math.PI/2),
    mkFurnOnFloor(U, 'd6-f56', 'plant',       [ 2.80,  0.30], { diameter: 45 },                       'd6-calisma', 0, 'classic'),
  ],
}

// ═══════════════════════════════════════════════════════════════════
//  Preset listesi
// ═══════════════════════════════════════════════════════════════════
export const PRESETS_DUPLEX: Preset[] = [
  {
    id: 'duplex-classic',
    label: 'Dubleks Klasik',
    icon: '🏠',
    description: '2 katlı klasik dubleks: zemin salon+mutfak+WC+yemek, 1. kat ebeveyn+çocuk+banyo',
    data: duplexClassic,
  },
  {
    id: 'duplex-modern',
    label: 'Dubleks Modern',
    icon: '🏡',
    description: 'Modern açık plan dubleks: büyük salon+yemek birleşik, L merdiven, 3 m tavan',
    data: duplexModern,
  },
  {
    id: 'duplex-2plus1',
    label: 'Dubleks 2+1',
    icon: '🏢',
    description: 'Kompakt 2+1 dubleks: küçük metrekareli pratik aile planı',
    data: duplex2plus1,
  },
  {
    id: 'duplex-garden',
    label: 'Dubleks Bahçeli',
    icon: '🌳',
    description: 'Zemin katta bahçe/teras alanı: mangal, şemsiye, rattan set',
    data: duplexGarden,
  },
  {
    id: 'duplex-mezzanine',
    label: 'Dubleks Mezzanine',
    icon: '◣',
    description: 'Yüksek tavanlı salon + mezzanine (yarım kat) üst yatak odası',
    data: duplexMezzanine,
  },
  {
    id: 'duplex-studio',
    label: 'Dubleks Loft',
    icon: '🌇',
    description: 'Endüstriyel loft: açık plan zemin + üst katta yatak+çalışma',
    data: duplexStudio,
  },
]
