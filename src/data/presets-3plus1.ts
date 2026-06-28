/**
 * 3+1 daire varyasyonları — 8 farklı plan.
 *
 * Her plan 3 yatak odası + salon + mutfak + banyo içerir (bazıları çift banyolu,
 * ofis odalı veya açık mutfak). Koordinat sistemi ve duvar yönleri için
 * presets.ts'deki dökümantasyona bakınız.
 *
 * KOORDİNAT SİSTEMİ:
 *   position = [x, z] → odanın DÜNYA MERKEZİ (metre)
 *   widthCm  → X eksenindeki genişlik (cm)
 *   lengthCm → Z eksenindeki derinlik (cm)
 *   Oda bbox: x ∈ [cx - widthCm/200 , cx + widthCm/200]
 *             z ∈ [cz - lengthCm/200 , cz + lengthCm/200]
 *
 * DUVAR YÖNLERİ:
 *   'left'  → x = cx - widthCm/200
 *   'right' → x = cx + widthCm/200
 *   'back'  → z = cz - lengthCm/200
 *   'front' → z = cz + lengthCm/200
 *
 * MOBİLYA ROTASYONLARI (varsayılan 0):
 *   sofa / lsofa : arka +Z, oturma -Z  → TV -Z'de ise rotation=Math.PI gerekir
 *   tvunit       : ekran -Z            → odanın içi +Z'de ise rotation=Math.PI gerekir
 *   bed          : baş -Z
 *   wardrobe     : kapılar +Z
 */

import type { LayoutData, Room, FurnitureItem } from '../types'
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
//  1. 3+1 GELENEKSEL (h1)
//  Klasik plan: merkezi koridor + salon bir kenarda, 3 yatak odası diğer
//  kenarda; mutfak ve banyo arka blokta.
//
//  SALON   520×520  center ( 2.60, 0.00)  bbox x[ 0.00, 5.20]  z[-2.6, 2.6]
//  KORIDOR 140×520  center (-0.70, 0.00)  bbox x[-1.40, 0.00]  z[-2.6, 2.6]
//  EBEVEYN 360×380  center (-3.20,-0.70)  bbox x[-5.00,-1.40]  z[-2.6, 1.2]
//  COCUK   300×340  center (-2.90, 2.90)  bbox x[-4.40,-1.40]  z[ 1.2, 4.6]
//  YATAK3  260×280  center ( 1.00, 3.80)  bbox x[-0.30, 2.30]  z[ 2.4, 5.2]
//  MUTFAK  280×280  center ( 3.70, 3.80)  bbox x[ 2.30, 5.10]  z[ 2.4, 5.2]
//  BANYO   240×200  center ( 4.00, 1.40)  bbox x[ 2.80, 5.20]  z[ 0.4, 2.4]
// ═══════════════════════════════════════════════════════════════════
const p_h1: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('h1-salon',   'salon',   520, 520, [ 2.60,  0.00], 0x4488ff),
    mkRoom('h1-koridor', 'koridor', 140, 520, [-0.70,  0.00], 0xcc8844, { removedWalls: ['right'] }),
    mkRoom('h1-ebeveyn', 'yatak',   360, 380, [-3.20, -0.70], 0x44cc88, { removedWalls: ['right'] }),
    mkRoom('h1-cocuk',   'cocuk',   300, 340, [-2.90,  2.90], 0xff44cc, { removedWalls: ['right', 'back'] }),
    mkRoom('h1-yatak3',  'yatak',   260, 280, [ 1.00,  4.00], 0x6688ff, { removedWalls: ['back'] }),
    mkRoom('h1-mutfak',  'mutfak',  280, 280, [ 3.70,  4.00], 0xff8844, { removedWalls: ['back', 'left'] }),
    mkRoom('h1-banyo',   'banyo',   240, 200, [ 6.40,  1.40], 0x44cccc, { removedWalls: ['left'] }),
  ],
  furniture: [
    // Salon — bbox x[0,5.20] z[-2.6,2.6]
    mkFurn('h1-f1',  'lsofa',      [ 2.60,  1.00], { length: 300, width: 220, depth: 95 }, 'h1-salon', Math.PI,      'classic'),
    mkFurn('h1-f2',  'ctable',     [ 2.60, -0.20], { diameter: 110 },                       'h1-salon', 0,            'round'),
    mkFurn('h1-f3',  'tvunit',     [ 2.60, -2.30], { length: 220 },                         'h1-salon', Math.PI,      'classic'),
    mkFurn('h1-f4',  'chair',      [ 4.70,  0.50], { diameter: 95 },                        'h1-salon', -Math.PI / 4, 'berjer'),
    mkFurn('h1-f5',  'rug',        [ 2.60,  0.30], { length: 280, width: 200 },             'h1-salon'),
    mkFurn('h1-f6',  'ceilinglamp',[ 2.60,  0.00], { diameter: 60 },                        'h1-salon', 0,            'chandelier'),
    mkFurn('h1-f7',  'plant',      [ 4.80,  2.20], { diameter: 55 },                        'h1-salon', 0,            'tall'),
    mkFurn('h1-f8',  'floorlamp',  [ 0.40, -2.30], {},                                      'h1-salon', 0,            'classic'),
    // Ebeveyn — bbox x[-5.0,-1.4] z[-2.6,1.2]
    mkFurn('h1-f9',  'bed',        [-3.20, -0.40], { length: 200, width: 180 },             'h1-ebeveyn', 0,          'tufted'),
    mkFurn('h1-f10', 'wardrobe',   [-4.50,  0.60], { width: 200, depth: 60 },               'h1-ebeveyn', 0,          'sliding'),
    mkFurn('h1-f11', 'shelf',      [-1.70,  0.70], { width: 70, height: 150 },              'h1-ebeveyn', 0,          'classic'),
    mkFurn('h1-f12', 'mirror',     [-4.80, -2.00], { width: 60, height: 140 },              'h1-ebeveyn', Math.PI/2,  'rectangle'),
    mkFurn('h1-f13', 'ceilinglamp',[-3.20, -0.70], { diameter: 50 },                        'h1-ebeveyn', 0,          'pendant'),
    // Çocuk odası — bbox x[-4.4,-1.4] z[1.2,4.6]
    mkFurn('h1-f14', 'bed',        [-3.70,  2.70], { length: 190, width: 100 },             'h1-cocuk', 0,            'modern'),
    mkFurn('h1-f15', 'wardrobe',   [-4.10,  4.30], { width: 120, depth: 55 },               'h1-cocuk', Math.PI,      'classic'),
    mkFurn('h1-f16', 'desk',       [-1.80,  2.70], { length: 120, depth: 60 },              'h1-cocuk', Math.PI/2,    'classic'),
    mkFurn('h1-f17', 'office-chair',[-2.20, 2.70], {},                                      'h1-cocuk', Math.PI/2,    'basic'),
    mkFurn('h1-f18', 'toy-storage',[-1.90,  4.30], { width: 90, height: 60 },               'h1-cocuk', 0),
    mkFurn('h1-f19', 'ceilinglamp',[-2.90,  2.90], { diameter: 45 },                        'h1-cocuk', 0,            'panel'),
    // Yatak3 — bbox x[-0.3,2.3] z[2.4,5.2]
    mkFurn('h1-f20', 'bed',        [ 1.00,  3.40], { length: 200, width: 140 },             'h1-yatak3', 0,           'classic'),
    mkFurn('h1-f21', 'wardrobe',   [ 2.00,  4.80], { width: 140, depth: 55 },               'h1-yatak3', Math.PI,     'classic'),
    mkFurn('h1-f22', 'ceilinglamp',[ 1.00,  3.80], { diameter: 45 },                        'h1-yatak3', 0,           'panel'),
    // Mutfak — bbox x[2.3,5.1] z[2.4,5.2]
    mkFurn('h1-f23', 'counter',    [ 3.10,  2.70], { length: 160, depth: 55 },              'h1-mutfak', 0),
    mkFurn('h1-f24', 'kitchencab', [ 4.30,  2.70], { width: 60, depth: 55 },                'h1-mutfak', 0),
    mkFurn('h1-f25', 'fridge',     [ 4.80,  2.70], { width: 60, depth: 60 },                'h1-mutfak', 0,           'classic'),
    mkFurn('h1-f26', 'dtable',     [ 3.70,  4.50], { length: 140, width: 80 },              'h1-mutfak', 0,           'classic'),
    mkFurn('h1-f27', 'dchair',     [ 3.00,  4.50], {},                                      'h1-mutfak', Math.PI/2,   'classic'),
    mkFurn('h1-f28', 'dchair',     [ 4.40,  4.50], {},                                      'h1-mutfak', -Math.PI/2,  'classic'),
    mkFurn('h1-f29', 'dishwasher', [ 2.50,  2.70], {},                                      'h1-mutfak', 0),
    // Banyo — bbox x[2.8,5.2] z[0.4,2.4]
    mkFurn('h1-f30', 'toilet',     [ 5.50,  0.70], { depth: 65 },                           'h1-banyo', 0,            'wall'),
    mkFurn('h1-f31', 'sink',       [ 7.20,  0.70], { width: 70 },                           'h1-banyo', 0,            'square'),
    mkFurn('h1-f32', 'shower',     [ 5.70,  2.00], { width: 90, depth: 90 },                'h1-banyo', 0,            'corner'),
    mkFurn('h1-f33', 'bathroom-cabinet',[ 7.20,  1.95], { width: 70, height: 70 },           'h1-banyo', 0,            'double'),
  ],
}

