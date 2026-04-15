/**
 * 2+1 daire varyasyonları — 8 farklı plan.
 *
 * Mevcut presets.ts'nin mkRoom/mkFurn helper mantığını çoğaltır (export
 * edilmedikleri için). Master PRESETS listesine eklenmek üzere PRESETS_2PLUS1
 * olarak export edilir.
 *
 * KOORDİNAT SİSTEMİ (presets.ts ile aynı):
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
 * MOBİLYA ROTASYONLARI (rotation=0 varsayılanları):
 *   sofa / lsofa : arka +Z → TV -Z'de ise rotation=Math.PI
 *   tvunit       : ekran -Z → odanın içi +Z'de ise rotation=Math.PI
 *   bed          : baş -Z
 *   wardrobe     : kapılar +Z
 *
 * Not: "nightstand" ve "dresser" tipleri henüz FURNITURE_CATALOG'da
 * tanımlı değil; komodinler için küçük 'shelf' (cube) veya küçük 'ctable',
 * şifonyer için 'shelf' (cube) kullanılmıştır.
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
//  V1. 2+1 KLASİK — dikdörtgen, koridor üzerinden dağıtılan klasik plan
//
//  SALON    480×500  center ( 2.40, 0.00)  bbox x[ 0.00, 4.80]  z[-2.5, 2.5]
//  KORIDOR  140×500  center (-0.70, 0.00)  bbox x[-1.40, 0.00]  z[-2.5, 2.5]
//  YATAK1   350×380  center (-3.15,-0.60)  bbox x[-4.90,-1.40]  z[-2.5, 1.3]
//  YATAK2   310×340  center (-2.95, 3.00)  bbox x[-4.50,-1.40]  z[ 1.3, 4.7]
//  BANYO    210×220  center ( 1.05, 3.60)  bbox x[ 0.00, 2.10]  z[ 2.5, 4.7]
//  MUTFAK   270×300  center ( 3.45, 4.00)  bbox x[ 2.10, 4.80]  z[ 2.5, 5.5]
// ═══════════════════════════════════════════════════════════════════
const p_2plus1_classic: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p21a-salon',   'salon',   480, 500, [ 2.40,  0.00], 0x4488ff),
    mkRoom('p21a-koridor', 'koridor', 140, 500, [-0.70,  0.00], 0xcc8844, { removedWalls: ['right'] }),
    mkRoom('p21a-yatak1',  'yatak',   350, 380, [-3.15, -0.60], 0x44cc88, { removedWalls: ['right'] }),
    mkRoom('p21a-yatak2',  'yatak',   310, 340, [-2.95,  3.00], 0x6688ff, { removedWalls: ['right', 'back'] }),
    mkRoom('p21a-banyo',   'banyo',   210, 220, [ 1.05,  3.60], 0x44cccc, { removedWalls: ['back'] }),
    mkRoom('p21a-mutfak',  'mutfak',  270, 300, [ 3.45,  4.00], 0xff8844, { removedWalls: ['back', 'left'] }),
  ],
  furniture: [
    // Salon — bbox x[0,4.8] z[-2.5,2.5]
    mkFurn('p21a-f1',  'sofa',        [ 2.40,  1.10], { length: 260 },                       'p21a-salon', Math.PI, 'classic'),
    mkFurn('p21a-f2',  'ctable',      [ 2.40, -0.10], { diameter: 100 },                     'p21a-salon', 0,        'round'),
    mkFurn('p21a-f3',  'tvunit',      [ 2.40, -2.20], { length: 220 },                       'p21a-salon', Math.PI, 'classic'),
    mkFurn('p21a-f4',  'chair',       [ 4.30,  0.50], { diameter: 95 },                      'p21a-salon', -Math.PI/4, 'berjer'),
    mkFurn('p21a-f5',  'rug',         [ 2.40,  0.30], { length: 260, width: 190 },           'p21a-salon'),
    mkFurn('p21a-f6',  'plant',       [ 4.40,  2.10], { diameter: 55 },                      'p21a-salon', 0,        'tall'),
    mkFurn('p21a-f7',  'ceilinglamp', [ 2.40,  0.00], { diameter: 55 },                      'p21a-salon', 0,        'chandelier'),
    mkFurn('p21a-f8',  'floorlamp',   [ 0.30, -2.20], {},                                    'p21a-salon', 0,        'classic'),
    // Yatak1 (ebeveyn) — bbox x[-4.9,-1.4] z[-2.5,1.3]
    mkFurn('p21a-f9',  'bed',         [-3.15, -0.30], { length: 200, width: 160 },           'p21a-yatak1', 0,       'tufted'),
    mkFurn('p21a-f10', 'wardrobe',    [-4.50,  0.70], { width: 180, depth: 55 },             'p21a-yatak1', 0,       'sliding'),
    // Küçük komodin (shelf - cube) yatağın her iki yanında
    mkFurn('p21a-f11', 'shelf',       [-3.95, -2.20], { width: 45, height: 55 },             'p21a-yatak1', 0,       'cube'),
    mkFurn('p21a-f12', 'shelf',       [-2.35, -2.20], { width: 45, height: 55 },             'p21a-yatak1', 0,       'cube'),
    mkFurn('p21a-f13', 'ceilinglamp', [-3.15, -0.60], { diameter: 45 },                      'p21a-yatak1', 0,       'pendant'),
    // Yatak2 (çocuk) — bbox x[-4.5,-1.4] z[1.3,4.7]
    mkFurn('p21a-f14', 'bed',         [-2.95,  3.30], { length: 190, width: 120 },           'p21a-yatak2', 0,       'modern'),
    mkFurn('p21a-f15', 'wardrobe',    [-4.10,  4.30], { width: 150, depth: 55 },             'p21a-yatak2', 0,       'classic'),
    mkFurn('p21a-f16', 'shelf',       [-1.75,  2.00], { width: 70, height: 160 },            'p21a-yatak2', 0,       'cube'),
    mkFurn('p21a-f17', 'ceilinglamp', [-2.95,  3.00], { diameter: 40 },                      'p21a-yatak2', 0,       'panel'),
    // Mutfak — bbox x[2.1,4.8] z[2.5,5.5]
    mkFurn('p21a-f18', 'counter',     [ 3.20,  2.85], { length: 200, depth: 55 },            'p21a-mutfak', 0),
    mkFurn('p21a-f19', 'kitchencab',  [ 2.40,  2.90], { width: 60, depth: 35 },              'p21a-mutfak', 0),
    mkFurn('p21a-f20', 'kitchencab',  [ 4.40,  2.90], { width: 60, depth: 35 },              'p21a-mutfak', 0),
    mkFurn('p21a-f21', 'fridge',      [ 4.50,  3.90], { width: 70, depth: 65 },              'p21a-mutfak', -Math.PI/2, 'classic'),
    mkFurn('p21a-f22', 'ankastre',    [ 3.20,  2.85], { width: 60 },                         'p21a-mutfak', 0),
    mkFurn('p21a-f23', 'dtable',      [ 3.45,  4.80], { length: 120, width: 75 },            'p21a-mutfak', 0,       'classic'),
    mkFurn('p21a-f24', 'dchair',      [ 2.85,  4.80], {},                                    'p21a-mutfak', Math.PI/2, 'classic'),
    mkFurn('p21a-f25', 'dchair',      [ 4.05,  4.80], {},                                    'p21a-mutfak', -Math.PI/2, 'classic'),
    // Banyo — bbox x[0,2.1] z[2.5,4.7]
    mkFurn('p21a-f26', 'toilet',      [ 0.30,  2.80], { depth: 65 },                         'p21a-banyo', 0,        'classic'),
    mkFurn('p21a-f27', 'sink',        [ 0.35,  3.80], { width: 55 },                         'p21a-banyo', -Math.PI/2, 'round'),
    mkFurn('p21a-f28', 'shower',      [ 1.75,  4.35], { width: 85, depth: 85 },              'p21a-banyo', 0,        'corner'),
    mkFurn('p21a-f29', 'bathroom-cabinet', [ 0.30,  3.80], { width: 55, height: 70 },        'p21a-banyo', -Math.PI/2, 'single'),
    mkFurn('p21a-f30', 'washer',      [ 1.80,  2.80], {},                                    'p21a-banyo', 0),
  ],
}

// ═══════════════════════════════════════════════════════════════════
//  V2. 2+1 MODERN — açık salon + ada mutfak benzeri yerleşim, büyük salon
//
//  SALON    560×520  center ( 2.80, 0.00)  bbox x[ 0.00, 5.60]  z[-2.6, 2.6]
//  KORIDOR  150×520  center (-0.75, 0.00)  bbox x[-1.50, 0.00]  z[-2.6, 2.6]
//  YATAK1   380×400  center (-3.40,-0.60)  bbox x[-5.30,-1.50]  z[-2.6, 1.4]
//  YATAK2   320×320  center (-3.10, 3.00)  bbox x[-4.70,-1.50]  z[ 1.4, 4.6]
//  BANYO    230×220  center ( 1.15, 3.70)  bbox x[ 0.00, 2.30]  z[ 2.6, 4.8]
//  MUTFAK   330×280  center ( 3.95, 4.00)  bbox x[ 2.30, 5.60]  z[ 2.6, 5.4]
// ═══════════════════════════════════════════════════════════════════
const p_2plus1_modern: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p21b-salon',   'salon',   560, 520, [ 2.80,  0.00], 0x4488ff, { wallColor: '#d0d0cc', floorType: 'laminat' }),
    mkRoom('p21b-koridor', 'koridor', 150, 520, [-0.75,  0.00], 0xcc8844, { removedWalls: ['right'] }),
    mkRoom('p21b-yatak1',  'yatak',   380, 400, [-3.40, -0.60], 0x44cc88, { removedWalls: ['right'] }),
    mkRoom('p21b-yatak2',  'yatak',   320, 320, [-3.10,  3.00], 0x6688ff, { removedWalls: ['right', 'back'] }),
    mkRoom('p21b-banyo',   'banyo',   230, 220, [ 1.15,  3.70], 0x44cccc, { removedWalls: ['back'] }),
    mkRoom('p21b-mutfak',  'mutfak',  330, 280, [ 3.95,  4.00], 0xff8844, { removedWalls: ['back', 'left'] }),
  ],
  furniture: [
    // Salon — bbox x[0,5.6] z[-2.6,2.6]
    mkFurn('p21b-f1',  'lsofa',       [ 2.80,  1.00], { length: 310, width: 220, depth: 95 }, 'p21b-salon', Math.PI, 'modern'),
    mkFurn('p21b-f2',  'ctable',      [ 2.80, -0.30], { diameter: 120 },                      'p21b-salon', 0,        'marble'),
    mkFurn('p21b-f3',  'tvunit',      [ 2.80, -2.30], { length: 240 },                        'p21b-salon', Math.PI, 'floating'),
    mkFurn('p21b-f4',  'recliner',    [ 5.00,  0.50], { width: 95, depth: 100 },              'p21b-salon', -Math.PI/4, 'leather'),
    mkFurn('p21b-f5',  'rug',         [ 2.80,  0.20], { length: 300, width: 210 },            'p21b-salon'),
    mkFurn('p21b-f6',  'ceilinglamp', [ 2.80,  0.00], { diameter: 65 },                       'p21b-salon', 0,        'pendant'),
    mkFurn('p21b-f7',  'plant',       [ 5.20,  2.20], { diameter: 60 },                       'p21b-salon', 0,        'tall'),
    mkFurn('p21b-f8',  'wall-art',    [ 2.80, -2.55], { width: 120, height: 70 },             'p21b-salon', 0,        'modern'),
    // Yatak1 (ebeveyn) — bbox x[-5.3,-1.5] z[-2.6,1.4]
    mkFurn('p21b-f9',  'bed',         [-3.40, -0.30], { length: 210, width: 180 },            'p21b-yatak1', 0,       'modern'),
    mkFurn('p21b-f10', 'wardrobe',    [-5.00,  0.80], { width: 240, depth: 60 },              'p21b-yatak1', 0,       'sliding'),
    mkFurn('p21b-f11', 'shelf',       [-4.30, -2.30], { width: 45, height: 55 },              'p21b-yatak1', 0,       'cube'),
    mkFurn('p21b-f12', 'shelf',       [-2.50, -2.30], { width: 45, height: 55 },              'p21b-yatak1', 0,       'cube'),
    mkFurn('p21b-f13', 'ceilinglamp', [-3.40, -0.60], { diameter: 50 },                       'p21b-yatak1', 0,       'panel'),
    mkFurn('p21b-f14', 'mirror',      [-1.75, -1.50], { width: 60, height: 160 },             'p21b-yatak1', 0,       'rectangle'),
    // Yatak2 (çocuk) — bbox x[-4.7,-1.5] z[1.4,4.6]
    mkFurn('p21b-f15', 'bed',         [-3.10,  3.30], { length: 190, width: 120 },            'p21b-yatak2', 0,       'modern'),
    mkFurn('p21b-f16', 'wardrobe',    [-4.35,  4.20], { width: 150, depth: 55 },              'p21b-yatak2', 0,       'sliding'),
    mkFurn('p21b-f17', 'desk',        [-1.90,  2.00], { length: 110, depth: 55 },             'p21b-yatak2', Math.PI/2, 'classic'),
    mkFurn('p21b-f18', 'office-chair',[-2.35,  2.00], {},                                     'p21b-yatak2', Math.PI/2, 'basic'),
    mkFurn('p21b-f19', 'ceilinglamp', [-3.10,  3.00], { diameter: 40 },                       'p21b-yatak2', 0,       'panel'),
    // Mutfak — bbox x[2.3,5.6] z[2.6,5.4]
    mkFurn('p21b-f20', 'counter',     [ 3.45,  2.95], { length: 220, depth: 60 },             'p21b-mutfak', 0),
    mkFurn('p21b-f21', 'kitchencab',  [ 2.70,  3.00], { width: 60, depth: 35 },               'p21b-mutfak', 0),
    mkFurn('p21b-f22', 'kitchencab',  [ 4.20,  3.00], { width: 60, depth: 35 },               'p21b-mutfak', 0),
    mkFurn('p21b-f23', 'fridge',      [ 5.10,  3.00], { width: 80, depth: 70 },               'p21b-mutfak', 0,       'sidebyside'),
    mkFurn('p21b-f24', 'ankastre',    [ 3.45,  2.95], { width: 60 },                          'p21b-mutfak', 0),
    mkFurn('p21b-f25', 'dtable',      [ 3.95,  4.70], { length: 150, width: 85 },             'p21b-mutfak', 0,       'modern'),
    mkFurn('p21b-f26', 'dchair',      [ 3.20,  4.70], {},                                     'p21b-mutfak', Math.PI/2, 'scandi'),
    mkFurn('p21b-f27', 'dchair',      [ 4.70,  4.70], {},                                     'p21b-mutfak', -Math.PI/2,'scandi'),
    // Banyo — bbox x[0,2.3] z[2.6,4.8]
    mkFurn('p21b-f28', 'toilet',      [ 0.30,  2.90], { depth: 60 },                          'p21b-banyo', 0,        'wall'),
    mkFurn('p21b-f29', 'sink',        [ 0.40,  4.00], { width: 70 },                          'p21b-banyo', -Math.PI/2, 'square'),
    mkFurn('p21b-f30', 'shower',      [ 1.85,  4.30], { width: 90, depth: 90 },               'p21b-banyo', 0,        'straight'),
    mkFurn('p21b-f31', 'bathroom-cabinet', [ 0.30,  4.00], { width: 70, height: 80 },         'p21b-banyo', -Math.PI/2, 'double'),
    mkFurn('p21b-f32', 'washer',      [ 1.90,  2.80], {},                                     'p21b-banyo', 0),
  ],
}

// ═══════════════════════════════════════════════════════════════════
//  V3. 2+1 EBEVEYN BANYOLU — master suite, 2 banyo
//
//  SALON      500×480  center ( 2.50, 0.20)  bbox x[ 0.00, 5.00]  z[-2.2, 2.6]
//  KORIDOR    140×480  center (-0.70, 0.20)  bbox x[-1.40, 0.00]  z[-2.2, 2.6]
//  YATAK1     360×340  center (-3.20,-0.50)  bbox x[-5.00,-1.40]  z[-2.2, 1.2]
//  ENSUITE    200×180  center (-4.00, 2.10)  bbox x[-5.00,-3.00]  z[ 1.2, 3.0]
//  YATAK2     280×340  center (-1.80, 2.90)  bbox x[-3.00,-1.40]  z[ 1.2, 4.6]   (NOT: width=160, back'i ensuite ile paylaşıyor: z=1.2 ortak)
//  BANYO      200×200  center ( 1.00, 3.60)  bbox x[ 0.00, 2.00]  z[ 2.6, 4.6]
//  MUTFAK     300×280  center ( 3.50, 4.00)  bbox x[ 2.00, 5.00]  z[ 2.6, 5.4]
//
//  NOT: YATAK2 widthCm 160 yerine 280 yapıldı → bbox x[-3.0, -0.4] çakışacak.
//  Koridor right=0.00, yatak2 right=-0.40 -> overlap! Bunu önlemek için
//  yatak2 widthCm=160 (bbox x[-2.6, -1.0] koridorun left=-1.4'ünü aşar).
//  Çözüm: yatak2 merkez (-2.20, 2.90), width 160, bbox x[-3.0, -1.4] ✅
// ═══════════════════════════════════════════════════════════════════
const p_2plus1_master: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p21c-salon',   'salon',   500, 480, [ 2.50,  0.20], 0x4488ff),
    mkRoom('p21c-koridor', 'koridor', 140, 480, [-0.70,  0.20], 0xcc8844, { removedWalls: ['right'] }),
    // Ebeveyn yatak — sağa koridor
    mkRoom('p21c-yatak1',  'yatak',   360, 340, [-3.20, -0.50], 0x44cc88, { removedWalls: ['right'] }),
    // Ebeveyn banyosu — yatak1'in üst kısmında (önünde z=1.2)
    mkRoom('p21c-ensuite', 'banyo',   200, 180, [-4.00,  2.10], 0x66ddcc, { removedWalls: ['back'] }),
    // Çocuk/misafir yatak — ensuite'in sağında (koridorun soluna yapışık)
    mkRoom('p21c-yatak2',  'yatak',   160, 340, [-2.20,  2.90], 0x6688ff, { removedWalls: ['right', 'back'] }),
    // Ana banyo — salonun önü (ortak duvar back)
    mkRoom('p21c-banyo',   'banyo',   200, 200, [ 1.00,  3.70], 0x44cccc, { removedWalls: ['back'] }),
    // Mutfak
    mkRoom('p21c-mutfak',  'mutfak',  300, 280, [ 3.50,  4.10], 0xff8844, { removedWalls: ['back', 'left'] }),
  ],
  furniture: [
    // Salon — bbox x[0,5] z[-2.2,2.6]
    mkFurn('p21c-f1',  'lsofa',       [ 2.50,  1.30], { length: 290, width: 200, depth: 95 }, 'p21c-salon', Math.PI, 'classic'),
    mkFurn('p21c-f2',  'ctable',      [ 2.50,  0.00], { diameter: 110 },                      'p21c-salon', 0,        'round'),
    mkFurn('p21c-f3',  'tvunit',      [ 2.50, -1.90], { length: 220 },                        'p21c-salon', Math.PI, 'classic'),
    mkFurn('p21c-f4',  'chair',       [ 4.40,  0.90], { diameter: 95 },                       'p21c-salon', -Math.PI/4, 'wingback'),
    mkFurn('p21c-f5',  'rug',         [ 2.50,  0.40], { length: 280, width: 200 },            'p21c-salon'),
    mkFurn('p21c-f6',  'ceilinglamp', [ 2.50,  0.20], { diameter: 60 },                       'p21c-salon', 0,        'chandelier'),
    mkFurn('p21c-f7',  'plant',       [ 4.60,  2.30], { diameter: 60 },                       'p21c-salon', 0,        'tall'),
    mkFurn('p21c-f8',  'floorlamp',   [ 0.30, -1.80], {},                                     'p21c-salon', 0,        'arc'),
    // Yatak1 (ebeveyn) — bbox x[-5,-1.4] z[-2.2,1.2]
    mkFurn('p21c-f9',  'bed',         [-3.20, -0.10], { length: 210, width: 180 },            'p21c-yatak1', 0,       'tufted'),
    mkFurn('p21c-f10', 'wardrobe',    [-4.70,  0.80], { width: 200, depth: 55 },              'p21c-yatak1', 0,       'sliding'),
    mkFurn('p21c-f11', 'shelf',       [-4.15, -1.90], { width: 40, height: 55 },              'p21c-yatak1', 0,       'cube'),
    mkFurn('p21c-f12', 'shelf',       [-2.25, -1.90], { width: 40, height: 55 },              'p21c-yatak1', 0,       'cube'),
    mkFurn('p21c-f13', 'ceilinglamp', [-3.20, -0.50], { diameter: 50 },                       'p21c-yatak1', 0,       'pendant'),
    mkFurn('p21c-f14', 'mirror',      [-1.70, -0.90], { width: 60, height: 150 },             'p21c-yatak1', 0,       'rectangle'),
    // Ensuite (ebeveyn banyosu) — bbox x[-5,-3] z[1.2,3]
    mkFurn('p21c-f15', 'toilet',      [-4.75,  1.55], { depth: 60 },                          'p21c-ensuite', 0,      'wall'),
    mkFurn('p21c-f16', 'sink',        [-4.85,  2.45], { width: 55 },                          'p21c-ensuite', -Math.PI/2, 'round'),
    mkFurn('p21c-f17', 'bathtub',     [-3.40,  2.25], { length: 165, width: 75 },             'p21c-ensuite', Math.PI/2, 'classic'),
    mkFurn('p21c-f18', 'bathroom-cabinet', [-4.85,  2.45], { width: 55, height: 70 },         'p21c-ensuite', -Math.PI/2, 'single'),
    // Yatak2 (misafir/çocuk) — bbox x[-3,-1.4] z[1.2,4.6]
    mkFurn('p21c-f19', 'bed',         [-2.20,  2.05], { length: 190, width: 110 },            'p21c-yatak2', 0,       'modern'),
    mkFurn('p21c-f20', 'wardrobe',    [-2.75,  4.20], { width: 120, depth: 50 },              'p21c-yatak2', 0,       'classic'),
    mkFurn('p21c-f21', 'shelf',       [-1.60,  3.40], { width: 40, height: 55 },              'p21c-yatak2', 0,       'cube'),
    mkFurn('p21c-f22', 'ceilinglamp', [-2.20,  2.90], { diameter: 40 },                       'p21c-yatak2', 0,       'panel'),
    // Ana banyo — bbox x[0,2] z[2.6,4.6]
    mkFurn('p21c-f23', 'toilet',      [ 0.30,  2.90], { depth: 65 },                          'p21c-banyo', 0,        'classic'),
    mkFurn('p21c-f24', 'sink',        [ 0.35,  3.90], { width: 55 },                          'p21c-banyo', -Math.PI/2, 'square'),
    mkFurn('p21c-f25', 'shower',      [ 1.65,  4.25], { width: 85, depth: 85 },               'p21c-banyo', 0,        'corner'),
    mkFurn('p21c-f26', 'washer',      [ 1.70,  2.85], {},                                     'p21c-banyo', 0),
    // Mutfak — bbox x[2,5] z[2.6,5.4]
    mkFurn('p21c-f27', 'counter',     [ 3.10,  2.95], { length: 200, depth: 55 },             'p21c-mutfak', 0),
    mkFurn('p21c-f28', 'kitchencab',  [ 2.40,  3.00], { width: 60, depth: 35 },               'p21c-mutfak', 0),
    mkFurn('p21c-f29', 'fridge',      [ 4.60,  3.00], { width: 75, depth: 70 },               'p21c-mutfak', 0,       'french'),
    mkFurn('p21c-f30', 'ankastre',    [ 3.10,  2.95], { width: 60 },                          'p21c-mutfak', 0),
    mkFurn('p21c-f31', 'dtable',      [ 3.50,  4.80], { length: 140, width: 80 },             'p21c-mutfak', 0,       'classic'),
    mkFurn('p21c-f32', 'dchair',      [ 2.80,  4.80], {},                                     'p21c-mutfak', Math.PI/2, 'upholstered'),
    mkFurn('p21c-f33', 'dchair',      [ 4.20,  4.80], {},                                     'p21c-mutfak', -Math.PI/2,'upholstered'),
  ],
}

// ═══════════════════════════════════════════════════════════════════
//  V4. 2+1 L PLAN — L şeklinde giriş, çocuk odası öne kıvrılmış
//
//  SALON    520×460  center ( 2.60, 0.30)  bbox x[ 0.00, 5.20]  z[-2.0, 2.6]
//  YATAK1   360×380  center (-1.80,-0.10)  bbox x[-3.60, 0.00]  z[-2.0, 1.8]
//  BANYO    210×220  center (-2.55, 2.90)  bbox x[-3.60,-1.50]  z[ 1.8, 4.0]
//  YATAK2   320×300  center (-0.10, 3.20)  bbox x[-1.50, 1.70]  z[ 1.7, 4.7] (z=1.7~yatak1 front 1.8 yakın ama 0.1m ayrık, back duvar bırakılır)
//  KORIDOR yok — salonun koridor fonksiyonu
//  MUTFAK   280×280  center ( 3.30, 3.90)  bbox x[ 1.90, 4.70]  z[ 2.5, 5.3]
// ═══════════════════════════════════════════════════════════════════
const p_2plus1_lplan: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p21d-salon',   'salon',   520, 460, [ 2.60,  0.30], 0x4488ff),
    mkRoom('p21d-yatak1',  'yatak',   360, 380, [-1.80, -0.10], 0x44cc88, { removedWalls: ['right'] }),
    mkRoom('p21d-banyo',   'banyo',   210, 220, [-2.55,  2.90], 0x44cccc, { removedWalls: ['back'] }),
    mkRoom('p21d-yatak2',  'yatak',   320, 300, [-0.10,  3.20], 0x6688ff, { removedWalls: ['right'] }),
    mkRoom('p21d-mutfak',  'mutfak',  280, 280, [ 3.30,  3.90], 0xff8844, { removedWalls: ['back', 'left'] }),
  ],
  furniture: [
    // Salon — bbox x[0,5.2] z[-2.0,2.6]
    mkFurn('p21d-f1',  'sofa',        [ 2.60,  1.20], { length: 280 },                       'p21d-salon', Math.PI, 'chesterfield'),
    mkFurn('p21d-f2',  'ctable',      [ 2.60,  0.10], { diameter: 100 },                     'p21d-salon', 0,        'marble'),
    mkFurn('p21d-f3',  'tvunit',      [ 2.60, -1.70], { length: 220 },                       'p21d-salon', Math.PI, 'classic'),
    mkFurn('p21d-f4',  'chair',       [ 4.60,  1.00], { diameter: 95 },                      'p21d-salon', -Math.PI/2, 'berjer'),
    mkFurn('p21d-f5',  'chair',       [ 0.40,  0.80], { diameter: 95 },                      'p21d-salon', Math.PI/2, 'berjer'),
    mkFurn('p21d-f6',  'rug',         [ 2.60,  0.30], { length: 280, width: 200 },           'p21d-salon'),
    mkFurn('p21d-f7',  'ceilinglamp', [ 2.60,  0.30], { diameter: 60 },                      'p21d-salon', 0,        'chandelier'),
    mkFurn('p21d-f8',  'plant',       [ 4.90,  2.30], { diameter: 55 },                      'p21d-salon', 0,        'tall'),
    mkFurn('p21d-f9',  'wall-art',    [ 2.60, -1.95], { width: 120, height: 60 },            'p21d-salon', 0,        'set'),
    // Yatak1 (ebeveyn) — bbox x[-3.6,0] z[-2.0,1.8]
    mkFurn('p21d-f10', 'bed',         [-1.80,  0.30], { length: 200, width: 160 },           'p21d-yatak1', 0,       'tufted'),
    mkFurn('p21d-f11', 'wardrobe',    [-3.20,  1.40], { width: 180, depth: 55 },             'p21d-yatak1', 0,       'sliding'),
    mkFurn('p21d-f12', 'shelf',       [-2.80, -1.70], { width: 40, height: 55 },             'p21d-yatak1', 0,       'cube'),
    mkFurn('p21d-f13', 'shelf',       [-0.80, -1.70], { width: 40, height: 55 },             'p21d-yatak1', 0,       'cube'),
    mkFurn('p21d-f14', 'ceilinglamp', [-1.80, -0.10], { diameter: 45 },                      'p21d-yatak1', 0,       'pendant'),
    mkFurn('p21d-f15', 'mirror',      [-0.30, -1.00], { width: 50, height: 140 },            'p21d-yatak1', 0,       'oval'),
    // Banyo — bbox x[-3.6,-1.5] z[1.8,4.0]
    mkFurn('p21d-f16', 'toilet',      [-3.25,  2.15], { depth: 65 },                         'p21d-banyo', 0,        'classic'),
    mkFurn('p21d-f17', 'sink',        [-3.30,  3.10], { width: 55 },                         'p21d-banyo', -Math.PI/2, 'round'),
    mkFurn('p21d-f18', 'bathtub',     [-1.85,  2.95], { length: 160, width: 75 },            'p21d-banyo', Math.PI/2, 'classic'),
    mkFurn('p21d-f19', 'bathroom-cabinet', [-3.30,  3.10], { width: 55, height: 70 },        'p21d-banyo', -Math.PI/2, 'double'),
    mkFurn('p21d-f20', 'washer',      [-1.85,  2.15], {},                                    'p21d-banyo', 0),
    // Yatak2 (çocuk) — bbox x[-1.5,1.7] z[1.7,4.7]
    mkFurn('p21d-f21', 'bed',         [-0.10,  3.50], { length: 190, width: 120 },           'p21d-yatak2', 0,       'modern'),
    mkFurn('p21d-f22', 'wardrobe',    [ 1.30,  4.30], { width: 140, depth: 50 },             'p21d-yatak2', 0,       'classic'),
    mkFurn('p21d-f23', 'desk',        [-1.15,  2.30], { length: 100, depth: 55 },            'p21d-yatak2', Math.PI/2, 'drawer'),
    mkFurn('p21d-f24', 'office-chair',[-0.65,  2.30], {},                                    'p21d-yatak2', Math.PI/2, 'ergonomic'),
    mkFurn('p21d-f25', 'shelf',       [-1.15,  4.30], { width: 70, height: 160 },            'p21d-yatak2', 0,       'cube'),
    mkFurn('p21d-f26', 'ceilinglamp', [-0.10,  3.20], { diameter: 40 },                      'p21d-yatak2', 0,       'panel'),
    // Mutfak — bbox x[1.9,4.7] z[2.5,5.3]
    mkFurn('p21d-f27', 'counter',     [ 2.40,  2.80], { length: 180, depth: 55 },            'p21d-mutfak', 0),
    mkFurn('p21d-f28', 'kitchencab',  [ 4.30,  2.85], { width: 70, depth: 35 },              'p21d-mutfak', 0),
    mkFurn('p21d-f29', 'fridge',      [ 4.30,  3.80], { width: 70, depth: 65 },              'p21d-mutfak', -Math.PI/2, 'classic'),
    mkFurn('p21d-f30', 'ankastre',    [ 2.40,  2.80], { width: 60 },                         'p21d-mutfak', 0),
    mkFurn('p21d-f31', 'dtable',      [ 3.00,  4.80], { length: 140, width: 80 },            'p21d-mutfak', 0,       'modern'),
    mkFurn('p21d-f32', 'dchair',      [ 2.30,  4.80], {},                                    'p21d-mutfak', Math.PI/2, 'scandi'),
    mkFurn('p21d-f33', 'dchair',      [ 3.70,  4.80], {},                                    'p21d-mutfak', -Math.PI/2,'scandi'),
  ],
}

// ═══════════════════════════════════════════════════════════════════
//  V5. 2+1 TERASLI — büyük salon + arka teras
//
//  SALON    500×480  center ( 2.50, 0.00)  bbox x[ 0.00, 5.00]  z[-2.4, 2.4]
//  KORIDOR  130×480  center (-0.65, 0.00)  bbox x[-1.30, 0.00]  z[-2.4, 2.4]
//  YATAK1   340×360  center (-3.00,-0.60)  bbox x[-4.70,-1.30]  z[-2.4, 1.2]
//  YATAK2   300×320  center (-2.80,  2.80) bbox x[-4.30,-1.30]  z[ 1.2, 4.4]
//  BANYO    210×220  center ( 1.05,  3.50) bbox x[ 0.00, 2.10]  z[ 2.4, 4.6]
//  MUTFAK   290×280  center ( 3.55,  3.80) bbox x[ 2.10, 5.00]  z[ 2.4, 5.2]
//  TERAS    500×180  center ( 2.50, -3.30) bbox x[ 0.00, 5.00]  z[-4.2,-2.4]
// ═══════════════════════════════════════════════════════════════════
const p_2plus1_terrace: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p21e-salon',   'salon',   500, 480, [ 2.50,  0.00], 0x4488ff),
    mkRoom('p21e-koridor', 'koridor', 130, 480, [-0.65,  0.00], 0xcc8844, { removedWalls: ['right'] }),
    mkRoom('p21e-yatak1',  'yatak',   340, 360, [-3.00, -0.60], 0x44cc88, { removedWalls: ['right'] }),
    mkRoom('p21e-yatak2',  'yatak',   300, 320, [-2.80,  2.80], 0x6688ff, { removedWalls: ['right', 'back'] }),
    mkRoom('p21e-banyo',   'banyo',   210, 220, [ 1.05,  3.50], 0x44cccc, { removedWalls: ['back'] }),
    mkRoom('p21e-mutfak',  'mutfak',  290, 280, [ 3.55,  3.80], 0xff8844, { removedWalls: ['back', 'left'] }),
    // Teras: salonun arkasında (z negatif yönde)
    mkRoom('p21e-teras',   'salon',   500, 180, [ 2.50, -3.30], 0x66aacc, { removedWalls: ['front'], floorType: 'fayans', wallColor: '#cadae4' }),
  ],
  furniture: [
    // Salon — bbox x[0,5] z[-2.4,2.4]
    mkFurn('p21e-f1',  'sofa',        [ 2.50,  1.10], { length: 270 },                       'p21e-salon', Math.PI, 'classic'),
    mkFurn('p21e-f2',  'ctable',      [ 2.50, -0.10], { diameter: 100 },                     'p21e-salon', 0,        'square'),
    mkFurn('p21e-f3',  'tvunit',      [ 2.50, -2.10], { length: 220 },                       'p21e-salon', Math.PI, 'floating'),
    mkFurn('p21e-f4',  'chair',       [ 4.30,  0.40], { diameter: 95 },                      'p21e-salon', -Math.PI/4, 'berjer'),
    mkFurn('p21e-f5',  'rug',         [ 2.50,  0.30], { length: 260, width: 200 },           'p21e-salon'),
    mkFurn('p21e-f6',  'ceilinglamp', [ 2.50,  0.00], { diameter: 60 },                      'p21e-salon', 0,        'chandelier'),
    mkFurn('p21e-f7',  'plant',       [ 4.60,  2.00], { diameter: 55 },                      'p21e-salon', 0,        'tall'),
    // Yatak1 (ebeveyn)
    mkFurn('p21e-f8',  'bed',         [-3.00, -0.30], { length: 200, width: 160 },           'p21e-yatak1', 0,       'tufted'),
    mkFurn('p21e-f9',  'wardrobe',    [-4.30,  0.80], { width: 180, depth: 55 },             'p21e-yatak1', 0,       'sliding'),
    mkFurn('p21e-f10', 'shelf',       [-3.90, -2.10], { width: 40, height: 55 },             'p21e-yatak1', 0,       'cube'),
    mkFurn('p21e-f11', 'shelf',       [-2.10, -2.10], { width: 40, height: 55 },             'p21e-yatak1', 0,       'cube'),
    mkFurn('p21e-f12', 'ceilinglamp', [-3.00, -0.60], { diameter: 45 },                      'p21e-yatak1', 0,       'panel'),
    // Yatak2 (çocuk)
    mkFurn('p21e-f13', 'bed',         [-2.80,  3.10], { length: 190, width: 120 },           'p21e-yatak2', 0,       'modern'),
    mkFurn('p21e-f14', 'wardrobe',    [-3.90,  4.10], { width: 140, depth: 50 },             'p21e-yatak2', 0,       'classic'),
    mkFurn('p21e-f15', 'desk',        [-1.65,  2.00], { length: 100, depth: 55 },            'p21e-yatak2', Math.PI/2, 'classic'),
    mkFurn('p21e-f16', 'office-chair',[-2.15,  2.00], {},                                    'p21e-yatak2', Math.PI/2, 'basic'),
    mkFurn('p21e-f17', 'ceilinglamp', [-2.80,  2.80], { diameter: 40 },                      'p21e-yatak2', 0,       'panel'),
    // Banyo
    mkFurn('p21e-f18', 'toilet',      [ 0.30,  2.70], { depth: 65 },                         'p21e-banyo', 0,        'classic'),
    mkFurn('p21e-f19', 'sink',        [ 0.35,  3.70], { width: 55 },                         'p21e-banyo', -Math.PI/2, 'round'),
    mkFurn('p21e-f20', 'shower',      [ 1.75,  4.15], { width: 85, depth: 85 },              'p21e-banyo', 0,        'corner'),
    mkFurn('p21e-f21', 'bathroom-cabinet', [ 0.35,  4.30], { width: 55, height: 70 },        'p21e-banyo', -Math.PI/2, 'single'),
    mkFurn('p21e-f22', 'washer',      [ 1.80,  2.70], {},                                    'p21e-banyo', 0),
    // Mutfak
    mkFurn('p21e-f23', 'counter',     [ 3.00,  2.70], { length: 180, depth: 55 },            'p21e-mutfak', 0),
    mkFurn('p21e-f24', 'fridge',      [ 4.70,  2.70], { width: 70, depth: 65 },              'p21e-mutfak', 0,       'classic'),
    mkFurn('p21e-f25', 'ankastre',    [ 3.00,  2.70], { width: 60 },                         'p21e-mutfak', 0),
    mkFurn('p21e-f26', 'kitchencab',  [ 2.45,  2.75], { width: 60, depth: 35 },              'p21e-mutfak', 0),
    mkFurn('p21e-f27', 'dtable',      [ 3.55,  4.60], { length: 140, width: 80 },            'p21e-mutfak', 0,       'classic'),
    mkFurn('p21e-f28', 'dchair',      [ 2.85,  4.60], {},                                    'p21e-mutfak', Math.PI/2, 'classic'),
    mkFurn('p21e-f29', 'dchair',      [ 4.25,  4.60], {},                                    'p21e-mutfak', -Math.PI/2,'classic'),
    // Teras — bbox x[0,5] z[-4.2,-2.4]
    mkFurn('p21e-f30', 'garden-table', [ 2.00, -3.30], { diameter: 100 },                    'p21e-teras', 0,        'round'),
    mkFurn('p21e-f31', 'garden-chair', [ 1.20, -3.30], { diameter: 55 },                     'p21e-teras', Math.PI/2, 'rattan'),
    mkFurn('p21e-f32', 'garden-chair', [ 2.80, -3.30], { diameter: 55 },                     'p21e-teras', -Math.PI/2,'rattan'),
    mkFurn('p21e-f33', 'umbrella',    [ 2.00, -3.30], { diameter: 250 },                     'p21e-teras', 0),
    mkFurn('p21e-f34', 'plant',       [ 4.30, -3.10], { diameter: 55 },                      'p21e-teras', 0,        'tall'),
    mkFurn('p21e-f35', 'plant',       [ 4.30, -3.80], { diameter: 55 },                      'p21e-teras', 0,        'classic'),
  ],
}

// ═══════════════════════════════════════════════════════════════════
//  V6. 2+1 KÖŞE DAİRE — iki cephe, geniş salon, açı yok (dikdörtgen)
//
//  SALON    550×520  center ( 2.75, 0.00)  bbox x[ 0.00, 5.50]  z[-2.6, 2.6]
//  KORIDOR  140×520  center (-0.70, 0.00)  bbox x[-1.40, 0.00]  z[-2.6, 2.6]
//  YATAK1   380×400  center (-3.30,-0.60)  bbox x[-5.20,-1.40]  z[-2.6, 1.4]
//  YATAK2   300×320  center (-2.90, 3.00)  bbox x[-4.40,-1.40]  z[ 1.4, 4.6]
//  BANYO    220×230  center ( 1.10, 3.75)  bbox x[ 0.00, 2.20]  z[ 2.6, 4.9]
//  MUTFAK   320×300  center ( 3.80, 4.10)  bbox x[ 2.20, 5.40]  z[ 2.6, 5.6]  (width 320 <5.5-2.2=3.3 OK)
// ═══════════════════════════════════════════════════════════════════
const p_2plus1_corner: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p21f-salon',   'salon',   550, 520, [ 2.75,  0.00], 0x4488ff),
    mkRoom('p21f-koridor', 'koridor', 140, 520, [-0.70,  0.00], 0xcc8844, { removedWalls: ['right'] }),
    mkRoom('p21f-yatak1',  'yatak',   380, 400, [-3.30, -0.60], 0x44cc88, { removedWalls: ['right'] }),
    mkRoom('p21f-yatak2',  'yatak',   300, 320, [-2.90,  3.00], 0x6688ff, { removedWalls: ['right', 'back'] }),
    mkRoom('p21f-banyo',   'banyo',   220, 230, [ 1.10,  3.75], 0x44cccc, { removedWalls: ['back'] }),
    mkRoom('p21f-mutfak',  'mutfak',  320, 300, [ 3.80,  4.10], 0xff8844, { removedWalls: ['back', 'left'] }),
  ],
  furniture: [
    // Salon — bbox x[0,5.5] z[-2.6,2.6]
    mkFurn('p21f-f1',  'lsofa',       [ 2.75,  1.10], { length: 320, width: 220, depth: 100 },'p21f-salon', Math.PI, 'chaise'),
    mkFurn('p21f-f2',  'ctable',      [ 2.75, -0.30], { diameter: 115 },                     'p21f-salon', 0,        'marble'),
    mkFurn('p21f-f3',  'tvunit',      [ 2.75, -2.35], { length: 240 },                       'p21f-salon', Math.PI, 'floating'),
    mkFurn('p21f-f4',  'chair',       [ 4.90,  0.50], { diameter: 100 },                     'p21f-salon', -Math.PI/4, 'wingback'),
    mkFurn('p21f-f5',  'recliner',    [ 4.80, -1.20], { width: 95, depth: 100 },             'p21f-salon', -Math.PI/2, 'fabric'),
    mkFurn('p21f-f6',  'rug',         [ 2.75,  0.30], { length: 300, width: 220 },           'p21f-salon'),
    mkFurn('p21f-f7',  'ceilinglamp', [ 2.75,  0.00], { diameter: 65 },                      'p21f-salon', 0,        'chandelier'),
    mkFurn('p21f-f8',  'plant',       [ 5.10,  2.30], { diameter: 60 },                      'p21f-salon', 0,        'tall'),
    mkFurn('p21f-f9',  'floorlamp',   [ 0.40, -2.40], {},                                    'p21f-salon', 0,        'arc'),
    mkFurn('p21f-f10', 'wall-clock',  [ 2.75, -2.55], { diameter: 50 },                      'p21f-salon', 0,        'round'),
    // Yatak1 (ebeveyn)
    mkFurn('p21f-f11', 'bed',         [-3.30, -0.30], { length: 210, width: 180 },           'p21f-yatak1', 0,       'tufted'),
    mkFurn('p21f-f12', 'wardrobe',    [-4.90,  0.90], { width: 220, depth: 60 },             'p21f-yatak1', 0,       'sliding'),
    mkFurn('p21f-f13', 'shelf',       [-4.30, -2.30], { width: 45, height: 55 },             'p21f-yatak1', 0,       'cube'),
    mkFurn('p21f-f14', 'shelf',       [-2.30, -2.30], { width: 45, height: 55 },             'p21f-yatak1', 0,       'cube'),
    mkFurn('p21f-f15', 'ceilinglamp', [-3.30, -0.60], { diameter: 50 },                      'p21f-yatak1', 0,       'pendant'),
    mkFurn('p21f-f16', 'mirror',      [-1.70, -1.20], { width: 60, height: 160 },            'p21f-yatak1', 0,       'oval'),
    mkFurn('p21f-f17', 'floorlamp',   [-1.75, -2.20], {},                                    'p21f-yatak1', 0,        'tripod'),
    // Yatak2 (çocuk)
    mkFurn('p21f-f18', 'bed',         [-2.90,  3.30], { length: 190, width: 120 },           'p21f-yatak2', 0,       'modern'),
    mkFurn('p21f-f19', 'wardrobe',    [-4.10,  4.20], { width: 150, depth: 55 },             'p21f-yatak2', 0,       'classic'),
    mkFurn('p21f-f20', 'shelf',       [-1.70,  2.00], { width: 80, height: 160 },            'p21f-yatak2', 0,       'cube'),
    mkFurn('p21f-f21', 'ceilinglamp', [-2.90,  3.00], { diameter: 40 },                      'p21f-yatak2', 0,       'panel'),
    // Banyo
    mkFurn('p21f-f22', 'toilet',      [ 0.30,  2.95], { depth: 65 },                         'p21f-banyo', 0,        'classic'),
    mkFurn('p21f-f23', 'sink',        [ 0.35,  4.00], { width: 60 },                         'p21f-banyo', -Math.PI/2, 'square'),
    mkFurn('p21f-f24', 'bathtub',     [ 1.30,  4.45], { length: 170, width: 75 },            'p21f-banyo', 0,        'classic'),
    mkFurn('p21f-f25', 'bathroom-cabinet', [ 0.35,  4.00], { width: 60, height: 75 },        'p21f-banyo', -Math.PI/2, 'double'),
    mkFurn('p21f-f26', 'washer',      [ 1.90,  2.95], {},                                    'p21f-banyo', 0),
    // Mutfak
    mkFurn('p21f-f27', 'counter',     [ 3.30,  2.95], { length: 210, depth: 60 },            'p21f-mutfak', 0),
    mkFurn('p21f-f28', 'kitchencab',  [ 2.55,  3.00], { width: 60, depth: 35 },              'p21f-mutfak', 0),
    mkFurn('p21f-f29', 'kitchencab',  [ 4.70,  3.00], { width: 70, depth: 35 },              'p21f-mutfak', 0),
    mkFurn('p21f-f30', 'fridge',      [ 5.00,  3.95], { width: 75, depth: 70 },              'p21f-mutfak', -Math.PI/2, 'french'),
    mkFurn('p21f-f31', 'ankastre',    [ 3.30,  2.95], { width: 60 },                         'p21f-mutfak', 0),
    mkFurn('p21f-f32', 'dtable',      [ 3.80,  4.90], { length: 150, width: 85 },            'p21f-mutfak', 0,       'modern'),
    mkFurn('p21f-f33', 'dchair',      [ 3.00,  4.90], {},                                    'p21f-mutfak', Math.PI/2, 'upholstered'),
    mkFurn('p21f-f34', 'dchair',      [ 4.60,  4.90], {},                                    'p21f-mutfak', -Math.PI/2,'upholstered'),
    mkFurn('p21f-f35', 'dchair',      [ 3.80,  4.40], {},                                    'p21f-mutfak', 0,        'upholstered'),
  ],
}

// ═══════════════════════════════════════════════════════════════════
//  V7. 2+1 İKİ BALKONLU — salon ve yatak balkonu
//
//  SALON    480×460  center ( 2.40, 0.00)  bbox x[ 0.00, 4.80]  z[-2.3, 2.3]
//  KORIDOR  130×460  center (-0.65, 0.00)  bbox x[-1.30, 0.00]  z[-2.3, 2.3]
//  YATAK1   340×360  center (-3.00,-0.50)  bbox x[-4.70,-1.30]  z[-2.3, 1.3]
//  YATAK2   310×320  center (-2.85, 2.90)  bbox x[-4.40,-1.30]  z[ 1.3, 4.5]
//  BANYO    210×220  center ( 1.05, 3.40)  bbox x[ 0.00, 2.10]  z[ 2.3, 4.5]
//  MUTFAK   270×280  center ( 3.45, 3.70)  bbox x[ 2.10, 4.80]  z[ 2.3, 5.1]
//  BALKON1  480×120  center ( 2.40,-2.90)  bbox x[ 0.00, 4.80]  z[-3.5,-2.3]  (salon arka)
//  BALKON2  340×110  center (-3.00,-2.85)  bbox x[-4.70,-1.30]  z[-3.4,-2.3]  (yatak1 arka)
// ═══════════════════════════════════════════════════════════════════
const p_2plus1_balcony: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p21g-salon',   'salon',   480, 460, [ 2.40,  0.00], 0x4488ff),
    mkRoom('p21g-koridor', 'koridor', 130, 460, [-0.65,  0.00], 0xcc8844, { removedWalls: ['right'] }),
    mkRoom('p21g-yatak1',  'yatak',   340, 360, [-3.00, -0.50], 0x44cc88, { removedWalls: ['right'] }),
    mkRoom('p21g-yatak2',  'yatak',   310, 320, [-2.85,  2.90], 0x6688ff, { removedWalls: ['right', 'back'] }),
    mkRoom('p21g-banyo',   'banyo',   210, 220, [ 1.05,  3.40], 0x44cccc, { removedWalls: ['back'] }),
    mkRoom('p21g-mutfak',  'mutfak',  270, 280, [ 3.45,  3.70], 0xff8844, { removedWalls: ['back', 'left'] }),
    mkRoom('p21g-balkon1', 'salon',   480, 120, [ 2.40, -2.90], 0x66aacc, { removedWalls: ['front'], floorType: 'fayans', wallColor: '#cadae4' }),
    mkRoom('p21g-balkon2', 'salon',   340, 110, [-3.00, -2.85], 0x66aacc, { removedWalls: ['front'], floorType: 'fayans', wallColor: '#cadae4' }),
  ],
  furniture: [
    // Salon
    mkFurn('p21g-f1',  'sofa',        [ 2.40,  1.10], { length: 260 },                       'p21g-salon', Math.PI, 'minimal'),
    mkFurn('p21g-f2',  'ctable',      [ 2.40, -0.10], { diameter: 95 },                      'p21g-salon', 0,        'round'),
    mkFurn('p21g-f3',  'tvunit',      [ 2.40, -2.00], { length: 210 },                       'p21g-salon', Math.PI, 'floating'),
    mkFurn('p21g-f4',  'chair',       [ 4.30,  0.40], { diameter: 90 },                      'p21g-salon', -Math.PI/4, 'accent'),
    mkFurn('p21g-f5',  'rug',         [ 2.40,  0.30], { length: 250, width: 190 },           'p21g-salon'),
    mkFurn('p21g-f6',  'ceilinglamp', [ 2.40,  0.00], { diameter: 55 },                      'p21g-salon', 0,        'pendant'),
    mkFurn('p21g-f7',  'plant',       [ 4.40,  1.90], { diameter: 50 },                      'p21g-salon', 0,        'tall'),
    // Yatak1 (ebeveyn)
    mkFurn('p21g-f8',  'bed',         [-3.00, -0.20], { length: 200, width: 160 },           'p21g-yatak1', 0,       'modern'),
    mkFurn('p21g-f9',  'wardrobe',    [-4.30,  0.90], { width: 170, depth: 55 },             'p21g-yatak1', 0,       'sliding'),
    mkFurn('p21g-f10', 'shelf',       [-3.90, -2.00], { width: 40, height: 55 },             'p21g-yatak1', 0,       'cube'),
    mkFurn('p21g-f11', 'shelf',       [-2.10, -2.00], { width: 40, height: 55 },             'p21g-yatak1', 0,       'cube'),
    mkFurn('p21g-f12', 'ceilinglamp', [-3.00, -0.50], { diameter: 45 },                      'p21g-yatak1', 0,       'panel'),
    // Yatak2 (çocuk)
    mkFurn('p21g-f13', 'bed',         [-2.85,  3.20], { length: 190, width: 120 },           'p21g-yatak2', 0,       'modern'),
    mkFurn('p21g-f14', 'wardrobe',    [-4.00,  4.10], { width: 140, depth: 50 },             'p21g-yatak2', 0,       'classic'),
    mkFurn('p21g-f15', 'shelf',       [-1.65,  1.90], { width: 70, height: 150 },            'p21g-yatak2', 0,       'cube'),
    mkFurn('p21g-f16', 'ceilinglamp', [-2.85,  2.90], { diameter: 40 },                      'p21g-yatak2', 0,       'panel'),
    // Banyo
    mkFurn('p21g-f17', 'toilet',      [ 0.30,  2.60], { depth: 65 },                         'p21g-banyo', 0,        'classic'),
    mkFurn('p21g-f18', 'sink',        [ 0.35,  3.60], { width: 55 },                         'p21g-banyo', -Math.PI/2, 'round'),
    mkFurn('p21g-f19', 'shower',      [ 1.75,  4.05], { width: 85, depth: 85 },              'p21g-banyo', 0,        'straight'),
    mkFurn('p21g-f20', 'washer',      [ 1.80,  2.60], {},                                    'p21g-banyo', 0),
    mkFurn('p21g-f21', 'bathroom-cabinet', [ 0.35,  4.20], { width: 55, height: 70 },        'p21g-banyo', -Math.PI/2, 'single'),
    // Mutfak
    mkFurn('p21g-f22', 'counter',     [ 2.95,  2.60], { length: 160, depth: 55 },            'p21g-mutfak', 0),
    mkFurn('p21g-f23', 'kitchencab',  [ 4.50,  2.65], { width: 60, depth: 35 },              'p21g-mutfak', 0),
    mkFurn('p21g-f24', 'fridge',      [ 4.50,  3.60], { width: 65, depth: 65 },              'p21g-mutfak', -Math.PI/2, 'classic'),
    mkFurn('p21g-f25', 'ankastre',    [ 2.95,  2.60], { width: 60 },                         'p21g-mutfak', 0),
    mkFurn('p21g-f26', 'dtable',      [ 3.10,  4.40], { length: 130, width: 75 },            'p21g-mutfak', 0,       'classic'),
    mkFurn('p21g-f27', 'dchair',      [ 2.50,  4.40], {},                                    'p21g-mutfak', Math.PI/2, 'classic'),
    mkFurn('p21g-f28', 'dchair',      [ 3.70,  4.40], {},                                    'p21g-mutfak', -Math.PI/2,'classic'),
    // Balkon1 (salon balkonu)
    mkFurn('p21g-f29', 'garden-chair',[ 1.50, -2.90], { diameter: 50 },                      'p21g-balkon1', Math.PI/2, 'rattan'),
    mkFurn('p21g-f30', 'garden-chair',[ 3.30, -2.90], { diameter: 50 },                      'p21g-balkon1', -Math.PI/2,'rattan'),
    mkFurn('p21g-f31', 'garden-table',[ 2.40, -2.90], { diameter: 70 },                      'p21g-balkon1', 0,        'round'),
    mkFurn('p21g-f32', 'plant',       [ 4.50, -2.90], { diameter: 45 },                      'p21g-balkon1', 0,        'tall'),
    // Balkon2 (yatak balkonu)
    mkFurn('p21g-f33', 'garden-chair',[-3.00, -2.85], { diameter: 45 },                      'p21g-balkon2', 0,        'rattan'),
    mkFurn('p21g-f34', 'plant',       [-4.30, -2.85], { diameter: 40 },                      'p21g-balkon2', 0,        'classic'),
    mkFurn('p21g-f35', 'plant',       [-1.70, -2.85], { diameter: 40 },                      'p21g-balkon2', 0,        'cactus'),
  ],
}

// ═══════════════════════════════════════════════════════════════════
//  V8. 2+1 AÇIK MUTFAK — salon + mutfak tek hacim, barlı ada
//
//  COMMON   680×480  center ( 2.00, 0.00)  bbox x[-1.40, 5.40]  z[-2.4, 2.4]
//    (salon batı ↔ açık mutfak doğu, bar ile ayrılır)
//  YATAK1   370×400  center (-3.15,-0.40)  bbox x[-5.00,-1.30]  z[-2.4, 1.6]
//  YATAK2   320×330  center (-3.00, 3.15)  bbox x[-4.60,-1.40]  z[ 1.5, 4.8]   (NOT: width=320 x[-4.6,-1.4]; back z=1.5 — yatak1 front z=1.6)
//    → YATAK2 back z=1.65 tam paylaşım için center z=3.225, length=330; z[1.6,4.85]. Basit tutmak için:
//    YATAK2 center (-3.00, 3.20) length 320 → z[1.6,4.8]  back ortak.
//  BANYO    230×230  center (-0.15, 3.65)  bbox x[-1.30, 1.00]  z[ 2.4, 4.9]  (back salon front)
//  KORIDOR  ufak sol giriş; şimdilik yok, yatak1 salona direkt açılıyor (removedWalls)
// ═══════════════════════════════════════════════════════════════════
const p_2plus1_open: LayoutData = {
  version: VERSION,
  rooms: [
    // Salon + açık mutfak tek hacim
    mkRoom('p21h-salon',   'salon',   680, 480, [ 2.00,  0.00], 0x4488ff, { wallColor: '#ead9c4', floorType: 'laminat' }),
    mkRoom('p21h-yatak1',  'yatak',   370, 400, [-3.15, -0.40], 0x44cc88, { removedWalls: ['right'] }),
    mkRoom('p21h-yatak2',  'yatak',   320, 320, [-3.00,  3.20], 0x6688ff, { removedWalls: ['right', 'back'] }),
    mkRoom('p21h-banyo',   'banyo',   230, 250, [-0.15,  3.65], 0x44cccc, { removedWalls: ['back'] }),
  ],
  furniture: [
    // OTURMA GRUBU (salonun solu, x<2)
    mkFurn('p21h-f1',  'lsofa',       [ 0.30,  1.10], { length: 300, width: 220, depth: 100 },'p21h-salon', Math.PI, 'modern'),
    mkFurn('p21h-f2',  'ctable',      [ 0.30, -0.30], { diameter: 110 },                     'p21h-salon', 0,        'marble'),
    mkFurn('p21h-f3',  'tvunit',      [ 0.30, -2.15], { length: 240 },                       'p21h-salon', Math.PI, 'floating'),
    mkFurn('p21h-f4',  'chair',       [ 2.20,  0.40], { diameter: 95 },                      'p21h-salon', -Math.PI/2, 'accent'),
    mkFurn('p21h-f5',  'rug',         [ 0.30,  0.20], { length: 280, width: 200 },           'p21h-salon'),
    mkFurn('p21h-f6',  'ceilinglamp', [ 0.30,  0.00], { diameter: 60 },                      'p21h-salon', 0,        'chandelier'),
    mkFurn('p21h-f7',  'plant',       [ 2.30, -2.10], { diameter: 55 },                      'p21h-salon', 0,        'tall'),
    mkFurn('p21h-f8',  'floorlamp',   [-1.20, -2.10], {},                                    'p21h-salon', 0,        'arc'),
    // YEMEK / AÇIK MUTFAK (salonun sağı, x>2)
    mkFurn('p21h-f9',  'counter',     [ 4.50, -2.15], { length: 280, depth: 60 },            'p21h-salon', 0),
    mkFurn('p21h-f10', 'kitchencab',  [ 3.20, -2.10], { width: 60, depth: 35 },              'p21h-salon', 0),
    mkFurn('p21h-f11', 'kitchencab',  [ 5.20, -2.10], { width: 60, depth: 35 },              'p21h-salon', 0),
    mkFurn('p21h-f12', 'fridge',      [ 5.10, -2.10], { width: 75, depth: 70 },              'p21h-salon', 0,        'french'),
    mkFurn('p21h-f13', 'ankastre',    [ 4.50, -2.15], { width: 60 },                         'p21h-salon', 0),
    // Bar adası — counter olarak (length 180 bar)
    mkFurn('p21h-f14', 'counter',     [ 4.50, -0.80], { length: 180, depth: 60 },            'p21h-salon', 0),
    // Bar taburesi x3 (bar adasının güneyi -0.5)
    mkFurn('p21h-f15', 'barstool',    [ 3.90, -0.30], { diameter: 38 },                      'p21h-salon', Math.PI,   'modern'),
    mkFurn('p21h-f16', 'barstool',    [ 4.50, -0.30], { diameter: 38 },                      'p21h-salon', Math.PI,   'modern'),
    mkFurn('p21h-f17', 'barstool',    [ 5.10, -0.30], { diameter: 38 },                      'p21h-salon', Math.PI,   'modern'),
    // Yemek masası
    mkFurn('p21h-f18', 'dtable',      [ 4.50,  1.50], { length: 160, width: 85 },            'p21h-salon', 0,        'modern'),
    mkFurn('p21h-f19', 'dchair',      [ 3.70,  1.50], {},                                    'p21h-salon', Math.PI/2, 'scandi'),
    mkFurn('p21h-f20', 'dchair',      [ 5.30,  1.50], {},                                    'p21h-salon', -Math.PI/2,'scandi'),
    mkFurn('p21h-f21', 'dchair',      [ 4.50,  0.95], {},                                    'p21h-salon', 0,        'scandi'),
    mkFurn('p21h-f22', 'dchair',      [ 4.50,  2.05], {},                                    'p21h-salon', Math.PI,   'scandi'),
    mkFurn('p21h-f23', 'ceilinglamp', [ 4.50,  1.50], { diameter: 55 },                      'p21h-salon', 0,        'pendant'),
    // Yatak1 (ebeveyn)
    mkFurn('p21h-f24', 'bed',         [-3.15, -0.10], { length: 210, width: 180 },           'p21h-yatak1', 0,       'tufted'),
    mkFurn('p21h-f25', 'wardrobe',    [-4.60,  1.20], { width: 220, depth: 60 },             'p21h-yatak1', 0,       'sliding'),
    mkFurn('p21h-f26', 'shelf',       [-4.20, -2.10], { width: 40, height: 55 },             'p21h-yatak1', 0,       'cube'),
    mkFurn('p21h-f27', 'shelf',       [-2.10, -2.10], { width: 40, height: 55 },             'p21h-yatak1', 0,       'cube'),
    mkFurn('p21h-f28', 'ceilinglamp', [-3.15, -0.40], { diameter: 50 },                      'p21h-yatak1', 0,       'pendant'),
    mkFurn('p21h-f29', 'mirror',      [-1.65, -1.10], { width: 55, height: 150 },            'p21h-yatak1', 0,       'rectangle'),
    // Yatak2 (çocuk)
    mkFurn('p21h-f30', 'bed',         [-3.00,  3.50], { length: 190, width: 120 },           'p21h-yatak2', 0,       'modern'),
    mkFurn('p21h-f31', 'wardrobe',    [-4.20,  4.40], { width: 140, depth: 50 },             'p21h-yatak2', 0,       'classic'),
    mkFurn('p21h-f32', 'desk',        [-1.70,  2.10], { length: 100, depth: 55 },            'p21h-yatak2', Math.PI/2, 'drawer'),
    mkFurn('p21h-f33', 'office-chair',[-2.20,  2.10], {},                                    'p21h-yatak2', Math.PI/2, 'ergonomic'),
    mkFurn('p21h-f34', 'ceilinglamp', [-3.00,  3.20], { diameter: 40 },                      'p21h-yatak2', 0,       'panel'),
    // Banyo
    mkFurn('p21h-f35', 'toilet',      [-1.00,  2.90], { depth: 65 },                         'p21h-banyo', 0,        'wall'),
    mkFurn('p21h-f36', 'sink',        [-0.95,  3.90], { width: 55 },                         'p21h-banyo', -Math.PI/2, 'square'),
    mkFurn('p21h-f37', 'bathtub',     [ 0.40,  4.50], { length: 165, width: 75 },            'p21h-banyo', 0,        'freestanding'),
    mkFurn('p21h-f38', 'bathroom-cabinet', [-0.95,  3.90], { width: 55, height: 70 },        'p21h-banyo', -Math.PI/2, 'single'),
    mkFurn('p21h-f39', 'washer',      [ 0.85,  2.90], {},                                    'p21h-banyo', 0),
  ],
}

export const PRESETS_2PLUS1: Preset[] = [
  { id: '2plus1-classic',  label: '2+1 Klasik',          icon: '🏢', description: 'Salon, ebeveyn + çocuk odası, mutfak ve banyo — klasik koridor üzerinden dağıtılan dikdörtgen plan.', data: p_2plus1_classic },
  { id: '2plus1-modern',   label: '2+1 Modern',          icon: '🏙', description: 'Geniş salonlu çağdaş plan — laminat zemin, pendant avize, çalışma köşeli çocuk odası.', data: p_2plus1_modern },
  { id: '2plus1-master',   label: '2+1 Ebeveyn Banyolu', icon: '🛁', description: 'Çift banyolu master suite — ebeveyn odasına özel duş+küvet ve lavabo bölgesi.', data: p_2plus1_master },
  { id: '2plus1-l',        label: '2+1 L Plan',          icon: '◣',  description: 'L şeklinde yerleşim — çocuk odası salonun önüne kıvrılır, banyo köşede freestanding küvetli.', data: p_2plus1_lplan },
  { id: '2plus1-terrace',  label: '2+1 Teraslı',         icon: '🌇', description: 'Salon arkasında geniş teras — bahçe mobilyaları, şemsiye ve saksılarla dış mekan.', data: p_2plus1_terrace },
  { id: '2plus1-corner',   label: '2+1 Köşe Daire',      icon: '◤',  description: 'Geniş köşe daire — büyük chaise L koltuk, küvetli banyo ve bol oturma alanı.', data: p_2plus1_corner },
  { id: '2plus1-balcony',  label: '2+1 İki Balkonlu',    icon: '🏗',  description: 'Hem salon hem ebeveyn yatak balkonu — iki ayrı dış mekan erişimi.', data: p_2plus1_balcony },
  { id: '2plus1-open',     label: '2+1 Açık Mutfak',     icon: '🍳', description: 'Salon ve mutfak tek hacim — bar taburelerıyle ada, yemek grubu ve geniş oturma.', data: p_2plus1_open },
]