// ═══════════════════════════════════════════════════════════════════
//  2. 3+1 AÇIK MUTFAK (h2)
//  Salon + mutfak aynı hacim (bar ile ayrık hissi); 3 oda arka blok.
//
//  SALON   620×520  center ( 1.10, 0.00)  bbox x[-2.00, 4.20]  z[-2.6, 2.6]
//  EBEVEYN 360×360  center ( 2.40, 4.40)  bbox x[ 0.60, 4.20]  z[ 2.6, 6.2]
//  COCUK   280×320  center (-0.80, 4.20)  bbox x[-2.20, 0.60]  z[ 2.6, 5.8]
//  YATAK3  260×280  center (-3.30, 0.00)  bbox x[-4.60,-2.00]  z[-1.4, 1.4]
//  BANYO   220×240  center (-3.30,-2.60)  bbox x[-4.40,-2.20]  z[-3.8,-1.4]
// ═══════════════════════════════════════════════════════════════════
const p_h2: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('h2-salon',   'salon',   620, 520, [ 1.10,  0.00], 0x4488ff),
    mkRoom('h2-ebeveyn', 'yatak',   360, 360, [ 2.40,  4.40], 0x44cc88, { removedWalls: ['back'] }),
    mkRoom('h2-cocuk',   'cocuk',   280, 320, [-0.80,  4.20], 0xff44cc, { removedWalls: ['back', 'right'] }),
    mkRoom('h2-yatak3',  'yatak',   260, 280, [-3.30,  0.00], 0x6688ff, { removedWalls: ['right'] }),
    mkRoom('h2-banyo',   'banyo',   220, 240, [-3.30, -2.60], 0x44cccc, { removedWalls: ['back'] }),
  ],
  furniture: [
    // Salon — bbox x[-2.0,4.2] z[-2.6,2.6]
    mkFurn('h2-f1',  'lsofa',      [ 0.80,  0.80], { length: 320, width: 220, depth: 95 }, 'h2-salon', Math.PI,      'modern'),
    mkFurn('h2-f2',  'ctable',     [ 0.80, -0.40], { diameter: 110 },                       'h2-salon', 0,            'marble'),
    mkFurn('h2-f3',  'tvunit',     [ 0.80, -2.30], { length: 220 },                         'h2-salon', Math.PI,      'floating'),
    mkFurn('h2-f4',  'rug',        [ 0.80,  0.20], { length: 300, width: 200 },             'h2-salon'),
    mkFurn('h2-f5',  'ceilinglamp',[ 0.80,  0.00], { diameter: 60 },                        'h2-salon', 0,            'chandelier'),
    mkFurn('h2-f6',  'plant',      [ 3.90,  2.30], { diameter: 55 },                        'h2-salon', 0,            'tall'),
    mkFurn('h2-f7',  'chair',      [-1.50,  1.20], { diameter: 90 },                        'h2-salon', Math.PI/4,    'accent'),
    // Açık mutfak (salonun sağ kenarı, bar ile ayrık) — x[3.2,4.2]
    mkFurn('h2-f8',  'counter',    [ 3.70, -1.50], { length: 200, depth: 60 },              'h2-salon', Math.PI/2),
    mkFurn('h2-f9',  'fridge',     [ 3.80, -2.30], { width: 70, depth: 65 },                'h2-salon', 0,            'french'),
    mkFurn('h2-f10', 'kitchencab', [ 3.80,  0.40], { width: 60, depth: 55 },                'h2-salon', Math.PI/2),
    // Bar
    mkFurn('h2-f11', 'dtable',     [ 2.60,  1.60], { length: 180, width: 50 },              'h2-salon', 0,            'modern'),
    mkFurn('h2-f12', 'barstool',   [ 1.90,  2.00], { diameter: 40 },                        'h2-salon', Math.PI,      'modern'),
    mkFurn('h2-f13', 'barstool',   [ 2.60,  2.00], { diameter: 40 },                        'h2-salon', Math.PI,      'modern'),
    mkFurn('h2-f14', 'barstool',   [ 3.30,  2.00], { diameter: 40 },                        'h2-salon', Math.PI,      'modern'),
    // Ebeveyn — bbox x[0.6,4.2] z[2.6,6.2]
    mkFurn('h2-f15', 'bed',        [ 2.40,  3.00], { length: 200, width: 180 },             'h2-ebeveyn', 0,          'tufted'),
    mkFurn('h2-f16', 'wardrobe',   [ 1.10,  4.40], { width: 180, depth: 60 },               'h2-ebeveyn', Math.PI/2,  'sliding'),
    mkFurn('h2-f17', 'shelf',      [ 3.80,  4.20], { width: 70, height: 150 },              'h2-ebeveyn', -Math.PI/2, 'classic'),
    mkFurn('h2-f18', 'mirror',     [ 2.40,  6.00], { width: 60, height: 140 },              'h2-ebeveyn', Math.PI,    'rectangle'),
    mkFurn('h2-f19', 'ceilinglamp',[ 2.40,  4.40], { diameter: 50 },                        'h2-ebeveyn', 0,          'pendant'),
    // Çocuk — bbox x[-2.2,0.6] z[2.6,5.8]
    mkFurn('h2-f20', 'bed',        [-1.60,  3.00], { length: 190, width: 100 },             'h2-cocuk', 0,            'modern'),
    mkFurn('h2-f21', 'wardrobe',   [-1.80,  5.50], { width: 120, depth: 55 },               'h2-cocuk', Math.PI,      'classic'),
    mkFurn('h2-f22', 'desk',       [ 0.20,  3.20], { length: 110, depth: 55 },              'h2-cocuk', -Math.PI/2,   'drawer'),
    mkFurn('h2-f23', 'office-chair',[-0.30, 3.20], {},                                      'h2-cocuk', -Math.PI/2,   'basic'),
    mkFurn('h2-f24', 'toy-storage',[ 0.30,  5.40], { width: 80, height: 55 },               'h2-cocuk', 0),
    mkFurn('h2-f25', 'ceilinglamp',[-0.80,  4.20], { diameter: 45 },                        'h2-cocuk', 0,            'panel'),
    // Yatak3 — bbox x[-4.6,-2.0] z[-1.4,1.4]
    mkFurn('h2-f26', 'bed',        [-3.30,  0.20], { length: 200, width: 140 },             'h2-yatak3', 0,           'classic'),
    mkFurn('h2-f27', 'wardrobe',   [-4.30,  1.20], { width: 150, depth: 55 },               'h2-yatak3', Math.PI,     'classic'),
    mkFurn('h2-f28', 'ceilinglamp',[-3.30,  0.00], { diameter: 45 },                        'h2-yatak3', 0,           'panel'),
    // Banyo — bbox x[-4.4,-2.2] z[-3.8,-1.4]
    mkFurn('h2-f29', 'toilet',     [-4.00, -3.40], { depth: 65 },                           'h2-banyo', 0,            'classic'),
    mkFurn('h2-f30', 'sink',       [-2.60, -3.40], { width: 60 },                           'h2-banyo', 0,            'round'),
    mkFurn('h2-f31', 'bathtub',    [-3.30, -1.80], { length: 170, width: 75 },              'h2-banyo', Math.PI,      'classic'),
    mkFurn('h2-f32', 'washer',     [-4.10, -2.60], {},                                      'h2-banyo', 0),
  ],
}

// ═══════════════════════════════════════════════════════════════════
//  3. 3+1 İKİ BANYOLU (h3)
//  Ebeveyn süiti (ensuite) + ortak banyo.
//
//  SALON    500×500  center ( 2.50, 0.00)  bbox x[ 0.00, 5.00]  z[-2.5, 2.5]
//  KORIDOR  140×500  center (-0.70, 0.00)  bbox x[-1.40, 0.00]  z[-2.5, 2.5]
//  EBEVEYN  340×380  center (-3.10,-0.60)  bbox x[-4.80,-1.40]  z[-2.5, 1.3]
//  BANYO1   180×200  center (-5.70,-1.50)  bbox x[-6.60,-4.80]  z[-2.5, -0.5]  (ensuite)
//  COCUK    320×340  center (-3.00,  3.00) bbox x[-4.60,-1.40]  z[ 1.3, 4.7]
//  YATAK3   260×280  center ( 0.90,  3.90) bbox x[-0.40, 2.20]  z[ 2.5, 5.3]
//  MUTFAK   260×280  center ( 3.50,  3.90) bbox x[ 2.20, 4.80]  z[ 2.5, 5.3]
//  BANYO2   200×220  center ( 5.10,  2.60) bbox x[ 4.10, 5.10]+... → tekil; place:
//           200×220  center ( 0.90, -3.60) bbox x[-0.10, 1.90]  z[-4.7,-2.5]  (salon arkası)
// ═══════════════════════════════════════════════════════════════════
const p_h3: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('h3-salon',   'salon',   500, 500, [ 2.50,  0.00], 0x4488ff),
    mkRoom('h3-koridor', 'koridor', 140, 500, [-0.70,  0.00], 0xcc8844, { removedWalls: ['right'] }),
    mkRoom('h3-ebeveyn', 'yatak',   340, 380, [-3.10, -0.60], 0x44cc88, { removedWalls: ['right'] }),
    mkRoom('h3-banyo1',  'banyo',   180, 200, [-5.70, -1.50], 0x44cccc, { removedWalls: ['right'] }),
    mkRoom('h3-cocuk',   'cocuk',   320, 340, [-3.00,  3.00], 0xff44cc, { removedWalls: ['right', 'back'] }),
    mkRoom('h3-yatak3',  'yatak',   260, 280, [ 0.90,  3.90], 0x6688ff, { removedWalls: ['back'] }),
    mkRoom('h3-mutfak',  'mutfak',  260, 280, [ 3.50,  3.90], 0xff8844, { removedWalls: ['back', 'left'] }),
    mkRoom('h3-banyo2',  'banyo',   200, 220, [ 0.90, -3.60], 0x44cccc, { removedWalls: ['front'] }),
  ],
  furniture: [
    // Salon
    mkFurn('h3-f1',  'lsofa',      [ 2.50,  0.90], { length: 300, width: 220, depth: 95 }, 'h3-salon', Math.PI,      'chaise'),
    mkFurn('h3-f2',  'ctable',     [ 2.50, -0.30], { diameter: 110 },                       'h3-salon', 0,            'marble'),
    mkFurn('h3-f3',  'tvunit',     [ 2.50, -2.20], { length: 220 },                         'h3-salon', Math.PI,      'floating'),
    mkFurn('h3-f4',  'chair',      [ 4.60,  0.50], { diameter: 95 },                        'h3-salon', -Math.PI/4,   'berjer'),
    mkFurn('h3-f5',  'rug',        [ 2.50,  0.30], { length: 280, width: 200 },             'h3-salon'),
    mkFurn('h3-f6',  'ceilinglamp',[ 2.50,  0.00], { diameter: 60 },                        'h3-salon', 0,            'chandelier'),
    mkFurn('h3-f7',  'plant',      [ 4.70,  2.20], { diameter: 55 },                        'h3-salon', 0,            'tall'),
    mkFurn('h3-f8',  'floorlamp',  [ 0.40,  2.20], {},                                      'h3-salon', 0,            'arc'),
    // Ebeveyn — bbox x[-4.8,-1.4] z[-2.5,1.3]
    mkFurn('h3-f9',  'bed',        [-3.10, -0.20], { length: 200, width: 180 },             'h3-ebeveyn', 0,          'tufted'),
    mkFurn('h3-f10', 'wardrobe',   [-4.30,  0.90], { width: 180, depth: 60 },               'h3-ebeveyn', 0,          'sliding'),
    mkFurn('h3-f11', 'shelf',      [-1.70,  0.90], { width: 70, height: 150 },              'h3-ebeveyn', 0,          'classic'),
    mkFurn('h3-f12', 'mirror',     [-4.60, -2.20], { width: 60, height: 140 },              'h3-ebeveyn', Math.PI/2,  'rectangle'),
    mkFurn('h3-f13', 'ceilinglamp',[-3.10, -0.60], { diameter: 50 },                        'h3-ebeveyn', 0,          'pendant'),
    // Banyo1 (ensuite) — bbox x[-6.6,-4.8] z[-2.5,-0.5]
    mkFurn('h3-f14', 'toilet',     [-6.20, -0.90], { depth: 60 },                           'h3-banyo1', 0,           'wall'),
    mkFurn('h3-f15', 'sink',       [-5.00, -0.90], { width: 55 },                           'h3-banyo1', 0,           'square'),
    mkFurn('h3-f16', 'shower',     [-6.00, -2.10], { width: 85, depth: 80 },                'h3-banyo1', 0,           'corner'),
    mkFurn('h3-f17', 'bathroom-cabinet',[-5.00, -2.10], { width: 60, height: 65 },          'h3-banyo1', Math.PI,     'single'),
    // Çocuk — bbox x[-4.6,-1.4] z[1.3,4.7]
    mkFurn('h3-f18', 'bed',        [-3.90,  2.80], { length: 190, width: 100 },             'h3-cocuk', 0,            'modern'),
    mkFurn('h3-f19', 'wardrobe',   [-4.20,  4.40], { width: 120, depth: 55 },               'h3-cocuk', Math.PI,      'classic'),
    mkFurn('h3-f20', 'desk',       [-1.80,  2.80], { length: 120, depth: 55 },              'h3-cocuk', Math.PI/2,    'classic'),
    mkFurn('h3-f21', 'office-chair',[-2.30, 2.80], {},                                      'h3-cocuk', Math.PI/2,    'basic'),
    mkFurn('h3-f22', 'bookcase',   [-1.80,  4.40], { width: 80, height: 160 },              'h3-cocuk', Math.PI,      '3shelf'),
    mkFurn('h3-f23', 'ceilinglamp',[-3.00,  3.00], { diameter: 45 },                        'h3-cocuk', 0,            'panel'),
    // Yatak3 — bbox x[-0.4,2.2] z[2.5,5.3]
    mkFurn('h3-f24', 'bed',        [ 0.90,  3.50], { length: 200, width: 140 },             'h3-yatak3', 0,           'classic'),
    mkFurn('h3-f25', 'wardrobe',   [ 1.90,  4.90], { width: 130, depth: 55 },               'h3-yatak3', Math.PI,     'classic'),
    mkFurn('h3-f26', 'ceilinglamp',[ 0.90,  3.90], { diameter: 45 },                        'h3-yatak3', 0,           'panel'),
    // Mutfak — bbox x[2.2,4.8] z[2.5,5.3]
    mkFurn('h3-f27', 'counter',    [ 2.90,  2.80], { length: 130, depth: 55 },              'h3-mutfak', 0),
    mkFurn('h3-f28', 'kitchencab', [ 4.20,  2.80], { width: 60, depth: 55 },                'h3-mutfak', 0),
    mkFurn('h3-f29', 'fridge',     [ 4.40,  5.00], { width: 65, depth: 60 },                'h3-mutfak', Math.PI,     'classic'),
    mkFurn('h3-f30', 'dtable',     [ 3.20,  4.60], { length: 120, width: 75 },              'h3-mutfak', 0,           'classic'),
    mkFurn('h3-f31', 'dchair',     [ 2.60,  4.60], {},                                      'h3-mutfak', Math.PI/2,   'classic'),
    mkFurn('h3-f32', 'dchair',     [ 3.80,  4.60], {},                                      'h3-mutfak', -Math.PI/2,  'classic'),
    // Banyo2 — bbox x[-0.1,1.9] z[-4.7,-2.5]
    mkFurn('h3-f33', 'toilet',     [ 0.20, -4.30], { depth: 65 },                           'h3-banyo2', 0,           'classic'),
    mkFurn('h3-f34', 'sink',       [ 1.60, -4.30], { width: 60 },                           'h3-banyo2', 0,           'round'),
    mkFurn('h3-f35', 'bathtub',    [ 0.90, -2.90], { length: 170, width: 70 },              'h3-banyo2', Math.PI,     'classic'),
    mkFurn('h3-f36', 'washer',     [ 0.20, -3.80], {},                                      'h3-banyo2', 0),
  ],
}

// ═══════════════════════════════════════════════════════════════════
//  4. 3+1 EBEVEYN SÜİTİ (h4)
//  Büyük ebeveyn süiti (yatak + soyunma alanı + ensuite); diğer 2 oda ayrı.
//
//  SALON    520×480  center ( 2.60, 0.00)  bbox x[ 0.00, 5.20]  z[-2.4, 2.4]
//  KORIDOR  140×480  center (-0.70, 0.00)  bbox x[-1.40, 0.00]  z[-2.4, 2.4]
//  EBEVEYN  460×420  center (-3.70,-0.30)  bbox x[-6.00,-1.40]  z[-2.4, 1.8]
//  BANYO1   200×200  center (-6.10, 2.20)  bbox x[-7.10,-5.10]  z[ 1.2, 3.2]  ensuite
//  COCUK    280×300  center (-2.90,  3.40) bbox x[-4.30,-1.40]  z[ 1.9, 4.9]
//  YATAK3   250×270  center ( 0.80,  3.80) bbox x[-0.45, 2.05]  z[ 2.4, 5.2]  (0.05 round)
//  MUTFAK   280×270  center ( 3.45,  3.80) bbox x[ 2.05, 4.85]  z[ 2.4, 5.2]
//  BANYO2   180×200  center ( 5.70,  1.20) bbox x[ 4.80, 6.60]  z[ 0.2, 2.2]
// ═══════════════════════════════════════════════════════════════════
const p_h4: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('h4-salon',   'salon',   520, 480, [ 2.60,  0.00], 0x4488ff),
    mkRoom('h4-koridor', 'koridor', 140, 480, [-0.70,  0.00], 0xcc8844, { removedWalls: ['right'] }),
    mkRoom('h4-ebeveyn', 'yatak',   460, 420, [-3.70, -0.30], 0x44cc88, { removedWalls: ['right'] }),
    mkRoom('h4-banyo1',  'banyo',   200, 200, [-6.10,  2.80], 0x44cccc, { removedWalls: ['back'] }),
    mkRoom('h4-cocuk',   'cocuk',   280, 300, [-2.90,  3.50], 0xff44cc, { removedWalls: ['back'] }),
    mkRoom('h4-yatak3',  'yatak',   250, 280, [ 0.85,  3.80], 0x6688ff, { removedWalls: ['back'] }),
    mkRoom('h4-mutfak',  'mutfak',  280, 280, [ 3.50,  3.80], 0xff8844, { removedWalls: ['back', 'left'] }),
    mkRoom('h4-banyo2',  'banyo',   180, 200, [ 6.30,  1.20], 0x44cccc, { removedWalls: ['left'] }),
  ],
  furniture: [
    // Salon
    mkFurn('h4-f1',  'lsofa',      [ 2.60,  0.90], { length: 310, width: 220, depth: 95 }, 'h4-salon', Math.PI,      'modern'),
    mkFurn('h4-f2',  'ctable',     [ 2.60, -0.30], { diameter: 110 },                       'h4-salon', 0,            'marble'),
    mkFurn('h4-f3',  'tvunit',     [ 2.60, -2.10], { length: 230 },                         'h4-salon', Math.PI,      'floating'),
    mkFurn('h4-f4',  'chair',      [ 4.70,  0.40], { diameter: 95 },                        'h4-salon', -Math.PI/4,   'accent'),
    mkFurn('h4-f5',  'rug',        [ 2.60,  0.30], { length: 280, width: 200 },             'h4-salon'),
    mkFurn('h4-f6',  'ceilinglamp',[ 2.60,  0.00], { diameter: 60 },                        'h4-salon', 0,            'chandelier'),
    mkFurn('h4-f7',  'plant',      [ 4.90,  2.10], { diameter: 55 },                        'h4-salon', 0,            'tall'),
    mkFurn('h4-f8',  'floorlamp',  [ 0.40, -2.10], {},                                      'h4-salon', 0,            'tripod'),
    // Ebeveyn süit — bbox x[-6.0,-1.4] z[-2.4,1.8]
    mkFurn('h4-f9',  'bed',        [-3.70, -0.10], { length: 210, width: 200 },             'h4-ebeveyn', 0,          'tufted'),
    mkFurn('h4-f10', 'wardrobe',   [-5.50,  1.30], { width: 220, depth: 60 },               'h4-ebeveyn', 0,          'sliding'),
    mkFurn('h4-f11', 'shelf',      [-1.80,  1.20], { width: 70, height: 150 },              'h4-ebeveyn', 0,          'classic'),
    mkFurn('h4-f12', 'mirror',     [-5.80, -2.20], { width: 80, height: 150 },              'h4-ebeveyn', Math.PI/2,  'oval'),
    mkFurn('h4-f13', 'chair',      [-1.80, -2.00], { diameter: 85 },                        'h4-ebeveyn', Math.PI/4,  'berjer'),
    mkFurn('h4-f14', 'floorlamp',  [-5.80, -1.80], {},                                      'h4-ebeveyn', 0,          'arc'),
    mkFurn('h4-f15', 'ceilinglamp',[-3.70, -0.30], { diameter: 55 },                        'h4-ebeveyn', 0,          'chandelier'),
    // Banyo1 (ensuite) — bbox x[-7.1,-5.1] z[1.2,3.2]
    mkFurn('h4-f16', 'toilet',     [-6.70,  1.95], { depth: 60 },                           'h4-banyo1', 0,           'wall'),
    mkFurn('h4-f17', 'sink',       [-5.40,  1.95], { width: 60 },                           'h4-banyo1', 0,           'double'),
    mkFurn('h4-f18', 'bathtub',    [-6.10,  2.90], { length: 160, width: 75 },              'h4-banyo1', 0,           'freestanding'),
    mkFurn('h4-f19', 'bathroom-cabinet',[-5.40, 2.90], { width: 60, height: 70 },           'h4-banyo1', Math.PI,     'double'),
    // Çocuk — bbox x[-4.3,-1.4] z[1.9,4.9]
    mkFurn('h4-f20', 'bed',        [-3.80,  3.10], { length: 190, width: 100 },             'h4-cocuk', 0,            'modern'),
    mkFurn('h4-f21', 'wardrobe',   [-3.70,  4.50], { width: 110, depth: 55 },               'h4-cocuk', Math.PI,      'classic'),
    mkFurn('h4-f22', 'desk',       [-1.80,  3.10], { length: 110, depth: 55 },              'h4-cocuk', Math.PI/2,    'drawer'),
    mkFurn('h4-f23', 'office-chair',[-2.30, 3.10], {},                                      'h4-cocuk', Math.PI/2,    'ergonomic'),
    mkFurn('h4-f24', 'toy-storage',[-1.90,  4.50], { width: 80, height: 55 },               'h4-cocuk', 0),
    mkFurn('h4-f25', 'ceilinglamp',[-2.90,  3.40], { diameter: 45 },                        'h4-cocuk', 0,            'panel'),
    // Yatak3 — bbox x[-0.4,2.1] z[2.4,5.2]
    mkFurn('h4-f26', 'bed',        [ 0.85,  3.40], { length: 200, width: 140 },             'h4-yatak3', 0,           'classic'),
    mkFurn('h4-f27', 'wardrobe',   [ 1.85,  4.90], { width: 120, depth: 55 },               'h4-yatak3', Math.PI,     'classic'),
    mkFurn('h4-f28', 'ceilinglamp',[ 0.85,  3.80], { diameter: 45 },                        'h4-yatak3', 0,           'panel'),
    // Mutfak — bbox x[2.1,4.9] z[2.4,5.2]
    mkFurn('h4-f29', 'counter',    [ 2.80,  2.70], { length: 130, depth: 55 },              'h4-mutfak', 0),
    mkFurn('h4-f30', 'kitchencab', [ 4.20,  2.70], { width: 60, depth: 55 },                'h4-mutfak', 0),
    mkFurn('h4-f31', 'fridge',     [ 4.50,  2.70], { width: 65, depth: 60 },                'h4-mutfak', 0,           'french'),
    mkFurn('h4-f32', 'dtable',     [ 3.50,  4.40], { length: 140, width: 80 },              'h4-mutfak', 0,           'modern'),
    mkFurn('h4-f33', 'dchair',     [ 2.80,  4.40], {},                                      'h4-mutfak', Math.PI/2,   'upholstered'),
    mkFurn('h4-f34', 'dchair',     [ 4.20,  4.40], {},                                      'h4-mutfak', -Math.PI/2,  'upholstered'),
    mkFurn('h4-f35', 'dishwasher', [ 2.30,  2.70], {},                                      'h4-mutfak', 0),
    // Banyo2 (ortak) — bbox x[4.8,6.6] z[0.2,2.2]
    mkFurn('h4-f36', 'toilet',     [ 5.65,  0.50], { depth: 65 },                           'h4-banyo2', 0,           'classic'),
    mkFurn('h4-f37', 'sink',       [ 6.30,  0.50], { width: 55 },                           'h4-banyo2', 0,           'square'),
    mkFurn('h4-f38', 'shower',     [ 5.80,  1.80], { width: 80, depth: 80 },                'h4-banyo2', 0,           'corner'),
  ],
}

// ═══════════════════════════════════════════════════════════════════
//  5. 3+1 UZUN KORİDOR (h5)
//  Daire derin ve dar: uzun koridor sağda, odalar solda sıralı,
//  salon ve mutfak uçta.
//
//  SALON    420×380  center ( 0.00, -2.40)  bbox x[-2.10, 2.10]  z[-4.3,-0.5]
//  MUTFAK   260×300  center ( 3.40, -2.20)  bbox x[ 2.10, 4.70]  z[-3.7,-0.7]
//  KORIDOR  460×140  center ( 0.20,  0.20)  bbox x[-2.10, 2.50]  z[-0.5, 0.9]
//  EBEVEYN  340×380  center (-1.80,  2.80)  bbox x[-3.50,-0.10]  z[ 0.9, 4.7]
//  COCUK    280×340  center ( 1.40,  2.60)  bbox x[ 0.00, 2.80]  z[ 0.9, 4.3]
//  YATAK3   240×280  center ( 4.00,  0.70)  bbox x[ 2.80, 5.20]  z[-0.7, 2.1]
//  BANYO    220×200  center ( 4.00,  3.20)  bbox x[ 2.90, 5.10]  z[ 2.2, 4.2]
// ═══════════════════════════════════════════════════════════════════
const p_h5: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('h5-salon',   'salon',   420, 380, [ 0.00, -2.40], 0x4488ff),
    mkRoom('h5-mutfak',  'mutfak',  260, 300, [ 3.40, -2.20], 0xff8844, { removedWalls: ['left'] }),
    mkRoom('h5-koridor', 'koridor', 460, 140, [ 0.20,  0.20], 0xcc8844, { removedWalls: ['back'] }),
    mkRoom('h5-ebeveyn', 'yatak',   340, 380, [-1.70,  2.80], 0x44cc88, { removedWalls: ['back'] }),
    mkRoom('h5-cocuk',   'cocuk',   280, 340, [ 1.40,  2.60], 0xff44cc, { removedWalls: ['back', 'left'] }),
    mkRoom('h5-yatak3',  'yatak',   240, 300, [ 4.00,  0.70], 0x6688ff, { removedWalls: ['left'] }),
    mkRoom('h5-banyo',   'banyo',   220, 200, [ 4.00,  3.20], 0x44cccc, { removedWalls: ['back'] }),
  ],
  furniture: [
    // Salon — bbox x[-2.1,2.1] z[-4.3,-0.5]
    mkFurn('h5-f1',  'sofa',       [ 0.00, -1.10], { length: 240 },                         'h5-salon', 0,            'classic'),
    mkFurn('h5-f2',  'ctable',     [ 0.00, -2.30], { diameter: 100 },                       'h5-salon', 0,            'square'),
    mkFurn('h5-f3',  'tvunit',     [ 0.00, -4.00], { length: 200 },                         'h5-salon', 0,            'classic'),
    mkFurn('h5-f4',  'chair',      [-1.60, -3.60], { diameter: 85 },                        'h5-salon', Math.PI/4,    'berjer'),
    mkFurn('h5-f5',  'rug',        [ 0.00, -2.40], { length: 240, width: 180 },             'h5-salon'),
    mkFurn('h5-f6',  'ceilinglamp',[ 0.00, -2.40], { diameter: 55 },                        'h5-salon', 0,            'pendant'),
    mkFurn('h5-f7',  'plant',      [ 1.80, -4.00], { diameter: 50 },                        'h5-salon', 0,            'tall'),
    // Mutfak — bbox x[2.1,4.7] z[-3.7,-0.7]
    mkFurn('h5-f8',  'counter',    [ 3.00, -3.40], { length: 150, depth: 55 },              'h5-mutfak', 0),
    mkFurn('h5-f9',  'kitchencab', [ 4.30, -3.40], { width: 60, depth: 55 },                'h5-mutfak', 0),
    mkFurn('h5-f10', 'fridge',     [ 4.30, -0.95], { width: 65, depth: 60 },                'h5-mutfak', Math.PI,     'classic'),
    mkFurn('h5-f11', 'dtable',     [ 3.40, -1.80], { length: 120, width: 70 },              'h5-mutfak', 0,           'classic'),
    mkFurn('h5-f12', 'dchair',     [ 2.80, -1.80], {},                                      'h5-mutfak', Math.PI/2,   'classic'),
    mkFurn('h5-f13', 'dchair',     [ 4.00, -1.80], {},                                      'h5-mutfak', -Math.PI/2,  'classic'),
    mkFurn('h5-f14', 'dishwasher', [ 2.40, -3.40], {},                                      'h5-mutfak', 0),
    // Ebeveyn — bbox x[-3.5,-0.1] z[0.9,4.7]
    mkFurn('h5-f15', 'bed',        [-1.80,  1.40], { length: 200, width: 180 },             'h5-ebeveyn', 0,          'tufted'),
    mkFurn('h5-f16', 'wardrobe',   [-3.10,  3.20], { width: 200, depth: 55 },               'h5-ebeveyn', Math.PI/2,  'sliding'),
    mkFurn('h5-f17', 'shelf',      [-0.50,  3.20], { width: 70, height: 150 },              'h5-ebeveyn', -Math.PI/2, 'classic'),
    mkFurn('h5-f18', 'mirror',     [-1.80,  4.50], { width: 70, height: 150 },              'h5-ebeveyn', Math.PI,    'rectangle'),
    mkFurn('h5-f19', 'ceilinglamp',[-1.80,  2.80], { diameter: 50 },                        'h5-ebeveyn', 0,          'pendant'),
    // Çocuk — bbox x[0.0,2.8] z[0.9,4.3]
    mkFurn('h5-f20', 'bed',        [ 0.50,  2.20], { length: 190, width: 100 },             'h5-cocuk', 0,            'modern'),
    mkFurn('h5-f21', 'wardrobe',   [ 2.30,  1.30], { width: 100, depth: 55 },               'h5-cocuk', 0,            'classic'),
    mkFurn('h5-f22', 'desk',       [ 2.30,  3.70], { length: 100, depth: 55 },              'h5-cocuk', Math.PI,      'classic'),
    mkFurn('h5-f23', 'office-chair',[ 2.30, 3.20], {},                                      'h5-cocuk', Math.PI,      'basic'),
    mkFurn('h5-f24', 'toy-storage',[ 0.40,  4.00], { width: 80, height: 55 },               'h5-cocuk', 0),
    mkFurn('h5-f25', 'ceilinglamp',[ 1.40,  2.60], { diameter: 45 },                        'h5-cocuk', 0,            'panel'),
    // Yatak3 — bbox x[2.8,5.2] z[-0.7,2.1]
    mkFurn('h5-f26', 'bed',        [ 4.20,  0.30], { length: 200, width: 140 },             'h5-yatak3', 0,           'classic'),
    mkFurn('h5-f27', 'wardrobe',   [ 3.10,  0.70], { width: 110, depth: 55 },               'h5-yatak3', -Math.PI/2,  'classic'),
    mkFurn('h5-f28', 'ceilinglamp',[ 4.00,  0.70], { diameter: 45 },                        'h5-yatak3', 0,           'panel'),
    // Banyo — bbox x[2.9,5.1] z[2.2,4.2]
    mkFurn('h5-f29', 'toilet',     [ 3.20,  2.60], { depth: 60 },                           'h5-banyo', 0,            'classic'),
    mkFurn('h5-f30', 'sink',       [ 4.70,  2.60], { width: 55 },                           'h5-banyo', 0,            'round'),
    mkFurn('h5-f31', 'shower',     [ 3.40,  3.80], { width: 85, depth: 80 },                'h5-banyo', 0,            'corner'),
    mkFurn('h5-f32', 'washer',     [ 4.70,  3.80], {},                                      'h5-banyo', 0),
  ],
}

// ═══════════════════════════════════════════════════════════════════
//  6. 3+1 U PLAN (h6)
//  Odalar U şeklinde: salon ortada, mutfak ve ebeveyn yanlarda,
//  diğer iki oda arkada.
//
//  SALON    460×440  center ( 0.00, 0.00)   bbox x[-2.3, 2.3]   z[-2.2, 2.2]
//  MUTFAK   300×440  center ( 3.80, 0.00)   bbox x[ 2.3, 5.3]   z[-2.2, 2.2]
//  EBEVEYN  320×440  center (-3.90, 0.00)   bbox x[-5.5,-2.3]   z[-2.2, 2.2]
//  COCUK    300×320  center (-3.00, 3.80)   bbox x[-4.50,-1.50] z[ 2.2, 5.4]
//  YATAK3   280×320  center ( 0.00, 3.80)   bbox x[-1.40, 1.40] z[ 2.2, 5.4]
//  BANYO    250×280  center ( 2.85, 3.60)   bbox x[ 1.60, 4.10] z[ 2.2, 5.0]
//  KORIDOR  440×120  center ( 0.00,-2.80)   bbox x[-2.20, 2.20] z[-3.4,-2.2]
// ═══════════════════════════════════════════════════════════════════
const p_h6: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('h6-salon',   'salon',   460, 440, [ 0.00,  0.00], 0x4488ff),
    mkRoom('h6-mutfak',  'mutfak',  300, 440, [ 3.80,  0.00], 0xff8844, { removedWalls: ['left'] }),
    mkRoom('h6-ebeveyn', 'yatak',   320, 440, [-3.90,  0.00], 0x44cc88, { removedWalls: ['right'] }),
    mkRoom('h6-cocuk',   'cocuk',   300, 320, [-3.00,  3.80], 0xff44cc, { removedWalls: ['back'] }),
    mkRoom('h6-yatak3',  'yatak',   280, 320, [ 0.00,  3.80], 0x6688ff, { removedWalls: ['back'] }),
    mkRoom('h6-banyo',   'banyo',   250, 280, [ 2.85,  3.60], 0x44cccc, { removedWalls: ['back'] }),
    mkRoom('h6-koridor', 'koridor', 440, 120, [ 0.00, -2.80], 0xcc8844, { removedWalls: ['front'] }),
  ],
  furniture: [
    // Salon
    mkFurn('h6-f1',  'lsofa',      [ 0.00,  0.80], { length: 280, width: 200, depth: 95 },  'h6-salon', Math.PI,      'classic'),
    mkFurn('h6-f2',  'ctable',     [ 0.00, -0.30], { diameter: 100 },                        'h6-salon', 0,            'round'),
    mkFurn('h6-f3',  'tvunit',     [ 0.00, -2.00], { length: 200 },                          'h6-salon', Math.PI,      'classic'),
    mkFurn('h6-f4',  'chair',      [ 1.80,  1.50], { diameter: 85 },                         'h6-salon', -Math.PI/4,   'berjer'),
    mkFurn('h6-f5',  'rug',        [ 0.00,  0.20], { length: 240, width: 180 },              'h6-salon'),
    mkFurn('h6-f6',  'ceilinglamp',[ 0.00,  0.00], { diameter: 55 },                         'h6-salon', 0,            'chandelier'),
    mkFurn('h6-f7',  'plant',      [-1.90, -1.90], { diameter: 50 },                         'h6-salon', 0,            'tall'),
    // Mutfak — bbox x[2.3,5.3] z[-2.2,2.2]
    mkFurn('h6-f8',  'counter',    [ 2.70, -1.60], { length: 160, depth: 55 },               'h6-mutfak', 0),
    mkFurn('h6-f9',  'kitchencab', [ 4.00, -1.60], { width: 60, depth: 55 },                 'h6-mutfak', 0),
    mkFurn('h6-f10', 'fridge',     [ 4.90, -1.60], { width: 70, depth: 60 },                 'h6-mutfak', 0,           'french'),
    mkFurn('h6-f11', 'dtable',     [ 3.80,  0.40], { length: 140, width: 80 },               'h6-mutfak', 0,           'modern'),
    mkFurn('h6-f12', 'dchair',     [ 3.10,  0.40], {},                                       'h6-mutfak', Math.PI/2,   'upholstered'),
    mkFurn('h6-f13', 'dchair',     [ 4.50,  0.40], {},                                       'h6-mutfak', -Math.PI/2,  'upholstered'),
    mkFurn('h6-f14', 'dishwasher', [ 2.55,  1.80], {},                                       'h6-mutfak', Math.PI),
    mkFurn('h6-f15', 'kitchencab', [ 3.30,  1.85], { width: 60, depth: 55 },                 'h6-mutfak', Math.PI),
    // Ebeveyn — bbox x[-5.5,-2.3] z[-2.2,2.2]
    mkFurn('h6-f16', 'bed',        [-3.90, -0.30], { length: 200, width: 180 },              'h6-ebeveyn', 0,          'tufted'),
    mkFurn('h6-f17', 'wardrobe',   [-5.20,  1.20], { width: 200, depth: 55 },                'h6-ebeveyn', Math.PI/2,  'sliding'),
    mkFurn('h6-f18', 'shelf',      [-2.60,  1.20], { width: 70, height: 150 },               'h6-ebeveyn', -Math.PI/2, 'classic'),
    mkFurn('h6-f19', 'mirror',     [-5.30, -2.00], { width: 60, height: 140 },               'h6-ebeveyn', Math.PI/2,  'oval'),
    mkFurn('h6-f20', 'ceilinglamp',[-3.90,  0.00], { diameter: 50 },                         'h6-ebeveyn', 0,          'pendant'),
    // Çocuk — bbox x[-4.5,-1.5] z[2.2,5.4]
    mkFurn('h6-f21', 'bed',        [-3.70,  3.00], { length: 190, width: 100 },              'h6-cocuk', 0,            'modern'),
    mkFurn('h6-f22', 'wardrobe',   [-4.20,  5.10], { width: 120, depth: 55 },                'h6-cocuk', Math.PI,      'classic'),
    mkFurn('h6-f23', 'desk',       [-1.80,  3.00], { length: 120, depth: 55 },               'h6-cocuk', Math.PI/2,    'lshape'),
    mkFurn('h6-f24', 'office-chair',[-2.30, 3.00], {},                                       'h6-cocuk', Math.PI/2,    'ergonomic'),
    mkFurn('h6-f25', 'bookcase',   [-1.80,  5.00], { width: 80, height: 180 },               'h6-cocuk', Math.PI,      '5shelf'),
    mkFurn('h6-f26', 'ceilinglamp',[-3.00,  3.80], { diameter: 45 },                         'h6-cocuk', 0,            'panel'),
    // Yatak3 — bbox x[-1.4,1.4] z[2.2,5.4]
    mkFurn('h6-f27', 'bed',        [ 0.00,  3.00], { length: 200, width: 140 },              'h6-yatak3', 0,           'classic'),
    mkFurn('h6-f28', 'wardrobe',   [ 1.10,  5.10], { width: 130, depth: 55 },                'h6-yatak3', Math.PI,     'classic'),
    mkFurn('h6-f29', 'shelf',      [-1.10,  5.00], { width: 70, height: 150 },               'h6-yatak3', Math.PI,     'classic'),
    mkFurn('h6-f30', 'ceilinglamp',[ 0.00,  3.80], { diameter: 45 },                         'h6-yatak3', 0,           'panel'),
    // Banyo — bbox x[1.6,4.1] z[2.2,5.0]
    mkFurn('h6-f31', 'toilet',     [ 1.90,  2.60], { depth: 65 },                            'h6-banyo', 0,            'wall'),
    mkFurn('h6-f32', 'sink',       [ 3.80,  2.60], { width: 60 },                            'h6-banyo', 0,            'square'),
    mkFurn('h6-f33', 'bathtub',    [ 2.85,  4.40], { length: 170, width: 75 },               'h6-banyo', 0,            'freestanding'),
    mkFurn('h6-f34', 'bathroom-cabinet',[ 3.80, 4.40], { width: 60, height: 70 },            'h6-banyo', 0,            'double'),
  ],
}

// ═══════════════════════════════════════════════════════════════════
//  7. 3+1 KÖŞE DAİRE (h7)
//  L-plan: iki cephe boyunca geniş salon, mutfak köşede;
//  yatak odaları diğer kenarda.
//
//  SALON    540×420  center ( 0.70, -1.10)  bbox x[-2.00, 3.40]  z[-3.2, 1.0]
//  MUTFAK   280×300  center ( 4.80, -1.70)  bbox x[ 3.40, 6.20]  z[-3.2,-0.2]
//  KORIDOR  460×140  center ( 0.70,  1.70)  bbox x[-1.60, 3.00]  z[ 1.0, 2.4]
//  EBEVEYN  380×400  center (-1.10,  4.40)  bbox x[-3.00, 0.80]  z[ 2.4, 6.4]
//  COCUK    280×300  center ( 2.20,  3.90)  bbox x[ 0.80, 3.60]  z[ 2.4, 5.4]
//  YATAK3   260×280  center (-2.80,  0.10)  bbox x[-4.10,-1.50]  z[-1.3, 1.5]
//  BANYO    220×240  center ( 2.20,  5.80)  bbox x[ 1.10, 3.30]  z[ 4.6, 7.0]
// ═══════════════════════════════════════════════════════════════════
const p_h7: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('h7-salon',   'salon',   540, 420, [ 0.70, -1.10], 0x4488ff),
    mkRoom('h7-mutfak',  'mutfak',  280, 300, [ 4.80, -1.70], 0xff8844, { removedWalls: ['left'] }),
    mkRoom('h7-koridor', 'koridor', 460, 140, [ 0.70,  1.70], 0xcc8844, { removedWalls: ['back'] }),
    mkRoom('h7-ebeveyn', 'yatak',   380, 400, [-1.10,  4.40], 0x44cc88, { removedWalls: ['back'] }),
    mkRoom('h7-cocuk',   'cocuk',   280, 300, [ 2.20,  3.90], 0xff44cc, { removedWalls: ['back', 'left'] }),
    mkRoom('h7-yatak3',  'yatak',   260, 280, [-2.80,  0.10], 0x6688ff, { removedWalls: ['right'] }),
    mkRoom('h7-banyo',   'banyo',   220, 240, [ 2.20,  5.80], 0x44cccc, { removedWalls: ['back'] }),
  ],
  furniture: [
    // Salon — bbox x[-2.0,3.4] z[-3.2,1.0]
    mkFurn('h7-f1',  'lsofa',      [ 0.70,  0.00], { length: 320, width: 220, depth: 95 },   'h7-salon', Math.PI,      'chaise'),
    mkFurn('h7-f2',  'ctable',     [ 0.70, -1.30], { diameter: 110 },                         'h7-salon', 0,            'marble'),
    mkFurn('h7-f3',  'tvunit',     [ 0.70, -3.00], { length: 240 },                           'h7-salon', Math.PI,      'floating'),
    mkFurn('h7-f4',  'chair',      [ 2.80,  0.40], { diameter: 95 },                          'h7-salon', -Math.PI/4,   'wingback'),
    mkFurn('h7-f5',  'rug',        [ 0.70, -0.80], { length: 280, width: 200 },               'h7-salon'),
    mkFurn('h7-f6',  'ceilinglamp',[ 0.70, -1.10], { diameter: 60 },                          'h7-salon', 0,            'chandelier'),
    mkFurn('h7-f7',  'plant',      [-1.70, -3.00], { diameter: 55 },                          'h7-salon', 0,            'tall'),
    mkFurn('h7-f8',  'floorlamp',  [ 3.10, -3.00], {},                                        'h7-salon', 0,            'arc'),
    // Mutfak — bbox x[3.4,6.2] z[-3.2,-0.2]
    mkFurn('h7-f9',  'counter',    [ 4.10, -2.90], { length: 130, depth: 55 },                'h7-mutfak', 0),
    mkFurn('h7-f10', 'kitchencab', [ 5.40, -2.90], { width: 60, depth: 55 },                  'h7-mutfak', 0),
    mkFurn('h7-f11', 'fridge',     [ 5.85, -2.90], { width: 70, depth: 60 },                  'h7-mutfak', 0,           'french'),
    mkFurn('h7-f12', 'dtable',     [ 4.80, -1.20], { length: 140, width: 80 },                'h7-mutfak', 0,           'modern'),
    mkFurn('h7-f13', 'dchair',     [ 4.10, -1.20], {},                                        'h7-mutfak', Math.PI/2,   'upholstered'),
    mkFurn('h7-f14', 'dchair',     [ 5.50, -1.20], {},                                        'h7-mutfak', -Math.PI/2,  'upholstered'),
    mkFurn('h7-f15', 'dishwasher', [ 3.60, -2.90], {},                                        'h7-mutfak', 0),
    // Ebeveyn — bbox x[-3.0,0.8] z[2.4,6.4]
    mkFurn('h7-f16', 'bed',        [-1.10,  3.00], { length: 210, width: 180 },               'h7-ebeveyn', 0,          'tufted'),
    mkFurn('h7-f17', 'wardrobe',   [-2.70,  4.60], { width: 220, depth: 55 },                 'h7-ebeveyn', Math.PI/2,  'sliding'),
    mkFurn('h7-f18', 'shelf',      [ 0.40,  4.60], { width: 70, height: 150 },                'h7-ebeveyn', -Math.PI/2, 'classic'),
    mkFurn('h7-f19', 'mirror',     [-2.80,  6.20], { width: 70, height: 150 },                'h7-ebeveyn', Math.PI,    'rectangle'),
    mkFurn('h7-f20', 'chair',      [ 0.40,  6.00], { diameter: 85 },                          'h7-ebeveyn', 3*Math.PI/4,'berjer'),
    mkFurn('h7-f21', 'ceilinglamp',[-1.10,  4.40], { diameter: 55 },                          'h7-ebeveyn', 0,          'chandelier'),
    // Çocuk — bbox x[0.8,3.6] z[2.4,5.4]
    mkFurn('h7-f22', 'bed',        [ 1.30,  3.20], { length: 190, width: 100 },               'h7-cocuk', 0,            'modern'),
    mkFurn('h7-f23', 'wardrobe',   [ 1.40,  5.10], { width: 110, depth: 55 },                 'h7-cocuk', Math.PI,      'classic'),
    mkFurn('h7-f24', 'desk',       [ 3.20,  3.20], { length: 110, depth: 55 },                'h7-cocuk', Math.PI/2,    'drawer'),
    mkFurn('h7-f25', 'office-chair',[ 2.70, 3.20], {},                                        'h7-cocuk', Math.PI/2,    'basic'),
    mkFurn('h7-f26', 'toy-storage',[ 3.10,  5.10], { width: 80, height: 55 },                 'h7-cocuk', 0),
    mkFurn('h7-f27', 'ceilinglamp',[ 2.20,  3.90], { diameter: 45 },                          'h7-cocuk', 0,            'panel'),
    // Yatak3 — bbox x[-4.1,-1.5] z[-1.3,1.5]
    mkFurn('h7-f28', 'bed',        [-2.80,  0.50], { length: 200, width: 140 },               'h7-yatak3', 0,           'classic'),
    mkFurn('h7-f29', 'wardrobe',   [-3.80, -0.60], { width: 130, depth: 55 },                 'h7-yatak3', 0,           'classic'),
    mkFurn('h7-f30', 'ceilinglamp',[-2.80,  0.10], { diameter: 45 },                          'h7-yatak3', 0,           'panel'),
    // Banyo — bbox x[1.1,3.3] z[4.6,7.0]
    mkFurn('h7-f31', 'toilet',     [ 1.40,  5.00], { depth: 65 },                             'h7-banyo', 0,            'classic'),
    mkFurn('h7-f32', 'sink',       [ 3.00,  5.00], { width: 60 },                             'h7-banyo', 0,            'square'),
    mkFurn('h7-f33', 'shower',     [ 1.60,  6.50], { width: 85, depth: 85 },                  'h7-banyo', 0,            'corner'),
    mkFurn('h7-f34', 'washer',     [ 2.90,  6.50], {},                                        'h7-banyo', 0),
  ],
}

// ═══════════════════════════════════════════════════════════════════
//  8. 3+1 OFİS ODALI (h8)
//  3. yatak odası ev ofisi olarak döşenmiş: çalışma masası, kitaplık,
//  dosya dolabı.
//
//  SALON    500×520  center ( 2.50, 0.00)  bbox x[ 0.00, 5.00]  z[-2.6, 2.6]
//  KORIDOR  140×520  center (-0.70, 0.00)  bbox x[-1.40, 0.00]  z[-2.6, 2.6]
//  EBEVEYN  360×380  center (-3.20,-0.70)  bbox x[-5.00,-1.40]  z[-2.6, 1.2]
//  COCUK    320×340  center (-3.00, 2.90)  bbox x[-4.60,-1.40]  z[ 1.2, 4.6]
//  OFIS     280×300  center ( 0.80, 4.10)  bbox x[-0.60, 2.20]  z[ 2.6, 5.6]
//  MUTFAK   280×300  center ( 3.60, 4.10)  bbox x[ 2.20, 5.00]  z[ 2.6, 5.6]
//  BANYO    220×240  center ( 6.00, 1.30)  bbox x[ 4.90, 7.10]  z[ 0.1, 2.5]
// ═══════════════════════════════════════════════════════════════════
const p_h8: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('h8-salon',   'salon',   500, 520, [ 2.50,  0.00], 0x4488ff),
    mkRoom('h8-koridor', 'koridor', 140, 520, [-0.70,  0.00], 0xcc8844, { removedWalls: ['right'] }),
    mkRoom('h8-ebeveyn', 'yatak',   360, 380, [-3.20, -0.70], 0x44cc88, { removedWalls: ['right'] }),
    mkRoom('h8-cocuk',   'cocuk',   320, 340, [-3.00,  2.90], 0xff44cc, { removedWalls: ['right', 'back'] }),
    mkRoom('h8-ofis',    'yatak',   280, 300, [ 0.80,  4.10], 0x6688ff, { removedWalls: ['back'] }),
    mkRoom('h8-mutfak',  'mutfak',  280, 300, [ 3.60,  4.10], 0xff8844, { removedWalls: ['back', 'left'] }),
    mkRoom('h8-banyo',   'banyo',   220, 240, [ 6.10,  1.30], 0x44cccc, { removedWalls: ['left'] }),
  ],
  furniture: [
    // Salon
    mkFurn('h8-f1',  'lsofa',      [ 2.50,  1.00], { length: 300, width: 220, depth: 95 },   'h8-salon', Math.PI,      'modern'),
    mkFurn('h8-f2',  'ctable',     [ 2.50, -0.30], { diameter: 110 },                         'h8-salon', 0,            'marble'),
    mkFurn('h8-f3',  'tvunit',     [ 2.50, -2.30], { length: 230 },                           'h8-salon', Math.PI,      'floating'),
    mkFurn('h8-f4',  'chair',      [ 4.60,  0.40], { diameter: 95 },                          'h8-salon', -Math.PI/4,   'accent'),
    mkFurn('h8-f5',  'rug',        [ 2.50,  0.30], { length: 280, width: 200 },               'h8-salon'),
    mkFurn('h8-f6',  'ceilinglamp',[ 2.50,  0.00], { diameter: 60 },                          'h8-salon', 0,            'chandelier'),
    mkFurn('h8-f7',  'plant',      [ 4.70,  2.30], { diameter: 55 },                          'h8-salon', 0,            'tall'),
    mkFurn('h8-f8',  'floorlamp',  [ 0.40, -2.30], {},                                        'h8-salon', 0,            'tripod'),
    // Ebeveyn — bbox x[-5.0,-1.4] z[-2.6,1.2]
    mkFurn('h8-f9',  'bed',        [-3.20, -0.40], { length: 200, width: 180 },               'h8-ebeveyn', 0,          'tufted'),
    mkFurn('h8-f10', 'wardrobe',   [-4.50,  0.60], { width: 200, depth: 60 },                 'h8-ebeveyn', 0,          'sliding'),
    mkFurn('h8-f11', 'shelf',      [-1.80,  0.70], { width: 70, height: 150 },                'h8-ebeveyn', 0,          'classic'),
    mkFurn('h8-f12', 'mirror',     [-4.80, -2.20], { width: 60, height: 140 },                'h8-ebeveyn', Math.PI/2,  'oval'),
    mkFurn('h8-f13', 'ceilinglamp',[-3.20, -0.70], { diameter: 50 },                          'h8-ebeveyn', 0,          'pendant'),
    // Çocuk — bbox x[-4.6,-1.4] z[1.2,4.6]
    mkFurn('h8-f14', 'bed',        [-3.90,  2.70], { length: 190, width: 100 },               'h8-cocuk', 0,            'modern'),
    mkFurn('h8-f15', 'wardrobe',   [-4.20,  4.30], { width: 120, depth: 55 },                 'h8-cocuk', Math.PI,      'classic'),
    mkFurn('h8-f16', 'desk',       [-1.80,  2.70], { length: 120, depth: 55 },                'h8-cocuk', Math.PI/2,    'classic'),
    mkFurn('h8-f17', 'office-chair',[-2.30, 2.70], {},                                        'h8-cocuk', Math.PI/2,    'basic'),
    mkFurn('h8-f18', 'bookcase',   [-1.80,  4.30], { width: 80, height: 160 },                'h8-cocuk', Math.PI,      '3shelf'),
    mkFurn('h8-f19', 'ceilinglamp',[-3.00,  2.90], { diameter: 45 },                          'h8-cocuk', 0,            'panel'),
    // Ofis — bbox x[-0.6,2.2] z[2.6,5.6]
    mkFurn('h8-f20', 'desk',       [ 0.30,  3.00], { length: 160, depth: 70 },                'h8-ofis', 0,             'lshape'),
    mkFurn('h8-f21', 'office-chair',[ 0.30, 3.70], {},                                        'h8-ofis', 0,             'executive'),
    mkFurn('h8-f22', 'bookcase',   [-0.30,  5.30], { width: 100, height: 200 },               'h8-ofis', Math.PI,       '5shelf'),
    mkFurn('h8-f23', 'filing-cabinet',[ 1.90, 2.90], { width: 45, height: 100, depth: 50 },   'h8-ofis', 0),
    mkFurn('h8-f24', 'monitor',    [ 0.30,  2.80], { diagonal: 27 },                          'h8-ofis', 0),
    mkFurn('h8-f25', 'shelf',      [ 1.90,  5.20], { width: 60, height: 150 },                'h8-ofis', Math.PI,       'cube'),
    mkFurn('h8-f26', 'ceilinglamp',[ 0.80,  4.10], { diameter: 45 },                          'h8-ofis', 0,             'panel'),
    // Mutfak — bbox x[2.2,5.0] z[2.6,5.6]
    mkFurn('h8-f27', 'counter',    [ 2.90,  2.90], { length: 130, depth: 55 },                'h8-mutfak', 0),
    mkFurn('h8-f28', 'kitchencab', [ 4.20,  2.90], { width: 60, depth: 55 },                  'h8-mutfak', 0),
    mkFurn('h8-f29', 'fridge',     [ 4.60,  2.90], { width: 70, depth: 60 },                  'h8-mutfak', 0,           'french'),
    mkFurn('h8-f30', 'dtable',     [ 3.60,  4.80], { length: 140, width: 80 },                'h8-mutfak', 0,           'modern'),
    mkFurn('h8-f31', 'dchair',     [ 2.90,  4.80], {},                                        'h8-mutfak', Math.PI/2,   'upholstered'),
    mkFurn('h8-f32', 'dchair',     [ 4.30,  4.80], {},                                        'h8-mutfak', -Math.PI/2,  'upholstered'),
    mkFurn('h8-f33', 'dishwasher', [ 2.40,  2.90], {},                                        'h8-mutfak', 0),
    // Banyo — bbox x[4.9,7.1] z[0.1,2.5]
    mkFurn('h8-f34', 'toilet',     [ 5.20,  0.40], { depth: 65 },                             'h8-banyo', 0,            'wall'),
    mkFurn('h8-f35', 'sink',       [ 6.80,  0.40], { width: 60 },                             'h8-banyo', 0,            'square'),
    mkFurn('h8-f36', 'shower',     [ 5.40,  2.00], { width: 90, depth: 85 },                  'h8-banyo', 0,            'corner'),
    mkFurn('h8-f37', 'bathroom-cabinet',[ 6.70, 2.00], { width: 65, height: 70 },             'h8-banyo', 0,            'double'),
  ],
}

export const PRESETS_3PLUS1: Preset[] = [
  { id: '3plus1-traditional', label: '3+1 Geleneksel',     icon: '🏢', description: 'Klasik koridor + salon + 3 yatak odası + mutfak + banyo. Standart Türk daire tipolojisi.',                                    data: p_h1 },
  { id: '3plus1-open',        label: '3+1 Açık Mutfak',    icon: '🍳', description: 'Mutfak salonla birleşik, bar ile ayrık. Modern yaşam tarzı için geniş ortak alan.',                                            data: p_h2 },
  { id: '3plus1-dual-bath',   label: '3+1 İki Banyolu',    icon: '🛁', description: 'Ebeveyn odasına bağlı ensuite + ortak banyo. Kalabalık aile için ayrı banyo konforu.',                                         data: p_h3 },
  { id: '3plus1-master',      label: '3+1 Ebeveyn Süiti',  icon: '👑', description: 'Büyük ebeveyn odası + ayakta giyinme alanı + ensuite küvetli banyo. Lüks ana yatak süit.',                                     data: p_h4 },
  { id: '3plus1-corridor',    label: '3+1 Uzun Koridor',   icon: '▬',  description: 'Derin ve dar mimari; odalar uzun koridor etrafında dizili. Dar cephe parselleri için uygun.',                                  data: p_h5 },
  { id: '3plus1-u',           label: '3+1 U Plan',         icon: 'U',  description: 'Salon merkezde, odalar U şeklinde etrafında. Simetrik ve ferah mekânsal dağılım.',                                             data: p_h6 },
  { id: '3plus1-corner',      label: '3+1 Köşe Daire',     icon: '◤',  description: 'L şeklinde köşe parsel; iki cephe boyunca pencereli salon ve köşe mutfak. Işık alan avantajlı plan.',                         data: p_h7 },
  { id: '3plus1-office',      label: '3+1 Ofis Odalı',     icon: '💻', description: '3. yatak odası ev ofisine dönüştürülmüş: masa, kitaplık, dosya dolabı. Uzaktan çalışan profesyoneller için.',                 data: p_h8 },
]
