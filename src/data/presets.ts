import type { LayoutData, Room, FurnitureItem, Floor } from '../types'

/**
 * Hazır plan şablonları — kullanıcı boş başlamak zorunda kalmasın.
 *
 * KOORDİNAT SİSTEMİ:
 *   position = [x, z] → odanın DÜNYA MERKEZİ (metre)
 *   widthCm  → X eksenindeki genişlik (cm)
 *   lengthCm → Z eksenindeki derinlik (cm)
 *   Oda bbox: x ∈ [cx - widthCm/200 , cx + widthCm/200]
 *             z ∈ [cz - lengthCm/200 , cz + lengthCm/200]
 *
 * DUVAR YÖNLERİ (RoomMesh.tsx):
 *   'left'  → x = cx - widthCm/200  (negatif X kenarı)
 *   'right' → x = cx + widthCm/200  (pozitif X kenarı)
 *   'back'  → z = cz - lengthCm/200 (negatif Z kenarı)
 *   'front' → z = cz + lengthCm/200 (pozitif Z kenarı)
 *
 * ORTAK DUVARLAR: Birbirine bitişik odalar aynı düzlemde çift duvar render eder
 * (z-fighting). İkincil odadan ortak duvar removedWalls ile kaldırılır.
 *
 * MOBİLYA ROTASYONLARI (rotation=0 varsayılanları):
 *   sofa / lsofa : arka +Z, oturma -Z  → TV -Z'de ise rotation=Math.PI gerekir
 *   tvunit       : ekran -Z            → odanın içi +Z'de ise rotation=Math.PI gerekir
 *   bed          : baş -Z
 *   wardrobe     : kapılar +Z
 */

export interface Preset {
  id: string
  label: string
  description: string
  icon: string
  data: LayoutData
}

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

/**
 * Çok katlı preset'ler için yardımcılar — dışa verilir ki ayrı preset
 * dosyaları (presets-duplex.ts, presets-triplex.ts, ...) da kullanabilsin.
 */
export function mkFloor(id: string, label: string, order: number, baseY: number, ceilingHeight = 2.7): Floor {
  return { id, label, order, baseY, ceilingHeight }
}

/** Odaya kat ataması yapan küçük yardımcı. */
export function withFloor<T extends Room>(room: T, floorId: string): T {
  return { ...room, floorId }
}

/** FurnitureItem'a floorId atar. */
export function withFloorF(item: FurnitureItem, floorId: string): FurnitureItem {
  return { ...item, floorId }
}

// ═══════════════════════════════════════════════════════════════════
//  1. STÜDYO
//  Tek oda: 500×400  →  bbox x[-2.5,2.5]  z[-2.0,2.0]
// ═══════════════════════════════════════════════════════════════════
const studio: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p1-salon', 'salon', 500, 400, [0, 0], 0x4488ff),
  ],
  furniture: [
    // Sofa arka +Z → rotation=Math.PI: oturanlar -Z'ye (TV'ye) bakar
    mkFurn('p1-f1', 'sofa',     [-1.5,  0.8], { length: 220 },            'p1-salon', Math.PI,        'classic'),
    mkFurn('p1-f2', 'ctable',   [-1.5, -0.1], { diameter: 90 },           'p1-salon', 0,              'round'),
    // TVUnit ekranı rotation=Math.PI → +Z'ye bakar (kanepeye doğru)
    mkFurn('p1-f3', 'tvunit',   [-1.5, -1.6], { length: 180 },            'p1-salon', 0,        'classic'),
    mkFurn('p1-f4', 'bed',      [ 1.4, -1.2], { length: 200, width: 140 },'p1-salon', 0,              'classic'),
    mkFurn('p1-f5', 'wardrobe', [ 1.8,  1.0], { width: 140, depth: 55 },  'p1-salon', 0,              'classic'),
    mkFurn('p1-f6', 'rug',      [-1.5,  0.3], { length: 200, width: 140 },'p1-salon'),
    mkFurn('p1-f7', 'plant',    [ 2.1,  1.6], { diameter: 50 },           'p1-salon', 0,              'tall'),
  ],
}

// ═══════════════════════════════════════════════════════════════════
//  2. 1+1 DAİRE
//
//  SALON  430×480  center (1.50, 0.00)   bbox x[-0.65, 3.65]  z[-2.4, 2.4]
//  YATAK  300×340  center (-2.15,-0.70)  bbox x[-3.65,-0.65]  z[-2.4, 1.0]
//  MUTFAK 260×280  center (-1.95, 2.40)  bbox x[-3.25,-0.65]  z[ 1.0, 3.8]
//  BANYO  190×200  center ( 2.70, 3.40)  bbox x[ 1.75, 3.65]  z[ 2.4, 4.4]
//
//  Ortak duvarlar → removedWalls:
//    YATAK  'right'        (x=-0.65 = salon left)
//    MUTFAK 'right','back' (x=-0.65 = salon left; z=1.0 = yatak front)
//    BANYO  'back'         (z=2.4  = salon front)
// ═══════════════════════════════════════════════════════════════════
const apt1plus1: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p2-salon',  'salon',  430, 480, [ 1.50,  0.00], 0x4488ff),
    mkRoom('p2-yatak',  'yatak',  300, 340, [-2.15, -0.70], 0x44cc88, { removedWalls: ['right'] }),
    mkRoom('p2-mutfak', 'mutfak', 260, 280, [-1.95,  2.40], 0xff8844, { removedWalls: ['right', 'back'] }),
    mkRoom('p2-banyo',  'banyo',  190, 200, [ 2.70,  3.40], 0x44cccc, { removedWalls: ['back'] }),
  ],
  furniture: [
    // Salon
    // Sofa: rotation=Math.PI → oturanlar -Z'ye (TV'ye) bakar
    mkFurn('p2-f1',  'sofa',        [ 1.50,  1.00], { length: 220 },            'p2-salon', Math.PI,        'classic'),
    mkFurn('p2-f2',  'ctable',      [ 1.50,  0.00], { diameter: 90 },           'p2-salon', 0,              'round'),
    // TVUnit: rotation=Math.PI → ekran +Z'ye (kanepeye) bakar
    mkFurn('p2-f3',  'tvunit',      [ 1.50, -2.00], { length: 200 },            'p2-salon', 0,        'classic'),
    mkFurn('p2-f4',  'chair',       [ 3.10,  0.40], { diameter: 95 },           'p2-salon', -Math.PI / 4,   'berjer'),
    mkFurn('p2-f5',  'rug',         [ 1.50,  0.30], { length: 220, width: 160 },'p2-salon'),
    mkFurn('p2-f6',  'ceilinglamp', [ 1.50,  0.00], { diameter: 45 },           'p2-salon', 0,              'pendant'),
    // Yatak odası
    mkFurn('p2-f7',  'bed',         [-2.15, -0.50], { length: 200, width: 140 },'p2-yatak', 0,              'classic'),
    mkFurn('p2-f8',  'wardrobe',    [-3.20,  0.50], { width: 160, depth: 55 },  'p2-yatak', 0,              'classic'),
    mkFurn('p2-f9',  'ceilinglamp', [-2.15, -0.70], { diameter: 40 },           'p2-yatak', 0,              'panel'),
    // Mutfak — bbox x[-3.25,-0.65] z[1.0,3.8]
    mkFurn('p2-f10', 'counter',     [-2.50,  1.50], { length: 180, depth: 60 }, 'p2-mutfak', 0),
    mkFurn('p2-f11', 'fridge',      [-3.00,  3.40], { width: 65, depth: 60 },   'p2-mutfak', 0,             'classic'),
    // Banyo — bbox x[1.75,3.65] z[2.4,4.4]
    mkFurn('p2-f12', 'washer',      [ 2.10,  2.70], {},                         'p2-banyo',  0),
  ],
}

// ═══════════════════════════════════════════════════════════════════
//  3. 2+1 DAİRE — KOMPAKT
//
//  SALON   500×500  center ( 2.50, 0.00)  bbox x[ 0.00, 5.00]  z[-2.5, 2.5]
//  KORIDOR 120×500  center (-0.60, 0.00)  bbox x[-1.20, 0.00]  z[-2.5, 2.5]
//  YATAK1  340×380  center (-2.90,-0.60)  bbox x[-4.60,-1.20]  z[-2.5, 1.3]
//  COCUK   300×340  center (-2.70, 3.00)  bbox x[-4.20,-1.20]  z[ 1.3, 4.7]
//  BANYO   200×200  center ( 1.00, 3.50)  bbox x[ 0.00, 2.00]  z[ 2.5, 4.5]
//  MUTFAK  280×300  center ( 3.40, 4.00)  bbox x[ 2.00, 4.80]  z[ 2.5, 5.5]
//
//  Ortak duvarlar → removedWalls:
//    KORIDOR 'right'               (x=0.00  = salon left)
//    YATAK1  'right'               (x=-1.20 = koridor left)
//    COCUK   'right','back'        (x=-1.20 = koridor left; z=1.3 = yatak1 front)
//    BANYO   'back'                (z=2.5   = salon front)
//    MUTFAK  'back','left'         (z=2.5   = salon front; x=2.0 = banyo right)
// ═══════════════════════════════════════════════════════════════════
const apt2plus1_kompakt: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p3k-salon',   'salon',   500, 500, [ 2.50,  0.00], 0x4488ff),
    mkRoom('p3k-koridor', 'koridor', 120, 500, [-0.60,  0.00], 0xcc8844, { removedWalls: ['right'] }),
    mkRoom('p3k-yatak1',  'yatak',   340, 380, [-2.90, -0.60], 0x44cc88, { removedWalls: ['right'] }),
    mkRoom('p3k-cocuk',   'cocuk',   300, 340, [-2.70,  3.00], 0xff44cc, { removedWalls: ['right', 'back'] }),
    mkRoom('p3k-banyo',   'banyo',   200, 200, [ 1.00,  3.50], 0x44cccc, { removedWalls: ['back'] }),
    mkRoom('p3k-mutfak',  'mutfak',  280, 300, [ 3.40,  4.00], 0xff8844, { removedWalls: ['back', 'left'] }),
  ],
  furniture: [
    // Salon — bbox x[0,5] z[-2.5,2.5]
    // lSofa: rotation=Math.PI → oturanlar -Z'ye (TV'ye) bakar
    mkFurn('p3k-f1',  'lsofa',      [ 2.50,  0.90], { length: 280, width: 200, depth: 95 },'p3k-salon', Math.PI,        'classic'),
    mkFurn('p3k-f2',  'ctable',     [ 2.50, -0.30], { diameter: 100 },                     'p3k-salon', 0,              'square'),
    // TVUnit: rotation=Math.PI → ekran +Z'ye (kanepeye) bakar
    mkFurn('p3k-f3',  'tvunit',     [ 2.50, -2.10], { length: 200 },                       'p3k-salon', 0,        'classic'),
    mkFurn('p3k-f4',  'rug',        [ 2.50,  0.30], { length: 260, width: 190 },           'p3k-salon'),
    mkFurn('p3k-f5',  'ceilinglamp',[ 2.50,  0.00], { diameter: 55 },                     'p3k-salon', 0,              'chandelier'),
    mkFurn('p3k-f6',  'plant',      [ 4.60,  2.10], { diameter: 55 },                     'p3k-salon', 0,              'tall'),
    // Yatak1 (ebeveyn) — bbox x[-4.6,-1.2] z[-2.5,1.3]
    mkFurn('p3k-f7',  'bed',        [-2.90, -0.30], { length: 200, width: 160 },           'p3k-yatak1', 0,             'classic'),
    mkFurn('p3k-f8',  'wardrobe',   [-4.20,  0.80], { width: 180, depth: 60 },             'p3k-yatak1', 0,             'sliding'),
    mkFurn('p3k-f9',  'ceilinglamp',[-2.90, -0.60], { diameter: 45 },                     'p3k-yatak1', 0,             'panel'),
    // Çocuk odası — bbox x[-4.2,-1.2] z[1.3,4.7]
    mkFurn('p3k-f10', 'bed',        [-2.70,  3.30], { length: 190, width: 110 },           'p3k-cocuk', 0,              'modern'),
    mkFurn('p3k-f11', 'wardrobe',   [-3.80,  4.30], { width: 140, depth: 55 },             'p3k-cocuk', 0,              'classic'),
    mkFurn('p3k-f12', 'shelf',      [-4.00,  1.80], { width: 80, height: 160 },            'p3k-cocuk', 0,              'cube'),
    // Mutfak — bbox x[2.0,4.8] z[2.5,5.5]
    mkFurn('p3k-f13', 'counter',    [ 3.00,  2.90], { length: 200, depth: 60 },            'p3k-mutfak', 0),
    mkFurn('p3k-f14', 'fridge',     [ 4.50,  2.90], { width: 70, depth: 65 },              'p3k-mutfak', 0,             'classic'),
    mkFurn('p3k-f15', 'dtable',     [ 3.40,  4.70], { length: 130, width: 80 },            'p3k-mutfak', 0,             'classic'),
    mkFurn('p3k-f16', 'dchair',     [ 2.80,  4.70], {},                                    'p3k-mutfak', Math.PI / 2,   'classic'),
    mkFurn('p3k-f17', 'dchair',     [ 4.00,  4.70], {},                                    'p3k-mutfak', -Math.PI / 2,  'classic'),
    // Banyo — bbox x[0,2.0] z[2.5,4.5]
    mkFurn('p3k-f18', 'washer',     [ 0.40,  2.80], {},                                    'p3k-banyo',  0),
  ],
}

// ═══════════════════════════════════════════════════════════════════
//  4. 2+1 DAİRE — GENİŞ
//
//  SALON   540×560  center ( 2.70, 0.00)  bbox x[ 0.00, 5.40]  z[-2.8, 2.8]
//  KORIDOR 130×560  center (-0.65, 0.00)  bbox x[-1.30, 0.00]  z[-2.8, 2.8]
//  YATAK1  380×400  center (-3.20,-0.80)  bbox x[-5.10,-1.30]  z[-2.8, 1.2]
//  YATAK2  330×360  center (-2.95, 3.00)  bbox x[-4.60,-1.30]  z[ 1.2, 4.8]
//  BANYO   220×240  center ( 1.10, 4.00)  bbox x[ 0.00, 2.20]  z[ 2.8, 5.2]
//  MUTFAK  320×300  center ( 3.80, 4.30)  bbox x[ 2.20, 5.40]  z[ 2.8, 5.8]
//
//  Ortak duvarlar → removedWalls:
//    KORIDOR 'right'               (x=0.00  = salon left)
//    YATAK1  'right'               (x=-1.30 = koridor left)
//    YATAK2  'right','back'        (x=-1.30 = koridor left; z=1.2 = yatak1 front)
//    BANYO   'back'                (z=2.8   = salon front)
//    MUTFAK  'back','left'         (z=2.8   = salon front; x=2.2 = banyo right)
// ═══════════════════════════════════════════════════════════════════
const apt2plus1_genis: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p3g-salon',   'salon',   540, 560, [ 2.70,  0.00], 0x4488ff),
    mkRoom('p3g-koridor', 'koridor', 130, 560, [-0.65,  0.00], 0xcc8844, { removedWalls: ['right'] }),
    mkRoom('p3g-yatak1',  'yatak',   380, 400, [-3.20, -0.80], 0x44cc88, { removedWalls: ['right'] }),
    mkRoom('p3g-yatak2',  'yatak',   330, 360, [-2.95,  3.00], 0x6688ff, { removedWalls: ['right', 'back'] }),
    mkRoom('p3g-banyo',   'banyo',   220, 240, [ 1.10,  4.00], 0x44cccc, { removedWalls: ['back'] }),
    mkRoom('p3g-mutfak',  'mutfak',  320, 300, [ 3.80,  4.30], 0xff8844, { removedWalls: ['back', 'left'] }),
  ],
  furniture: [
    // Salon — bbox x[0,5.4] z[-2.8,2.8]
    // lSofa: rotation=Math.PI → oturanlar -Z'ye (TV'ye) bakar
    mkFurn('p3g-f1',  'lsofa',      [ 2.70,  1.00], { length: 310, width: 230, depth: 100 },'p3g-salon', Math.PI,       'modern'),
    mkFurn('p3g-f2',  'ctable',     [ 2.70, -0.30], { diameter: 110 },                      'p3g-salon', 0,             'marble'),
    // TVUnit: rotation=Math.PI → ekran +Z'ye (kanepeye) bakar
    mkFurn('p3g-f3',  'tvunit',     [ 2.70, -2.30], { length: 220 },                        'p3g-salon', 0,       'floating'),
    mkFurn('p3g-f4',  'chair',      [ 4.90,  0.60], { diameter: 100 },                      'p3g-salon', -Math.PI/4,    'berjer'),
    mkFurn('p3g-f5',  'rug',        [ 2.70,  0.40], { length: 300, width: 210 },            'p3g-salon'),
    mkFurn('p3g-f6',  'ceilinglamp',[ 2.70,  0.00], { diameter: 60 },                      'p3g-salon', 0,             'chandelier'),
    mkFurn('p3g-f7',  'floorlamp',  [ 0.40, -2.50], {},                                     'p3g-salon', 0,             'classic'),
    mkFurn('p3g-f8',  'plant',      [ 5.10,  2.50], { diameter: 60 },                      'p3g-salon', 0,             'tall'),
    // Yatak1 (ebeveyn) — bbox x[-5.1,-1.3] z[-2.8,1.2]
    mkFurn('p3g-f9',  'bed',        [-3.20, -0.40], { length: 200, width: 180 },            'p3g-yatak1', 0,            'tufted'),
    mkFurn('p3g-f10', 'wardrobe',   [-4.70,  0.80], { width: 220, depth: 60 },              'p3g-yatak1', 0,            'sliding'),
    mkFurn('p3g-f11', 'ceilinglamp',[-3.20, -0.80], { diameter: 50 },                      'p3g-yatak1', 0,            'pendant'),
    mkFurn('p3g-f12', 'floorlamp',  [-1.70, -2.20], {},                                     'p3g-yatak1', 0,            'classic'),
    // Yatak2 (misafir) — bbox x[-4.6,-1.3] z[1.2,4.8]
    mkFurn('p3g-f13', 'bed',        [-2.95,  3.40], { length: 200, width: 140 },            'p3g-yatak2', 0,            'classic'),
    mkFurn('p3g-f14', 'wardrobe',   [-4.20,  4.40], { width: 160, depth: 55 },              'p3g-yatak2', 0,            'classic'),
    mkFurn('p3g-f15', 'shelf',      [-1.70,  1.70], { width: 80, height: 160 },             'p3g-yatak2', 0,            'classic'),
    mkFurn('p3g-f16', 'ceilinglamp',[-2.95,  3.00], { diameter: 45 },                      'p3g-yatak2', 0,            'panel'),
    // Mutfak — bbox x[2.2,5.4] z[2.8,5.8]
    mkFurn('p3g-f17', 'counter',    [ 3.20,  3.20], { length: 240, depth: 60 },             'p3g-mutfak', 0),
    mkFurn('p3g-f18', 'fridge',     [ 5.10,  3.20], { width: 75, depth: 68 },               'p3g-mutfak', 0,            'classic'),
    mkFurn('p3g-f19', 'dtable',     [ 3.80,  5.10], { length: 160, width: 90 },             'p3g-mutfak', 0,            'modern'),
    mkFurn('p3g-f20', 'dchair',     [ 3.00,  5.10], {},                                     'p3g-mutfak', Math.PI/2,    'upholstered'),
    mkFurn('p3g-f21', 'dchair',     [ 4.60,  5.10], {},                                     'p3g-mutfak', -Math.PI/2,   'upholstered'),
    mkFurn('p3g-f22', 'dchair',     [ 3.80,  4.50], {},                                     'p3g-mutfak', 0,            'upholstered'),
    // Banyo — bbox x[0,2.2] z[2.8,5.2]
    mkFurn('p3g-f23', 'washer',     [ 0.40,  3.10], {},                                     'p3g-banyo',  0),
  ],
}

// ═══════════════════════════════════════════════════════════════════
//  5. 3+1 DAİRE — STANDART
//
//  SALON   500×540  center ( 2.50, 0.00)  bbox x[ 0.00, 5.00]  z[-2.7, 2.7]
//  KORIDOR 140×540  center (-0.70, 0.00)  bbox x[-1.40, 0.00]  z[-2.7, 2.7]
//  YATAK1  360×380  center (-3.20,-0.80)  bbox x[-5.00,-1.40]  z[-2.7, 1.1]
//  YATAK2  320×340  center (-3.00, 2.80)  bbox x[-4.60,-1.40]  z[ 1.1, 4.5]
//  BANYO   200×220  center (-0.40, 3.80)  bbox x[-1.40, 0.60]  z[ 2.7, 4.9]
//  MUTFAK  260×260  center ( 1.90, 4.00)  bbox x[ 0.60, 3.20]  z[ 2.7, 5.3]
//  COCUK   300×300  center ( 4.70, 4.20)  bbox x[ 3.20, 6.20]  z[ 2.7, 5.7]
//
//  Ortak duvarlar → removedWalls:
//    KORIDOR 'right'               (x=0.00  = salon left)
//    YATAK1  'right'               (x=-1.40 = koridor left)
//    YATAK2  'right','back'        (x=-1.40 = koridor left; z=1.1 = yatak1 front)
//    BANYO   'back'                (z=2.7   = salon/koridor front)
//    MUTFAK  'back','left'         (z=2.7   = salon front; x=0.6 = banyo right)
//    COCUK   'back','left'         (z=2.7   = salon front; x=3.2 = mutfak right)
// ═══════════════════════════════════════════════════════════════════
const apt3plus1_standart: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p4s-salon',   'salon',   500, 540, [ 2.50,  0.00], 0x4488ff),
    mkRoom('p4s-koridor', 'koridor', 140, 540, [-0.70,  0.00], 0xcc8844, { removedWalls: ['right'] }),
    mkRoom('p4s-yatak1',  'yatak',   360, 380, [-3.20, -0.80], 0x44cc88, { removedWalls: ['right'] }),
    mkRoom('p4s-yatak2',  'yatak',   320, 340, [-3.00,  2.80], 0x6688ff, { removedWalls: ['right', 'back'] }),
    mkRoom('p4s-banyo',   'banyo',   200, 220, [-0.40,  3.80], 0x44cccc, { removedWalls: ['back'] }),
    mkRoom('p4s-mutfak',  'mutfak',  260, 260, [ 1.90,  4.00], 0xff8844, { removedWalls: ['back', 'left'] }),
    mkRoom('p4s-cocuk',   'cocuk',   300, 300, [ 4.70,  4.20], 0xff44cc, { removedWalls: ['back', 'left'] }),
  ],
  furniture: [
    // Salon — bbox x[0,5] z[-2.7,2.7]
    // lSofa: rotation=Math.PI → oturanlar -Z'ye (TV'ye) bakar
    mkFurn('p4s-f1',  'lsofa',      [ 2.50,  0.90], { length: 300, width: 220, depth: 95 },'p4s-salon', Math.PI,        'chaise'),
    mkFurn('p4s-f2',  'ctable',     [ 2.50, -0.30], { diameter: 110 },                     'p4s-salon', 0,              'square'),
    // TVUnit: rotation=Math.PI → ekran +Z'ye (kanepeye) bakar
    mkFurn('p4s-f3',  'tvunit',     [ 2.50, -2.20], { length: 220 },                       'p4s-salon', 0,        'floating'),
    mkFurn('p4s-f4',  'chair',      [ 4.50,  0.40], { diameter: 100 },                     'p4s-salon', -Math.PI/4,     'accent'),
    mkFurn('p4s-f5',  'rug',        [ 2.50,  0.30], { length: 280, width: 200 },           'p4s-salon'),
    mkFurn('p4s-f6',  'ceilinglamp',[ 2.50,  0.00], { diameter: 60 },                     'p4s-salon', 0,              'chandelier'),
    mkFurn('p4s-f7',  'plant',      [ 4.60,  2.30], { diameter: 60 },                     'p4s-salon', 0,              'tall'),
    // Yatak1 (ebeveyn) — bbox x[-5.0,-1.4] z[-2.7,1.1]
    mkFurn('p4s-f8',  'bed',        [-3.20, -0.40], { length: 200, width: 180 },           'p4s-yatak1', 0,             'tufted'),
    mkFurn('p4s-f9',  'wardrobe',   [-4.50,  0.60], { width: 200, depth: 60 },             'p4s-yatak1', Math.PI,             'sliding'),
    mkFurn('p4s-f10', 'ceilinglamp',[-3.20, -0.80], { diameter: 50 },                     'p4s-yatak1', 0,             'pendant'),
    mkFurn('p4s-f11', 'floorlamp',  [-1.80, -2.00], {},                                    'p4s-yatak1', 0,             'classic'),
    // Yatak2 (misafir) — bbox x[-4.6,-1.4] z[1.1,4.5]
    mkFurn('p4s-f12', 'bed',        [-3.00,  3.20], { length: 200, width: 140 },           'p4s-yatak2', 0,             'classic'),
    mkFurn('p4s-f13', 'wardrobe',   [-4.20,  1.70], { width: 180, depth: 55 },             'p4s-yatak2', 0,             'classic'),
    mkFurn('p4s-f14', 'ceilinglamp',[-3.00,  2.80], { diameter: 45 },                     'p4s-yatak2', 0,             'panel'),
    // Banyo — bbox x[-1.4,0.6] z[2.7,4.9]
    mkFurn('p4s-f15', 'washer',     [-1.00,  3.00], {},                                    'p4s-banyo',  0),
    // Mutfak — bbox x[0.6,3.2] z[2.7,5.3]
    mkFurn('p4s-f16', 'counter',    [ 1.20,  3.10], { length: 200, depth: 60 },            'p4s-mutfak', 0),
    mkFurn('p4s-f17', 'fridge',     [ 2.90,  3.10], { width: 65, depth: 65 },              'p4s-mutfak', 0,             'classic'),
    mkFurn('p4s-f18', 'dtable',     [ 1.90,  4.80], { length: 130, width: 75 },            'p4s-mutfak', 0,             'classic'),
    mkFurn('p4s-f19', 'dchair',     [ 1.30,  4.80], {},                                    'p4s-mutfak', Math.PI/2,     'classic'),
    mkFurn('p4s-f20', 'dchair',     [ 2.50,  4.80], {},                                    'p4s-mutfak', -Math.PI/2,    'classic'),
    // Çocuk odası — bbox x[3.2,6.2] z[2.7,5.7]
    mkFurn('p4s-f21', 'bed',        [ 4.70,  4.50], { length: 190, width: 110 },           'p4s-cocuk', 0,              'modern'),
    mkFurn('p4s-f22', 'wardrobe',   [ 5.80,  3.20], { width: 140, depth: 55 },             'p4s-cocuk', 0,              'classic'),
    mkFurn('p4s-f23', 'shelf',      [ 3.50,  5.20], { width: 80, height: 160 },            'p4s-cocuk', 0,              'cube'),
  ],
}

// ═══════════════════════════════════════════════════════════════════
//  6. 3+1 DAİRE — GENİŞ
//
//  SALON   560×600  center ( 2.80, 0.00)  bbox x[ 0.00, 5.60]  z[-3.0, 3.0]
//  KORIDOR 150×600  center (-0.75, 0.00)  bbox x[-1.50, 0.00]  z[-3.0, 3.0]
//  YATAK1  400×420  center (-3.50,-0.90)  bbox x[-5.50,-1.50]  z[-3.0, 1.2]
//  YATAK2  340×380  center (-3.20, 3.10)  bbox x[-5.00,-1.50]  z[ 1.2, 5.0]
//  BANYO   220×240  center (-0.40, 4.20)  bbox x[-1.50, 0.70]  z[ 3.0, 5.4]
//  MUTFAK  320×280  center ( 2.30, 4.40)  bbox x[ 0.70, 3.90]  z[ 3.0, 5.8]
//  COCUK   340×340  center ( 5.60, 4.70)  bbox x[ 3.90, 7.30]  z[ 3.0, 6.4]
//
//  Ortak duvarlar → removedWalls:
//    KORIDOR 'right'               (x=0.00  = salon left)
//    YATAK1  'right'               (x=-1.50 = koridor left)
//    YATAK2  'right','back'        (x=-1.50 = koridor left; z=1.2 = yatak1 front)
//    BANYO   'back'                (z=3.0   = salon/koridor front)
//    MUTFAK  'back','left'         (z=3.0   = salon front; x=0.7 = banyo right)
//    COCUK   'back','left'         (z=3.0   = salon front; x=3.9 = mutfak right)
// ═══════════════════════════════════════════════════════════════════
const apt3plus1_genis: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p4g-salon',   'salon',   560, 600, [ 2.80,  0.00], 0x4488ff),
    mkRoom('p4g-koridor', 'koridor', 150, 600, [-0.75,  0.00], 0xcc8844, { removedWalls: ['right'] }),
    mkRoom('p4g-yatak1',  'yatak',   400, 420, [-3.50, -0.90], 0x44cc88, { removedWalls: ['right'] }),
    mkRoom('p4g-yatak2',  'yatak',   340, 380, [-3.20,  3.10], 0x6688ff, { removedWalls: ['right', 'back'] }),
    mkRoom('p4g-banyo',   'banyo',   220, 240, [-0.40,  4.20], 0x44cccc, { removedWalls: ['back'] }),
    mkRoom('p4g-mutfak',  'mutfak',  320, 280, [ 2.30,  4.40], 0xff8844, { removedWalls: ['back', 'left'] }),
    mkRoom('p4g-cocuk',   'cocuk',   340, 340, [ 5.60,  4.70], 0xff44cc, { removedWalls: ['back', 'left'] }),
  ],
  furniture: [
    // Salon — bbox x[0,5.6] z[-3.0,3.0]
    // lSofa: rotation=Math.PI → oturanlar -Z'ye (TV'ye) bakar
    mkFurn('p4g-f1',  'lsofa',      [ 2.80,  1.00], { length: 340, width: 240, depth: 100 },'p4g-salon', Math.PI,       'chaise'),
    mkFurn('p4g-f2',  'ctable',     [ 2.80, -0.40], { diameter: 120 },                      'p4g-salon', 0,             'marble'),
    // TVUnit: rotation=Math.PI → ekran +Z'ye (kanepeye) bakar
    mkFurn('p4g-f3',  'tvunit',     [ 2.80, -2.50], { length: 240 },                        'p4g-salon', 0,       'floating'),
    mkFurn('p4g-f4',  'chair',      [ 5.10,  0.60], { diameter: 100 },                      'p4g-salon', -Math.PI/4,    'accent'),
    mkFurn('p4g-f5',  'rug',        [ 2.80,  0.30], { length: 320, width: 230 },            'p4g-salon'),
    mkFurn('p4g-f6',  'ceilinglamp',[ 2.80,  0.00], { diameter: 65 },                      'p4g-salon', 0,             'chandelier'),
    mkFurn('p4g-f7',  'plant',      [ 5.30,  2.70], { diameter: 65 },                      'p4g-salon', 0,             'tall'),
    mkFurn('p4g-f8',  'floorlamp',  [ 0.40, -2.70], {},                                     'p4g-salon', 0,             'classic'),
    // Yatak1 (ebeveyn) — bbox x[-5.5,-1.5] z[-3.0,1.2]
    mkFurn('p4g-f9',  'bed',        [-3.50, -0.50], { length: 210, width: 180 },            'p4g-yatak1', 0,            'tufted'),
    mkFurn('p4g-f10', 'wardrobe',   [-5.00,  0.60], { width: 240, depth: 60 },              'p4g-yatak1', 0,            'sliding'),
    mkFurn('p4g-f11', 'ceilinglamp',[-3.50, -0.90], { diameter: 55 },                      'p4g-yatak1', 0,            'pendant'),
    mkFurn('p4g-f12', 'floorlamp',  [-1.90, -2.50], {},                                     'p4g-yatak1', 0,            'classic'),
    // Yatak2 (misafir) — bbox x[-5.0,-1.5] z[1.2,5.0]
    mkFurn('p4g-f13', 'bed',        [-3.20,  3.50], { length: 200, width: 160 },            'p4g-yatak2', 0,            'classic'),
    mkFurn('p4g-f14', 'wardrobe',   [-4.60,  1.80], { width: 200, depth: 55 },              'p4g-yatak2', 0,            'classic'),
    mkFurn('p4g-f15', 'ceilinglamp',[-3.20,  3.10], { diameter: 50 },                      'p4g-yatak2', 0,            'panel'),
    // Banyo — bbox x[-1.5,0.7] z[3.0,5.4]
    mkFurn('p4g-f16', 'washer',     [-1.10,  3.40], {},                                     'p4g-banyo',  0),
    // Mutfak — bbox x[0.7,3.9] z[3.0,5.8]
    mkFurn('p4g-f17', 'counter',    [ 1.40,  3.30], { length: 240, depth: 60 },             'p4g-mutfak', 0),
    mkFurn('p4g-f18', 'fridge',     [ 3.60,  3.30], { width: 75, depth: 70 },               'p4g-mutfak', 0,            'french'),
    mkFurn('p4g-f19', 'dtable',     [ 2.30,  5.10], { length: 160, width: 90 },             'p4g-mutfak', 0,            'modern'),
    mkFurn('p4g-f20', 'dchair',     [ 1.50,  5.10], {},                                     'p4g-mutfak', Math.PI/2,    'upholstered'),
    mkFurn('p4g-f21', 'dchair',     [ 3.10,  5.10], {},                                     'p4g-mutfak', -Math.PI/2,   'upholstered'),
    mkFurn('p4g-f22', 'dchair',     [ 2.30,  4.50], {},                                     'p4g-mutfak', 0,            'upholstered'),
    mkFurn('p4g-f23', 'dchair',     [ 2.30,  5.70], {},                                     'p4g-mutfak', Math.PI,      'upholstered'),
    // Çocuk odası — bbox x[3.9,7.3] z[3.0,6.4]
    mkFurn('p4g-f24', 'bed',        [ 5.60,  5.00], { length: 190, width: 110 },            'p4g-cocuk', 0,             'modern'),
    mkFurn('p4g-f25', 'wardrobe',   [ 6.90,  3.40], { width: 140, depth: 55 },              'p4g-cocuk', 0,             'classic'),
    mkFurn('p4g-f26', 'shelf',      [ 4.20,  6.00], { width: 100, height: 180 },            'p4g-cocuk', 0,             'cube'),
  ],
}

// ═══════════════════════════════════════════════════════════════════
//  7. GENİŞ AÇIK PLAN (villa / loft)
//
//  SALON  700×600  center (0.00, 0.00)  bbox x[-3.5, 3.5]  z[-3.0, 3.0]
//  YATAK  440×460  center (5.70, 0.00)  bbox x[ 3.5, 7.9]  z[-2.3, 2.3]
//  BANYO  260×280  center (4.80, 3.70)  bbox x[ 3.5, 6.1]  z[ 2.3, 5.1]
//
//  Ortak duvarlar → removedWalls:
//    YATAK 'left'         (x=3.5  = salon right)
//    BANYO 'back','left'  (z=2.3  = yatak front; x=3.5 = salon right / yatak left)
// ═══════════════════════════════════════════════════════════════════
const openPlan: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p5-salon', 'salon', 700, 600, [ 0.00, 0.00], 0x4488ff),
    mkRoom('p5-yatak', 'yatak', 440, 460, [ 5.70, 0.00], 0x44cc88, { removedWalls: ['left'] }),
    mkRoom('p5-banyo', 'banyo', 260, 280, [ 4.80, 3.70], 0x44cccc, { removedWalls: ['back', 'left'] }),
  ],
  furniture: [
    // Oturma alanı — bbox x[-3.5,3.5] z[-3.0,3.0]
    // lSofa: rotation=Math.PI → oturanlar -Z'ye (TV'ye) bakar
    mkFurn('p5-f1',  'lsofa',    [-0.80,  0.80], { length: 340, width: 240, depth: 100 },'p5-salon', Math.PI,        'modern'),
    mkFurn('p5-f2',  'ctable',   [-0.80, -0.40], { diameter: 120 },                      'p5-salon', 0,              'marble'),
    // TVUnit: rotation=Math.PI → ekran +Z'ye (kanepeye) bakar
    mkFurn('p5-f3',  'tvunit',   [-0.80, -2.50], { length: 260 },                        'p5-salon', 0,        'floating'),
    mkFurn('p5-f4',  'rug',      [-0.80,  0.20], { length: 340, width: 240 },            'p5-salon'),
    mkFurn('p5-f5',  'ceilinglamp',[-0.80, 0.00],{ diameter: 70 },                      'p5-salon', 0,              'chandelier'),
    mkFurn('p5-f6',  'plant',    [ 3.10,  2.60], { diameter: 70 },                      'p5-salon', 0,              'tall'),
    // Yemek alanı (salon içinde)
    mkFurn('p5-f7',  'dtable',   [ 2.20, -0.50], { length: 200, width: 95 },            'p5-salon', 0,              'modern'),
    mkFurn('p5-f8',  'dchair',   [ 1.30, -0.50], {},                                     'p5-salon', Math.PI/2,      'upholstered'),
    mkFurn('p5-f9',  'dchair',   [ 3.10, -0.50], {},                                     'p5-salon', -Math.PI/2,     'upholstered'),
    mkFurn('p5-f10', 'dchair',   [ 2.20,  0.10], {},                                     'p5-salon', 0,              'upholstered'),
    mkFurn('p5-f11', 'dchair',   [ 2.20, -1.10], {},                                     'p5-salon', Math.PI,        'upholstered'),
    // Açık mutfak (salon içinde, güney duvarı)
    mkFurn('p5-f12', 'counter',  [ 2.50, -2.70], { length: 280, depth: 65 },            'p5-salon', 0),
    mkFurn('p5-f13', 'fridge',   [ 3.20, -1.80], { width: 90, depth: 75 },              'p5-salon', 0,              'sidebyside'),
    mkFurn('p5-f14', 'floorlamp',[-3.20,  2.50], {},                                     'p5-salon', 0,              'classic'),
    // Yatak odası — bbox x[3.5,7.9] z[-2.3,2.3]
    mkFurn('p5-f15', 'bed',      [ 5.70,  0.30], { length: 210, width: 190 },           'p5-yatak', 0,              'tufted'),
    mkFurn('p5-f16', 'wardrobe', [ 7.20, -1.50], { width: 240, depth: 60 },             'p5-yatak', 0,              'sliding'),
    mkFurn('p5-f17', 'ceilinglamp',[ 5.70, 0.00],{ diameter: 55 },                     'p5-yatak', 0,              'pendant'),
    mkFurn('p5-f18', 'floorlamp',[ 3.90, -1.80], {},                                    'p5-yatak', 0,              'classic'),
    // Banyo — bbox x[3.5,6.1] z[2.3,5.1]
    mkFurn('p5-f19', 'washer',   [ 4.00,  2.60], {},                                    'p5-banyo',  0),
  ],
}

// ═══════════════════════════════════════════════════════════════════
//  STÜDYO VARYANTLARI (4)
// ═══════════════════════════════════════════════════════════════════

// Stüdyo Minimal — 380×320
const studioMinimal: LayoutData = {
  version: VERSION,
  rooms: [ mkRoom('p7-salon', 'salon', 380, 320, [0, 0], 0x4488ff) ],
  furniture: [
    mkFurn('p7-f1', 'sofa',    [-0.8,  0.6], { length: 180 },             'p7-salon', Math.PI, 'minimal'),
    mkFurn('p7-f2', 'ctable',  [-0.8, -0.2], { diameter: 70 },            'p7-salon', 0,       'square'),
    mkFurn('p7-f3', 'tvunit',  [-0.8, -1.3], { length: 140 },             'p7-salon', 0, 'floating'),
    mkFurn('p7-f4', 'bed',     [ 1.1, -0.9], { length: 190, width: 120 }, 'p7-salon', 0,       'modern'),
    mkFurn('p7-f5', 'wardrobe',[ 1.4,  0.9], { width: 100, depth: 50 },   'p7-salon', 0,       'sliding'),
    mkFurn('p7-f6', 'rug',     [-0.8,  0.2], { length: 160, width: 120 }, 'p7-salon'),
  ],
}

// Stüdyo Dolgun — 520×440
const studioFull: LayoutData = {
  version: VERSION,
  rooms: [ mkRoom('p8-salon', 'salon', 520, 440, [0, 0], 0x4488ff) ],
  furniture: [
    mkFurn('p8-f1',  'sofa',        [-1.6,  1.0], { length: 240 },             'p8-salon', Math.PI, 'classic'),
    mkFurn('p8-f2',  'ctable',      [-1.6, -0.1], { diameter: 100 },           'p8-salon', 0,       'round'),
    mkFurn('p8-f3',  'tvunit',      [-1.6, -1.8], { length: 200 },             'p8-salon', 0, 'classic'),
    mkFurn('p8-f4',  'chair',       [-0.1,  1.5], { diameter: 90 },            'p8-salon', -Math.PI/2, 'berjer'),
    mkFurn('p8-f5',  'bed',         [ 1.6, -1.4], { length: 200, width: 140 }, 'p8-salon', 0,       'classic'),
    mkFurn('p8-f6',  'wardrobe',    [ 2.1,  0.5], { width: 160, depth: 55 },   'p8-salon', 0,       'sliding'),
    mkFurn('p8-f7',  'shelf',       [ 1.3,  1.9], { width: 100, height: 180 }, 'p8-salon', Math.PI,       'cube'),
    mkFurn('p8-f8',  'rug',         [-1.6,  0.4], { length: 220, width: 160 }, 'p8-salon'),
    mkFurn('p8-f9',  'plant',       [ 2.3,  1.9], { diameter: 50 },            'p8-salon', 0,       'tall'),
    mkFurn('p8-f10', 'ceilinglamp', [-1.6,  0.0], { diameter: 55 },            'p8-salon', 0,       'pendant'),
  ],
}

// Stüdyo Balkonlu — 500×420 salon + 500×140 balkon (front)
// SALON  bbox x[-2.5,2.5] z[-2.1,2.1];  BALKON center(0,2.8) bbox x[-2.5,2.5] z[2.1,3.5]
const studioBalkon: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p9-salon',  'salon',  500, 420, [0.00, 0.00], 0x4488ff),
    mkRoom('p9-balkon', 'salon',  500, 140, [0.00, 2.80], 0x44cccc, { removedWalls: ['back'], floorType: 'fayans' }),
  ],
  furniture: [
    mkFurn('p9-f1', 'sofa',    [-1.4,  0.8], { length: 220 },             'p9-salon', Math.PI, 'modern'),
    mkFurn('p9-f2', 'ctable',  [-1.4, -0.2], { diameter: 90 },            'p9-salon', 0,       'round'),
    mkFurn('p9-f3', 'tvunit',  [-1.4, -1.7], { length: 180 },             'p9-salon', 0, 'floating'),
    mkFurn('p9-f4', 'bed',     [ 1.5, -1.2], { length: 200, width: 140 }, 'p9-salon', 0,       'modern'),
    mkFurn('p9-f5', 'wardrobe',[ 1.9,  1.0], { width: 140, depth: 55 },   'p9-salon', 0,       'sliding'),
    mkFurn('p9-f6', 'rug',     [-1.4,  0.2], { length: 200, width: 140 }, 'p9-salon'),
    mkFurn('p9-f7', 'chair',   [ 1.2,  2.8], { diameter: 85 },            'p9-balkon', 0,      'accent'),
    mkFurn('p9-f8', 'plant',   [-2.0,  2.8], { diameter: 55 },            'p9-balkon', 0,      'tall'),
  ],
}

// Loft Stüdyo — 600×500, açık endüstriyel
const studioLoft: LayoutData = {
  version: VERSION,
  rooms: [ mkRoom('p10-salon', 'salon', 600, 500, [0, 0], 0x4488ff, { wallColor: '#d0d0cc', floorType: 'beton' }) ],
  furniture: [
    mkFurn('p10-f1',  'lsofa',       [-1.8,  1.1], { length: 300, width: 210, depth: 95 }, 'p10-salon', Math.PI, 'modern'),
    mkFurn('p10-f2',  'ctable',      [-1.8, -0.3], { diameter: 110 },                      'p10-salon', 0,       'marble'),
    mkFurn('p10-f3',  'tvunit',      [-1.8, -2.1], { length: 240 },                        'p10-salon', 0, 'floating'),
    mkFurn('p10-f4',  'bed',         [ 2.0, -1.6], { length: 210, width: 160 },            'p10-salon', 0,       'modern'),
    mkFurn('p10-f5',  'wardrobe',    [ 2.5,  0.8], { width: 200, depth: 60 },              'p10-salon', 0,       'sliding'),
    mkFurn('p10-f6',  'dtable',      [ 1.2,  1.8], { length: 140, width: 80 },             'p10-salon', 0,       'modern'),
    mkFurn('p10-f7',  'dchair',      [ 0.5,  1.8], {},                                     'p10-salon', Math.PI/2,  'scandi'),
    mkFurn('p10-f8',  'dchair',      [ 1.9,  1.8], {},                                     'p10-salon', -Math.PI/2, 'scandi'),
    mkFurn('p10-f9',  'counter',     [-2.2,  2.2], { length: 220, depth: 60 },             'p10-salon', Math.PI),
    mkFurn('p10-f10', 'fridge',      [-0.6,  2.3], { width: 70, depth: 65 },               'p10-salon', Math.PI,       'classic'),
    mkFurn('p10-f11', 'rug',         [-1.8,  0.3], { length: 280, width: 200 },            'p10-salon'),
    mkFurn('p10-f12', 'ceilinglamp', [-1.8,  0.0], { diameter: 60 },                       'p10-salon', 0,       'pendant'),
    mkFurn('p10-f13', 'plant',       [ 2.6,  2.1], { diameter: 60 },                       'p10-salon', 0,       'tall'),
  ],
}

// ═══════════════════════════════════════════════════════════════════
//  1+1 VARYANTLARI (6) — p11..p16
// ═══════════════════════════════════════════════════════════════════

// 1+1 Klasik
const apt1p1Klasik: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p11-salon',  'salon',  420, 460, [ 1.50, 0.00], 0x4488ff),
    mkRoom('p11-yatak',  'yatak',  300, 320, [-2.10,-0.70], 0x44cc88, { removedWalls: ['right'] }),
    mkRoom('p11-mutfak', 'mutfak', 250, 260, [-1.85, 2.20], 0xff8844, { removedWalls: ['right', 'back'] }),
    mkRoom('p11-banyo',  'banyo',  190, 200, [ 2.65, 3.30], 0x44cccc, { removedWalls: ['back'] }),
  ],
  furniture: [
    mkFurn('p11-f1', 'sofa',    [ 1.50,  0.90], { length: 220 },             'p11-salon', Math.PI, 'classic'),
    mkFurn('p11-f2', 'ctable',  [ 1.50, -0.10], { diameter: 85 },            'p11-salon', 0,       'round'),
    mkFurn('p11-f3', 'tvunit',  [ 1.50, -1.90], { length: 190 },             'p11-salon', 0, 'classic'),
    mkFurn('p11-f4', 'rug',     [ 1.50,  0.30], { length: 200, width: 150 }, 'p11-salon'),
    mkFurn('p11-f5', 'plant',   [ 3.30,  2.00], { diameter: 45 },            'p11-salon', 0,       'classic'),
    mkFurn('p11-f6', 'bed',     [-2.10, -0.50], { length: 200, width: 140 }, 'p11-yatak', 0,       'classic'),
    mkFurn('p11-f7', 'wardrobe',[-3.10,  0.30], { width: 140, depth: 55 },   'p11-yatak', 0,       'classic'),
    mkFurn('p11-f8', 'counter', [-2.30,  1.30], { length: 160, depth: 60 },  'p11-mutfak', 0),
    mkFurn('p11-f9', 'fridge',  [-2.90,  3.20], { width: 65, depth: 60 },    'p11-mutfak', 0,      'classic'),
    mkFurn('p11-f10','washer',  [ 2.05,  2.65], {},                          'p11-banyo',  0),
  ],
}

// 1+1 Modern
const apt1p1Modern: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p12-salon',  'salon',  460, 500, [ 1.70, 0.00], 0x4488ff, { wallColor: '#d0d0cc' }),
    mkRoom('p12-yatak',  'yatak',  320, 340, [-2.20,-0.80], 0x44cc88, { removedWalls: ['right'] }),
    mkRoom('p12-mutfak', 'mutfak', 270, 260, [-1.95, 2.60], 0xff8844, { removedWalls: ['right'] }),
    mkRoom('p12-banyo',  'banyo',  200, 220, [ 2.90, 3.60], 0x44cccc, { removedWalls: ['back'] }),
  ],
  furniture: [
    mkFurn('p12-f1', 'lsofa',      [ 1.70,  1.10], { length: 280, width: 190, depth: 95 },'p12-salon', Math.PI, 'modern'),
    mkFurn('p12-f2', 'ctable',     [ 1.70, -0.20], { diameter: 100 },                     'p12-salon', 0,       'marble'),
    mkFurn('p12-f3', 'tvunit',     [ 1.70, -2.10], { length: 210 },                       'p12-salon', 0, 'floating'),
    mkFurn('p12-f4', 'rug',        [ 1.70,  0.30], { length: 240, width: 170 },           'p12-salon'),
    mkFurn('p12-f5', 'ceilinglamp',[ 1.70,  0.00], { diameter: 55 },                      'p12-salon', 0,       'pendant'),
    mkFurn('p12-f6', 'bed',        [-2.20, -0.60], { length: 200, width: 160 },           'p12-yatak', 0,       'modern'),
    mkFurn('p12-f7', 'wardrobe',   [-3.40,  0.40], { width: 160, depth: 60 },             'p12-yatak', 0,       'sliding'),
    mkFurn('p12-f8', 'counter',    [-2.50,  1.60], { length: 180, depth: 60 },            'p12-mutfak', 0),
    mkFurn('p12-f9', 'fridge',     [-3.20,  3.50], { width: 70, depth: 65 },              'p12-mutfak', 0,      'french'),
    mkFurn('p12-f10','washer',     [ 2.25,  2.90], {},                                    'p12-banyo',  0),
  ],
}

// 1+1 Geniş Salon
const apt1p1GenisSalon: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p13-salon',  'salon',  560, 500, [ 2.20, 0.00], 0x4488ff),
    mkRoom('p13-yatak',  'yatak',  300, 320, [-2.10,-0.90], 0x44cc88, { removedWalls: ['right'] }),
    mkRoom('p13-mutfak', 'mutfak', 240, 260, [-1.80, 2.20], 0xff8844, { removedWalls: ['right'] }),
    mkRoom('p13-banyo',  'banyo',  200, 220, [ 3.20, 3.60], 0x44cccc, { removedWalls: ['back'] }),
  ],
  furniture: [
    mkFurn('p13-f1', 'lsofa',      [ 2.20,  0.90], { length: 320, width: 220, depth: 100 },'p13-salon', Math.PI, 'chaise'),
    mkFurn('p13-f2', 'ctable',     [ 2.20, -0.30], { diameter: 110 },                      'p13-salon', 0,       'marble'),
    mkFurn('p13-f3', 'tvunit',     [ 2.20, -2.10], { length: 230 },                        'p13-salon', 0, 'floating'),
    mkFurn('p13-f4', 'chair',      [ 4.20,  0.70], { diameter: 95 },                       'p13-salon', -Math.PI/4, 'berjer'),
    mkFurn('p13-f5', 'rug',        [ 2.20,  0.30], { length: 280, width: 200 },            'p13-salon'),
    mkFurn('p13-f6', 'ceilinglamp',[ 2.20,  0.00], { diameter: 60 },                       'p13-salon', 0,       'chandelier'),
    mkFurn('p13-f7', 'plant',      [ 4.50,  2.10], { diameter: 55 },                       'p13-salon', 0,       'tall'),
    mkFurn('p13-f8', 'bed',        [-2.10, -0.70], { length: 200, width: 140 },            'p13-yatak', 0,       'classic'),
    mkFurn('p13-f9', 'wardrobe',   [-3.15,  0.20], { width: 150, depth: 55 },              'p13-yatak', 0,       'sliding'),
    mkFurn('p13-f10','counter',    [-2.20,  1.30], { length: 160, depth: 60 },             'p13-mutfak', 0),
    mkFurn('p13-f11','fridge',     [-2.80,  3.20], { width: 65, depth: 60 },               'p13-mutfak', 0,      'classic'),
    mkFurn('p13-f12','washer',     [ 2.65,  2.95], {},                                     'p13-banyo',  0),
  ],
}

// 1+1 Koridorlu
const apt1p1Koridor: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p14-salon',   'salon',   400, 320, [ 1.85, 0.00], 0x4488ff),
    mkRoom('p14-koridor', 'koridor', 130, 400, [-0.80, 0.00], 0xcc8844, { removedWalls: ['right'] }),
    mkRoom('p14-yatak',   'yatak',   300, 340, [-2.95,-0.30], 0x44cc88, { removedWalls: ['right'] }),
    mkRoom('p14-mutfak',  'mutfak',  200, 260, [ 1.00, 2.90], 0xff8844, { removedWalls: ['back'] }),
    mkRoom('p14-banyo',   'banyo',   200, 220, [ 3.00, 2.70], 0x44cccc, { removedWalls: ['back', 'left'] }),
  ],
  furniture: [
    mkFurn('p14-f1','sofa',    [ 1.85,  0.50], { length: 220 },             'p14-salon', Math.PI, 'classic'),
    mkFurn('p14-f2','ctable',  [ 1.85, -0.30], { diameter: 90 },            'p14-salon', 0,       'round'),
    mkFurn('p14-f3','tvunit',  [ 1.85, -1.30], { length: 200 },             'p14-salon', 0, 'classic'),
    mkFurn('p14-f4','rug',     [ 1.85,  0.00], { length: 220, width: 160 }, 'p14-salon'),
    mkFurn('p14-f5','bed',     [-2.95, -0.10], { length: 200, width: 140 }, 'p14-yatak', 0,       'classic'),
    mkFurn('p14-f6','wardrobe',[-4.10,  0.80], { width: 180, depth: 55 },   'p14-yatak', 0,       'classic'),
    mkFurn('p14-f7','counter', [ 0.60,  1.95], { length: 140, depth: 55 },  'p14-mutfak', 0),
    mkFurn('p14-f8','fridge',  [ 1.80,  1.95], { width: 65, depth: 60 },    'p14-mutfak', 0,      'classic'),
    mkFurn('p14-f9','washer',  [ 2.40,  1.95], {},                          'p14-banyo',  0),
  ],
}

// 1+1 Açık Mutfak
const apt1p1AcikMutfak: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p15-salon', 'salon', 560, 440, [ 2.20, 0.00], 0x4488ff),
    mkRoom('p15-yatak', 'yatak', 320, 360, [-2.20,-0.40], 0x44cc88, { removedWalls: ['right'] }),
    mkRoom('p15-banyo', 'banyo', 200, 220, [-1.60, 3.30], 0x44cccc, { removedWalls: ['back'] }),
  ],
  furniture: [
    mkFurn('p15-f1', 'lsofa',      [ 1.60,  1.00], { length: 280, width: 200, depth: 95 },'p15-salon', Math.PI, 'modern'),
    mkFurn('p15-f2', 'ctable',     [ 1.60, -0.20], { diameter: 100 },                     'p15-salon', 0,       'marble'),
    mkFurn('p15-f3', 'tvunit',     [ 1.60, -2.00], { length: 210 },                       'p15-salon', 0, 'floating'),
    mkFurn('p15-f4', 'rug',        [ 1.60,  0.20], { length: 240, width: 170 },           'p15-salon'),
    mkFurn('p15-f5', 'dtable',     [ 4.10, -0.60], { length: 140, width: 80 },            'p15-salon', 0,       'modern'),
    mkFurn('p15-f6', 'dchair',     [ 3.40, -0.60], {},                                    'p15-salon', Math.PI/2,  'scandi'),
    mkFurn('p15-f7', 'dchair',     [ 4.80, -0.60], {},                                    'p15-salon', -Math.PI/2, 'scandi'),
    mkFurn('p15-f8', 'counter',    [ 4.10,  1.80], { length: 200, depth: 60 },            'p15-salon', Math.PI),
    mkFurn('p15-f9', 'fridge',     [ 4.80,  0.80], { width: 75, depth: 65 },              'p15-salon', 0,       'french'),
    mkFurn('p15-f10','ceilinglamp',[ 1.60,  0.00], { diameter: 55 },                      'p15-salon', 0,       'pendant'),
    mkFurn('p15-f11','bed',        [-2.20, -0.20], { length: 200, width: 160 },           'p15-yatak', 0,       'tufted'),
    mkFurn('p15-f12','wardrobe',   [-3.50,  0.80], { width: 180, depth: 55 },             'p15-yatak', 0,       'sliding'),
    mkFurn('p15-f13','washer',     [-2.20,  2.60], {},                                    'p15-banyo',  0),
  ],
}

// 1+1 Master Yatakhane
const apt1p1Master: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p16-salon',  'salon',  400, 440, [ 1.40, 0.00], 0x4488ff),
    mkRoom('p16-yatak',  'yatak',  400, 440, [-2.60, 0.00], 0x44cc88, { removedWalls: ['right'] }),
    mkRoom('p16-mutfak', 'mutfak', 260, 260, [ 0.10, 3.50], 0xff8844, { removedWalls: ['back'] }),
    mkRoom('p16-banyo',  'banyo',  220, 220, [ 2.50, 3.30], 0x44cccc, { removedWalls: ['back', 'left'] }),
  ],
  furniture: [
    mkFurn('p16-f1', 'sofa',    [ 1.40,  0.80], { length: 210 },             'p16-salon', Math.PI, 'classic'),
    mkFurn('p16-f2', 'ctable',  [ 1.40, -0.10], { diameter: 90 },            'p16-salon', 0,       'round'),
    mkFurn('p16-f3', 'tvunit',  [ 1.40, -1.80], { length: 180 },             'p16-salon', 0, 'classic'),
    mkFurn('p16-f4', 'rug',     [ 1.40,  0.20], { length: 200, width: 150 }, 'p16-salon'),
    mkFurn('p16-f5', 'bed',     [-2.60, -0.30], { length: 210, width: 180 }, 'p16-yatak', 0,       'tufted'),
    mkFurn('p16-f6', 'wardrobe',[-4.10,  0.90], { width: 240, depth: 60 },   'p16-yatak', 0,       'sliding'),
    mkFurn('p16-f7', 'chair',   [-1.00,  1.40], { diameter: 85 },            'p16-yatak', -Math.PI/4, 'berjer'),
    mkFurn('p16-f8', 'counter', [-0.30,  2.60], { length: 180, depth: 55 },  'p16-mutfak', 0),
    mkFurn('p16-f9', 'fridge',  [ 1.00,  2.60], { width: 70, depth: 65 },    'p16-mutfak', 0,      'classic'),
    mkFurn('p16-f10','washer',  [ 2.00,  2.60], {},                          'p16-banyo',  0),
  ],
}

// ═══════════════════════════════════════════════════════════════════
//  2+1 VARYANTLARI (8) — p17..p24
// ═══════════════════════════════════════════════════════════════════

// 2+1 Klasik Türk
const apt2p1Klasik: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p17-salon',   'salon',   480, 520, [ 2.40, 0.00], 0x4488ff),
    mkRoom('p17-koridor', 'koridor', 130, 520, [-0.65, 0.00], 0xcc8844, { removedWalls: ['right'] }),
    mkRoom('p17-yatak1',  'yatak',   330, 380, [-2.95,-0.80], 0x44cc88, { removedWalls: ['right'] }),
    mkRoom('p17-yatak2',  'yatak',   310, 340, [-2.85, 2.80], 0x6688ff, { removedWalls: ['right', 'back'] }),
    mkRoom('p17-mutfak',  'mutfak',  260, 280, [ 1.30, 4.00], 0xff8844, { removedWalls: ['back'] }),
    mkRoom('p17-banyo',   'banyo',   220, 240, [ 3.70, 3.80], 0x44cccc, { removedWalls: ['back', 'left'] }),
  ],
  furniture: [
    mkFurn('p17-f1', 'sofa',        [ 2.40,  1.00], { length: 260 },             'p17-salon', Math.PI,     'classic'),
    mkFurn('p17-f2', 'sofa',        [ 4.40, -0.20], { length: 160 },             'p17-salon', -Math.PI/2,  'classic'),
    mkFurn('p17-f3', 'ctable',      [ 2.40, -0.10], { diameter: 100 },           'p17-salon', 0,           'square'),
    mkFurn('p17-f4', 'tvunit',      [ 2.40, -2.20], { length: 200 },             'p17-salon', 0,     'classic'),
    mkFurn('p17-f5', 'rug',         [ 2.40,  0.30], { length: 260, width: 180 }, 'p17-salon'),
    mkFurn('p17-f6', 'ceilinglamp', [ 2.40,  0.00], { diameter: 60 },            'p17-salon', 0,           'chandelier'),
    mkFurn('p17-f7', 'bed',         [-2.95, -0.50], { length: 200, width: 160 }, 'p17-yatak1', 0,          'classic'),
    mkFurn('p17-f8', 'wardrobe',    [-4.15,  0.70], { width: 180, depth: 55 },   'p17-yatak1', Math.PI,          'classic'),
    mkFurn('p17-f9', 'bed',         [-2.85,  3.10], { length: 190, width: 130 }, 'p17-yatak2', 0,          'classic'),
    mkFurn('p17-f10','wardrobe',    [-4.00,  1.90], { width: 150, depth: 55 },   'p17-yatak2', 0,          'classic'),
    mkFurn('p17-f11','counter',     [ 0.70,  2.90], { length: 180, depth: 55 },  'p17-mutfak', 0),
    mkFurn('p17-f12','fridge',      [ 2.10,  2.90], { width: 65, depth: 60 },    'p17-mutfak', 0,          'classic'),
    mkFurn('p17-f13','dtable',      [ 1.30,  4.40], { length: 130, width: 75 },  'p17-mutfak', 0,          'classic'),
    mkFurn('p17-f14','dchair',      [ 0.70,  4.40], {},                          'p17-mutfak', Math.PI/2,  'classic'),
    mkFurn('p17-f15','dchair',      [ 1.90,  4.40], {},                          'p17-mutfak', -Math.PI/2, 'classic'),
    mkFurn('p17-f16','washer',      [ 2.90,  3.00], {},                          'p17-banyo',  0),
  ],
}

// 2+1 Modern
const apt2p1Modern: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p18-salon',   'salon',   540, 540, [ 2.70, 0.00], 0x4488ff, { wallColor: '#d0d0cc' }),
    mkRoom('p18-koridor', 'koridor', 140, 540, [-0.70, 0.00], 0xcc8844, { removedWalls: ['right'] }),
    mkRoom('p18-yatak1',  'yatak',   340, 380, [-3.10,-0.80], 0x44cc88, { removedWalls: ['right'] }),
    mkRoom('p18-yatak2',  'yatak',   320, 340, [-3.00, 2.80], 0x6688ff, { removedWalls: ['right', 'back'] }),
    mkRoom('p18-mutfak',  'mutfak',  280, 280, [ 1.80, 4.10], 0xff8844, { removedWalls: ['back'] }),
    mkRoom('p18-banyo',   'banyo',   220, 220, [ 4.30, 3.80], 0x44cccc, { removedWalls: ['back', 'left'] }),
  ],
  furniture: [
    mkFurn('p18-f1', 'lsofa',       [ 2.70,  1.00], { length: 320, width: 220, depth: 100 },'p18-salon', Math.PI, 'modern'),
    mkFurn('p18-f2', 'ctable',      [ 2.70, -0.30], { diameter: 110 },                      'p18-salon', 0,       'marble'),
    mkFurn('p18-f3', 'tvunit',      [ 2.70, -2.20], { length: 240 },                        'p18-salon', 0, 'floating'),
    mkFurn('p18-f4', 'chair',       [ 4.80,  0.50], { diameter: 95 },                       'p18-salon', -Math.PI/4, 'accent'),
    mkFurn('p18-f5', 'rug',         [ 2.70,  0.30], { length: 280, width: 200 },            'p18-salon'),
    mkFurn('p18-f6', 'ceilinglamp', [ 2.70,  0.00], { diameter: 60 },                       'p18-salon', 0,       'pendant'),
    mkFurn('p18-f7', 'plant',       [ 4.90,  2.20], { diameter: 60 },                       'p18-salon', 0,       'tall'),
    mkFurn('p18-f8', 'bed',         [-3.10, -0.40], { length: 210, width: 180 },            'p18-yatak1', 0,      'modern'),
    mkFurn('p18-f9', 'wardrobe',    [-4.50,  0.60], { width: 220, depth: 60 },              'p18-yatak1', 0,      'sliding'),
    mkFurn('p18-f10','bed',         [-3.00,  3.20], { length: 200, width: 140 },            'p18-yatak2', 0,      'modern'),
    mkFurn('p18-f11','wardrobe',    [-4.20,  1.80], { width: 160, depth: 55 },              'p18-yatak2', 0,      'sliding'),
    mkFurn('p18-f12','counter',     [ 1.20,  3.10], { length: 200, depth: 60 },             'p18-mutfak', 0),
    mkFurn('p18-f13','fridge',      [ 2.80,  3.10], { width: 75, depth: 65 },               'p18-mutfak', 0,      'french'),
    mkFurn('p18-f14','dtable',      [ 1.80,  4.50], { length: 140, width: 80 },             'p18-mutfak', 0,      'modern'),
    mkFurn('p18-f15','dchair',      [ 1.20,  4.50], {},                                     'p18-mutfak', Math.PI/2,  'scandi'),
    mkFurn('p18-f16','dchair',      [ 2.40,  4.50], {},                                     'p18-mutfak', -Math.PI/2, 'scandi'),
    mkFurn('p18-f17','washer',      [ 3.70,  3.00], {},                                     'p18-banyo',  0),
  ],
}

// 2+1 Ebeveyn Banyolu (ebanyo yatağın solunda dış cephe)
const apt2p1Ebanyolu: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p19-salon',   'salon',   500, 500, [ 2.50, 0.00], 0x4488ff),
    mkRoom('p19-koridor', 'koridor', 130, 500, [-0.65, 0.00], 0xcc8844, { removedWalls: ['right'] }),
    mkRoom('p19-yatak1',  'yatak',   300, 380, [-2.80,-0.60], 0x44cc88, { removedWalls: ['right'] }),
    mkRoom('p19-ebanyo',  'banyo',   150, 200, [-5.05,-1.30], 0x44cccc, { removedWalls: ['right'] }),
    mkRoom('p19-cocuk',   'cocuk',   300, 340, [-2.80, 3.00], 0xff44cc, { removedWalls: ['right', 'back'] }),
    mkRoom('p19-banyo',   'banyo',   200, 200, [ 1.00, 3.50], 0x44cccc, { removedWalls: ['back'] }),
    mkRoom('p19-mutfak',  'mutfak',  280, 300, [ 3.40, 4.00], 0xff8844, { removedWalls: ['back', 'left'] }),
  ],
  furniture: [
    mkFurn('p19-f1', 'lsofa',   [ 2.50,  0.90], { length: 280, width: 200, depth: 95 },'p19-salon', Math.PI, 'classic'),
    mkFurn('p19-f2', 'ctable',  [ 2.50, -0.30], { diameter: 100 },                     'p19-salon', 0,       'square'),
    mkFurn('p19-f3', 'tvunit',  [ 2.50, -2.10], { length: 200 },                       'p19-salon', 0, 'classic'),
    mkFurn('p19-f4', 'rug',     [ 2.50,  0.30], { length: 260, width: 190 },           'p19-salon'),
    mkFurn('p19-f5', 'bed',     [-2.80, -0.30], { length: 200, width: 160 },           'p19-yatak1', 0,      'tufted'),
    mkFurn('p19-f6', 'wardrobe',[-3.90,  0.80], { width: 180, depth: 60 },             'p19-yatak1', 0,      'sliding'),
    mkFurn('p19-f7', 'washer',  [-5.40, -0.50],  {},                                   'p19-ebanyo',  Math.PI),
    mkFurn('p19-f8', 'bed',     [-2.80,  3.30], { length: 190, width: 110 },           'p19-cocuk', 0,       'modern'),
    mkFurn('p19-f9', 'wardrobe',[-3.90,  4.30], { width: 140, depth: 55 },             'p19-cocuk', 0,       'classic'),
    mkFurn('p19-f10','shelf',   [-4.10,  1.80], { width: 80, height: 160 },            'p19-cocuk', 0,       'cube'),
    mkFurn('p19-f11','counter', [ 3.00,  2.90], { length: 200, depth: 60 },            'p19-mutfak', 0),
    mkFurn('p19-f12','fridge',  [ 4.50,  2.90], { width: 70, depth: 65 },              'p19-mutfak', 0,      'french'),
    mkFurn('p19-f13','dtable',  [ 3.40,  4.70], { length: 130, width: 80 },            'p19-mutfak', 0,      'classic'),
    mkFurn('p19-f14','dchair',  [ 2.80,  4.70], {},                                    'p19-mutfak', Math.PI/2,  'classic'),
    mkFurn('p19-f15','dchair',  [ 4.00,  4.70], {},                                    'p19-mutfak', -Math.PI/2, 'classic'),
    mkFurn('p19-f16','washer',  [ 0.40,  2.80], {},                                    'p19-banyo',  0),
  ],
}

// 2+1 Zemin Kat Bahçeli (yeni oda - bahçe)
const apt2p1Zemin: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p20-salon',   'salon',   560, 560, [ 2.80, 0.00], 0x4488ff),
    mkRoom('p20-koridor', 'koridor', 140, 560, [-0.70, 0.00], 0xcc8844, { removedWalls: ['right'] }),
    mkRoom('p20-yatak1',  'yatak',   340, 380, [-3.10,-0.90], 0x44cc88, { removedWalls: ['right'] }),
    mkRoom('p20-yatak2',  'yatak',   320, 340, [-3.00, 2.90], 0x6688ff, { removedWalls: ['right'] }),
    mkRoom('p20-mutfak',  'mutfak',  280, 280, [ 1.80, 4.20], 0xff8844, { removedWalls: ['back'] }),
    mkRoom('p20-banyo',   'banyo',   220, 220, [ 4.30, 3.90], 0x44cccc, { removedWalls: ['back', 'left'] }),
    mkRoom('p20-bahce',   'salon',   700, 280, [ 2.20, 6.70], 0x88cc44, { removedWalls: ['back'], floorType: 'beton', wallColor: '#c8d8c0' }),
  ],
  furniture: [
    mkFurn('p20-f1', 'lsofa',      [ 2.80,  1.00], { length: 320, width: 230, depth: 100 },'p20-salon', Math.PI, 'classic'),
    mkFurn('p20-f2', 'ctable',     [ 2.80, -0.30], { diameter: 110 },                      'p20-salon', 0,       'marble'),
    mkFurn('p20-f3', 'tvunit',     [ 2.80, -2.30], { length: 240 },                        'p20-salon', 0, 'classic'),
    mkFurn('p20-f4', 'rug',        [ 2.80,  0.30], { length: 280, width: 210 },            'p20-salon'),
    mkFurn('p20-f5', 'ceilinglamp',[ 2.80,  0.00], { diameter: 60 },                       'p20-salon', 0,       'chandelier'),
    mkFurn('p20-f6', 'bed',        [-3.10, -0.50], { length: 210, width: 180 },            'p20-yatak1', 0,      'tufted'),
    mkFurn('p20-f7', 'wardrobe',   [-4.50,  0.60], { width: 220, depth: 60 },              'p20-yatak1', 0,      'sliding'),
    mkFurn('p20-f8', 'bed',        [-3.00,  3.30], { length: 190, width: 130 },            'p20-yatak2', 0,      'classic'),
    mkFurn('p20-f9', 'wardrobe',   [-4.20,  1.90], { width: 160, depth: 55 },              'p20-yatak2', 0,      'classic'),
    mkFurn('p20-f10','counter',    [ 1.20,  3.40], { length: 200, depth: 60 },             'p20-mutfak', 0),
    mkFurn('p20-f11','fridge',     [ 2.80,  3.40], { width: 70, depth: 65 },               'p20-mutfak', 0,      'classic'),
    mkFurn('p20-f12','dtable',     [ 1.80,  4.80], { length: 140, width: 80 },             'p20-mutfak', 0,      'classic'),
    mkFurn('p20-f13','dchair',     [ 1.20,  4.80], {},                                     'p20-mutfak', Math.PI/2,  'classic'),
    mkFurn('p20-f14','dchair',     [ 2.40,  4.80], {},                                     'p20-mutfak', -Math.PI/2, 'classic'),
    mkFurn('p20-f15','washer',     [ 3.70,  3.10], {},                                     'p20-banyo',  0),
    mkFurn('p20-f16','chair',      [ 0.50,  6.50], { diameter: 90 },                       'p20-bahce', 0,       'accent'),
    mkFurn('p20-f17','chair',      [ 3.90,  6.50], { diameter: 90 },                       'p20-bahce', 0,       'accent'),
    mkFurn('p20-f18','ctable',     [ 2.20,  6.80], { diameter: 80 },                       'p20-bahce', 0,       'round'),
    mkFurn('p20-f19','plant',      [ 5.00,  6.70], { diameter: 70 },                       'p20-bahce', 0,       'tall'),
    mkFurn('p20-f20','plant',      [-0.70,  7.50], { diameter: 60 },                       'p20-bahce', 0,       'tall'),
  ],
}

// 2+1 Teraslı (teras salon'un -Z cephesinde)
const apt2p1Teras: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p21-salon',   'salon',   500, 460, [ 2.50, 0.00], 0x4488ff),
    mkRoom('p21-koridor', 'koridor', 130, 460, [-0.65, 0.00], 0xcc8844, { removedWalls: ['right'] }),
    mkRoom('p21-yatak1',  'yatak',   320, 360, [-2.90,-0.50], 0x44cc88, { removedWalls: ['right'] }),
    mkRoom('p21-yatak2',  'yatak',   300, 320, [-2.80, 2.60], 0x6688ff, { removedWalls: ['right', 'back'] }),
    mkRoom('p21-mutfak',  'mutfak',  260, 260, [ 1.30, 3.60], 0xff8844, { removedWalls: ['back'] }),
    mkRoom('p21-banyo',   'banyo',   200, 220, [ 3.60, 3.50], 0x44cccc, { removedWalls: ['back', 'left'] }),
    mkRoom('p21-teras',   'salon',   500, 180, [ 2.50,-3.20], 0x88cc44, { removedWalls: ['front'], floorType: 'fayans', wallColor: '#c8d8c0' }),
  ],
  furniture: [
    mkFurn('p21-f1', 'lsofa',   [ 2.50,  0.90], { length: 290, width: 200, depth: 95 },'p21-salon', Math.PI, 'modern'),
    mkFurn('p21-f2', 'ctable',  [ 2.50, -0.30], { diameter: 100 },                     'p21-salon', 0,       'marble'),
    mkFurn('p21-f3', 'tvunit',  [ 2.50, -2.00], { length: 220 },                       'p21-salon', 0, 'floating'),
    mkFurn('p21-f4', 'rug',     [ 2.50,  0.30], { length: 260, width: 190 },           'p21-salon'),
    mkFurn('p21-f5', 'bed',     [-2.90, -0.20], { length: 200, width: 160 },           'p21-yatak1', 0,      'tufted'),
    mkFurn('p21-f6', 'wardrobe',[-4.10,  0.70], { width: 180, depth: 55 },             'p21-yatak1', 0,      'sliding'),
    mkFurn('p21-f7', 'bed',     [-2.80,  2.90], { length: 190, width: 130 },           'p21-yatak2', 0,      'modern'),
    mkFurn('p21-f8', 'wardrobe',[-4.10,  1.70], { width: 150, depth: 55 },             'p21-yatak2', 0,      'classic'),
    mkFurn('p21-f9', 'counter', [ 0.70,  2.90], { length: 180, depth: 55 },            'p21-mutfak', 0),
    mkFurn('p21-f10','fridge',  [ 2.10,  2.90], { width: 65, depth: 60 },              'p21-mutfak', 0,      'classic'),
    mkFurn('p21-f11','dtable',  [ 1.30,  4.20], { length: 130, width: 75 },            'p21-mutfak', 0,      'classic'),
    mkFurn('p21-f12','dchair',  [ 0.70,  4.20], {},                                    'p21-mutfak', Math.PI/2,  'classic'),
    mkFurn('p21-f13','dchair',  [ 1.90,  4.20], {},                                    'p21-mutfak', -Math.PI/2, 'classic'),
    mkFurn('p21-f14','washer',  [ 2.90,  2.80], {},                                    'p21-banyo',  0),
    mkFurn('p21-f15','chair',   [ 1.20, -3.20], { diameter: 85 },                      'p21-teras', 0,       'accent'),
    mkFurn('p21-f16','chair',   [ 3.80, -3.20], { diameter: 85 },                      'p21-teras', 0,       'accent'),
    mkFurn('p21-f17','ctable',  [ 2.50, -3.20], { diameter: 70 },                      'p21-teras', 0,       'round'),
    mkFurn('p21-f18','plant',   [ 4.20, -3.20], { diameter: 55 },                      'p21-teras', 0,       'tall'),
  ],
}

// 2+1 İki Balkon
const apt2p1IkiBalkon: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p22-salon',   'salon',   500, 500, [ 2.50, 0.00], 0x4488ff),
    mkRoom('p22-koridor', 'koridor', 130, 500, [-0.65, 0.00], 0xcc8844, { removedWalls: ['right'] }),
    mkRoom('p22-yatak1',  'yatak',   330, 360, [-2.95,-0.70], 0x44cc88, { removedWalls: ['right'] }),
    mkRoom('p22-yatak2',  'yatak',   300, 320, [-2.80, 2.70], 0x6688ff, { removedWalls: ['right', 'back'] }),
    mkRoom('p22-mutfak',  'mutfak',  270, 260, [ 1.35, 3.80], 0xff8844, { removedWalls: ['back'] }),
    mkRoom('p22-banyo',   'banyo',   220, 220, [ 3.80, 3.60], 0x44cccc, { removedWalls: ['back', 'left'] }),
    mkRoom('p22-balkon1', 'salon',   500, 120, [ 2.50,-3.10], 0x44cccc, { removedWalls: ['front'], floorType: 'fayans', wallColor: '#c8d8c0' }),
    mkRoom('p22-balkon2', 'salon',   270, 120, [ 1.35, 5.70], 0x44cccc, { removedWalls: ['back'],  floorType: 'fayans', wallColor: '#c8d8c0' }),
  ],
  furniture: [
    mkFurn('p22-f1', 'lsofa',   [ 2.50,  0.80], { length: 280, width: 200, depth: 95 },'p22-salon', Math.PI, 'classic'),
    mkFurn('p22-f2', 'ctable',  [ 2.50, -0.30], { diameter: 100 },                     'p22-salon', 0,       'marble'),
    mkFurn('p22-f3', 'tvunit',  [ 2.50, -2.10], { length: 210 },                       'p22-salon', 0, 'classic'),
    mkFurn('p22-f4', 'rug',     [ 2.50,  0.30], { length: 260, width: 180 },           'p22-salon'),
    mkFurn('p22-f5', 'bed',     [-2.95, -0.40], { length: 200, width: 160 },           'p22-yatak1', 0,      'tufted'),
    mkFurn('p22-f6', 'wardrobe',[-4.20,  0.80], { width: 180, depth: 55 },             'p22-yatak1', Math.PI,      'sliding'),
    mkFurn('p22-f7', 'bed',     [-2.80,  3.00], { length: 190, width: 130 },           'p22-yatak2', 0,      'classic'),
    mkFurn('p22-f8', 'wardrobe',[-4.10,  1.80], { width: 150, depth: 55 },             'p22-yatak2', 0,      'classic'),
    mkFurn('p22-f9', 'counter', [ 0.70,  3.00], { length: 180, depth: 55 },            'p22-mutfak', 0),
    mkFurn('p22-f10','fridge',  [ 2.20,  3.00], { width: 65, depth: 60 },              'p22-mutfak', 0,      'classic'),
    mkFurn('p22-f11','dtable',  [ 1.35,  4.30], { length: 130, width: 75 },            'p22-mutfak', 0,      'classic'),
    mkFurn('p22-f12','dchair',  [ 0.75,  4.30], {},                                    'p22-mutfak', Math.PI/2,  'classic'),
    mkFurn('p22-f13','dchair',  [ 1.95,  4.30], {},                                    'p22-mutfak', -Math.PI/2, 'classic'),
    mkFurn('p22-f14','washer',  [ 3.10,  2.90], {},                                    'p22-banyo',  0),
    mkFurn('p22-f15','chair',   [ 1.50, -3.10], { diameter: 80 },                      'p22-balkon1', 0,     'accent'),
    mkFurn('p22-f16','plant',   [ 3.50, -3.10], { diameter: 50 },                      'p22-balkon1', 0,     'tall'),
    mkFurn('p22-f17','plant',   [ 1.35,  5.30], { diameter: 45 },                      'p22-balkon2', 0,     'classic'),
  ],
}

// 2+1 L-Plan
const apt2p1LPlan: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p23-salon',   'salon',   520, 540, [ 2.60, 0.00], 0x4488ff),
    mkRoom('p23-koridor', 'koridor', 140, 540, [-0.70, 0.00], 0xcc8844, { removedWalls: ['right'] }),
    mkRoom('p23-yatak1',  'yatak',   320, 360, [-3.00,-0.90], 0x44cc88, { removedWalls: ['right'] }),
    mkRoom('p23-yatak2',  'yatak',   320, 320, [-3.00, 2.50], 0x6688ff, { removedWalls: ['right', 'back'] }),
    mkRoom('p23-mutfak',  'mutfak',  260, 270, [ 1.70, 4.05], 0xff8844, { removedWalls: ['back'] }),
    mkRoom('p23-banyo',   'banyo',   200, 220, [ 4.10, 3.80], 0x44cccc, { removedWalls: ['back', 'left'] }),
  ],
  furniture: [
    mkFurn('p23-f1', 'lsofa',   [ 2.60,  0.90], { length: 300, width: 220, depth: 95 },'p23-salon', Math.PI, 'chaise'),
    mkFurn('p23-f2', 'ctable',  [ 2.60, -0.30], { diameter: 100 },                     'p23-salon', 0,       'marble'),
    mkFurn('p23-f3', 'tvunit',  [ 2.60, -2.20], { length: 220 },                       'p23-salon', 0, 'floating'),
    mkFurn('p23-f4', 'rug',     [ 2.60,  0.30], { length: 260, width: 190 },           'p23-salon'),
    mkFurn('p23-f5', 'bed',     [-3.00, -0.60], { length: 200, width: 160 },           'p23-yatak1', 0,      'tufted'),
    mkFurn('p23-f6', 'wardrobe',[-4.30,  0.40], { width: 180, depth: 55 },             'p23-yatak1', 0,      'sliding'),
    mkFurn('p23-f7', 'bed',     [-3.00,  1.40], { length: 190, width: 130 },           'p23-yatak2', 0,      'modern'),
    mkFurn('p23-f8', 'wardrobe',[-4.30,  2.40], { width: 160, depth: 55 },             'p23-yatak2', 0,      'classic'),
    mkFurn('p23-f9', 'counter', [ 1.10,  3.20], { length: 180, depth: 55 },            'p23-mutfak', 0),
    mkFurn('p23-f10','fridge',  [ 2.50,  3.20], { width: 65, depth: 60 },              'p23-mutfak', 0,      'classic'),
    mkFurn('p23-f11','dtable',  [ 1.70,  4.60], { length: 130, width: 75 },            'p23-mutfak', 0,      'classic'),
    mkFurn('p23-f12','dchair',  [ 1.10,  4.60], {},                                    'p23-mutfak', Math.PI/2,  'classic'),
    mkFurn('p23-f13','dchair',  [ 2.30,  4.60], {},                                    'p23-mutfak', -Math.PI/2, 'classic'),
    mkFurn('p23-f14','washer',  [ 3.50,  3.10], {},                                    'p23-banyo',  0),
  ],
}

// 2+1 Çocuk Odası Öncelikli
const apt2p1Cocuk: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p24-salon',   'salon',   500, 500, [ 2.50, 0.00], 0x4488ff),
    mkRoom('p24-koridor', 'koridor', 130, 500, [-0.65, 0.00], 0xcc8844, { removedWalls: ['right'] }),
    mkRoom('p24-yatak1',  'yatak',   320, 360, [-2.90,-0.70], 0x44cc88, { removedWalls: ['right'] }),
    mkRoom('p24-cocuk',   'cocuk',   360, 400, [-3.10, 3.10], 0xff44cc, { removedWalls: ['right', 'back'] }),
    mkRoom('p24-mutfak',  'mutfak',  280, 280, [ 1.40, 3.90], 0xff8844, { removedWalls: ['back'] }),
    mkRoom('p24-banyo',   'banyo',   220, 220, [ 3.90, 3.60], 0x44cccc, { removedWalls: ['back', 'left'] }),
  ],
  furniture: [
    mkFurn('p24-f1', 'lsofa',   [ 2.50,  0.80], { length: 280, width: 200, depth: 95 },'p24-salon', Math.PI, 'classic'),
    mkFurn('p24-f2', 'ctable',  [ 2.50, -0.30], { diameter: 100 },                     'p24-salon', 0,       'round'),
    mkFurn('p24-f3', 'tvunit',  [ 2.50, -2.10], { length: 210 },                       'p24-salon', 0, 'classic'),
    mkFurn('p24-f4', 'rug',     [ 2.50,  0.30], { length: 260, width: 180 },           'p24-salon'),
    mkFurn('p24-f5', 'bed',     [-2.90, -0.40], { length: 200, width: 160 },           'p24-yatak1', 0,      'classic'),
    mkFurn('p24-f6', 'wardrobe',[-4.10,  0.80], { width: 180, depth: 55 },             'p24-yatak1', Math.PI,      'sliding'),
    mkFurn('p24-f7', 'bed',     [-3.10,  3.40], { length: 190, width: 110 },           'p24-cocuk', 0,       'modern'),
    mkFurn('p24-f8', 'wardrobe',[-4.40,  1.70], { width: 180, depth: 55 },             'p24-cocuk', 0,       'classic'),
    mkFurn('p24-f9', 'shelf',   [-1.50,  4.60], { width: 140, height: 180 },           'p24-cocuk', 0,       'cube'),
    mkFurn('p24-f10','dtable',  [-4.30,  4.40], { length: 100, width: 60 },            'p24-cocuk', 0,       'modern'),
    mkFurn('p24-f11','dchair',  [-4.30,  3.90], {},                                    'p24-cocuk', 0,       'scandi'),
    mkFurn('p24-f12','rug',     [-2.70,  4.30], { length: 180, width: 140 },           'p24-cocuk'),
    mkFurn('p24-f13','counter', [ 0.80,  3.10], { length: 200, depth: 60 },            'p24-mutfak', 0),
    mkFurn('p24-f14','fridge',  [ 2.40,  3.10], { width: 70, depth: 65 },              'p24-mutfak', 0,      'classic'),
    mkFurn('p24-f15','dtable',  [ 1.40,  4.50], { length: 140, width: 80 },            'p24-mutfak', 0,      'classic'),
    mkFurn('p24-f16','dchair',  [ 0.70,  4.50], {},                                    'p24-mutfak', Math.PI/2,  'classic'),
    mkFurn('p24-f17','dchair',  [ 2.10,  4.50], {},                                    'p24-mutfak', -Math.PI/2, 'classic'),
    mkFurn('p24-f18','washer',  [ 3.20,  2.90], {},                                    'p24-banyo',  0),
  ],
}

// ═══════════════════════════════════════════════════════════════════
//  3+1 VARYANTLARI (6 yeni) — p25..p30
// ═══════════════════════════════════════════════════════════════════

// 3+1 Geleneksel Türk (ayrı yemek odası + salon)
const apt3p1Gelenek: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p25-salon',   'salon',   500, 440, [ 2.50,-0.20], 0x4488ff),
    mkRoom('p25-yemek',   'salon',   500, 120, [ 2.50, 2.60], 0xff44cc, { removedWalls: ['back'], wallColor: '#e8dcc0', floorType: 'parke' }),
    mkRoom('p25-koridor', 'koridor', 130, 640, [-0.65, 0.00], 0xcc8844, { removedWalls: ['right'] }),
    mkRoom('p25-yatak1',  'yatak',   340, 340, [-3.00,-1.50], 0x44cc88, { removedWalls: ['right'] }),
    mkRoom('p25-yatak2',  'yatak',   320, 280, [-2.90, 1.70], 0x6688ff, { removedWalls: ['right', 'back'] }),
    mkRoom('p25-cocuk',   'cocuk',   300, 300, [-2.80, 4.70], 0xff44cc, { removedWalls: ['right', 'back'] }),
    mkRoom('p25-mutfak',  'mutfak',  260, 280, [ 1.30, 4.60], 0xff8844, { removedWalls: ['back'] }),
    mkRoom('p25-banyo',   'banyo',   220, 240, [ 3.70, 4.40], 0x44cccc, { removedWalls: ['back', 'left'] }),
  ],
  furniture: [
    mkFurn('p25-f1', 'sofa',       [ 2.50,  0.90], { length: 250 },             'p25-salon', Math.PI,     'classic'),
    mkFurn('p25-f2', 'sofa',       [ 4.40, -0.50], { length: 160 },             'p25-salon', -Math.PI/2,  'classic'),
    mkFurn('p25-f3', 'ctable',     [ 2.50, -0.30], { diameter: 100 },           'p25-salon', 0,           'square'),
    mkFurn('p25-f4', 'tvunit',     [ 2.50, -2.10], { length: 210 },             'p25-salon', 0,     'classic'),
    mkFurn('p25-f5', 'rug',        [ 2.50,  0.20], { length: 260, width: 180 }, 'p25-salon'),
    mkFurn('p25-f6', 'ceilinglamp',[ 2.50, -0.20], { diameter: 65 },            'p25-salon', 0,           'chandelier'),
    mkFurn('p25-f7', 'dtable',     [ 2.50,  2.10], { length: 180, width: 90 },  'p25-yemek', 0,           'classic'),
    mkFurn('p25-f8', 'dchair',     [ 1.50,  2.10], {},                          'p25-yemek', Math.PI/2,   'classic'),
    mkFurn('p25-f9', 'dchair',     [ 3.50,  2.10], {},                          'p25-yemek', -Math.PI/2,  'classic'),
    mkFurn('p25-f10','dchair',     [ 2.50,  2.30], {},                          'p25-yemek', 0,           'classic'),
    mkFurn('p25-f11','dchair',     [ 2.50,  2.60], {},                          'p25-yemek', Math.PI,     'classic'),
    mkFurn('p25-f12','bed',        [-3.00, -0.90], { length: 210, width: 180 }, 'p25-yatak1', 0,          'tufted'),
    mkFurn('p25-f13','wardrobe',   [-4.30,  0.10], { width: 200, depth: 60 },   'p25-yatak1', Math.PI,          'sliding'),
    mkFurn('p25-f14','bed',        [-2.90,  1.70], { length: 190, width: 130 }, 'p25-yatak2', 0,          'classic'),
    mkFurn('p25-f15','wardrobe',   [-4.10,  2.60], { width: 160, depth: 55 },   'p25-yatak2', 0,          'classic'),
    mkFurn('p25-f16','bed',        [-2.80,  4.40], { length: 190, width: 110 }, 'p25-cocuk', 0,           'modern'),
    mkFurn('p25-f17','wardrobe',   [-4.00,  3.40], { width: 140, depth: 55 },   'p25-cocuk', 0,           'classic'),
    mkFurn('p25-f18','counter',    [ 0.70,  3.70], { length: 180, depth: 55 },  'p25-mutfak', 0),
    mkFurn('p25-f19','fridge',     [ 2.10,  3.70], { width: 65, depth: 60 },    'p25-mutfak', 0,          'classic'),
    mkFurn('p25-f20','washer',     [ 2.90,  3.60], {},                          'p25-banyo',  0),
  ],
}

// 3+1 Açık Mutfak (salon ile birleşik)
const apt3p1AcikMutfak: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p26-salon',   'salon',   600, 560, [ 3.00, 0.00], 0x4488ff),
    mkRoom('p26-koridor', 'koridor', 140, 560, [-0.70, 0.00], 0xcc8844, { removedWalls: ['right'] }),
    mkRoom('p26-yatak1',  'yatak',   380, 420, [-3.30,-0.90], 0x44cc88, { removedWalls: ['right'] }),
    mkRoom('p26-yatak2',  'yatak',   320, 340, [-3.00, 3.10], 0x6688ff, { removedWalls: ['right', 'back'] }),
    mkRoom('p26-banyo',   'banyo',   220, 240, [-0.40, 4.00], 0x44cccc, { removedWalls: ['back'] }),
    mkRoom('p26-cocuk',   'cocuk',   340, 340, [ 2.20, 4.50], 0xff44cc, { removedWalls: ['back', 'left'] }),
    mkRoom('p26-ebanyo',  'banyo',   220, 240, [ 5.00, 4.00], 0x44cccc, { removedWalls: ['back', 'left'] }),
  ],
  furniture: [
    mkFurn('p26-f1', 'lsofa',      [ 2.20,  1.00], { length: 340, width: 240, depth: 100 },'p26-salon', Math.PI, 'modern'),
    mkFurn('p26-f2', 'ctable',     [ 2.20, -0.30], { diameter: 110 },                      'p26-salon', 0,       'marble'),
    mkFurn('p26-f3', 'tvunit',     [ 2.20, -2.40], { length: 260 },                        'p26-salon', 0, 'floating'),
    mkFurn('p26-f4', 'rug',        [ 2.20,  0.30], { length: 320, width: 220 },            'p26-salon'),
    mkFurn('p26-f5', 'ceilinglamp',[ 2.20,  0.00], { diameter: 70 },                       'p26-salon', 0,       'chandelier'),
    mkFurn('p26-f6', 'dtable',     [ 5.20, -0.50], { length: 180, width: 90 },             'p26-salon', 0,       'modern'),
    mkFurn('p26-f7', 'dchair',     [ 4.40, -0.50], {},                                     'p26-salon', Math.PI/2,  'upholstered'),
    mkFurn('p26-f8', 'dchair',     [ 5.20, -1.20], {},                                     'p26-salon', 0,           'upholstered'),
    mkFurn('p26-f9', 'dchair',     [ 5.20,  0.20], {},                                     'p26-salon', Math.PI,     'upholstered'),
    mkFurn('p26-f10','counter',    [ 4.80,  1.90], { length: 240, depth: 60 },             'p26-salon', 0),
    mkFurn('p26-f11','fridge',     [ 5.50,  0.80], { width: 75, depth: 65 },               'p26-salon', 0,       'french'),
    mkFurn('p26-f12','bed',        [-3.30, -0.50], { length: 210, width: 180 },            'p26-yatak1', 0,      'tufted'),
    mkFurn('p26-f13','wardrobe',   [-4.80,  0.60], { width: 240, depth: 60 },              'p26-yatak1', 0,      'sliding'),
    mkFurn('p26-f14','bed',        [-3.00,  3.50], { length: 200, width: 140 },            'p26-yatak2', 0,      'classic'),
    mkFurn('p26-f15','wardrobe',   [-4.30,  2.10], { width: 180, depth: 55 },              'p26-yatak2', 0,      'classic'),
    mkFurn('p26-f16','bed',        [ 2.20,  4.80], { length: 190, width: 110 },            'p26-cocuk', 0,       'modern'),
    mkFurn('p26-f17','wardrobe',   [ 3.40,  3.30], { width: 140, depth: 55 },              'p26-cocuk', 0,       'classic'),
    mkFurn('p26-f18','washer',     [-1.00,  3.30], {},                                     'p26-banyo',  0),
    mkFurn('p26-f19','washer',     [ 4.40,  3.30], {},                                     'p26-ebanyo', 0),
  ],
}

// 3+1 İki Banyolu
const apt3p1IkiBanyo: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p27-salon',   'salon',   520, 560, [ 2.60, 0.00], 0x4488ff),
    mkRoom('p27-koridor', 'koridor', 140, 560, [-0.70, 0.00], 0xcc8844, { removedWalls: ['right'] }),
    mkRoom('p27-yatak1',  'yatak',   360, 380, [-3.20,-0.90], 0x44cc88, { removedWalls: ['right'] }),
    mkRoom('p27-yatak2',  'yatak',   320, 340, [-3.00, 2.80], 0x6688ff, { removedWalls: ['right', 'back'] }),
    mkRoom('p27-banyo1',  'banyo',   200, 200, [-0.30, 3.80], 0x44cccc, { removedWalls: ['back'] }),
    mkRoom('p27-mutfak',  'mutfak',  260, 260, [ 2.00, 4.10], 0xff8844, { removedWalls: ['back', 'left'] }),
    mkRoom('p27-cocuk',   'cocuk',   300, 320, [ 4.80, 4.40], 0xff44cc, { removedWalls: ['back', 'left'] }),
    mkRoom('p27-banyo2',  'banyo',   180, 200, [-1.45, -3.80], 0x44cccc, { removedWalls: [] }),
  ],
  furniture: [
    mkFurn('p27-f1', 'lsofa',    [ 2.60,  0.90], { length: 300, width: 220, depth: 95 },'p27-salon', Math.PI, 'classic'),
    mkFurn('p27-f2', 'ctable',   [ 2.60, -0.30], { diameter: 110 },                     'p27-salon', 0,       'marble'),
    mkFurn('p27-f3', 'tvunit',   [ 2.60, -2.30], { length: 230 },                       'p27-salon', 0, 'floating'),
    mkFurn('p27-f4', 'rug',      [ 2.60,  0.30], { length: 280, width: 200 },           'p27-salon'),
    mkFurn('p27-f5', 'bed',      [-3.20, -0.60], { length: 210, width: 180 },           'p27-yatak1', 0,      'tufted'),
    mkFurn('p27-f6', 'wardrobe', [-4.70,  0.40], { width: 220, depth: 60 },             'p27-yatak1', 0,      'sliding'),
    mkFurn('p27-f7', 'bed',      [-3.00,  3.20], { length: 200, width: 140 },           'p27-yatak2', 0,      'classic'),
    mkFurn('p27-f8', 'wardrobe', [-4.30,  1.80], { width: 180, depth: 55 },             'p27-yatak2', 0,      'classic'),
    mkFurn('p27-f9', 'washer',   [ 0.10,  3.10], {},                                    'p27-banyo1', 0),
    mkFurn('p27-f10','washer',   [-1.70, -3.40], {},                                    'p27-banyo2', Math.PI),
    mkFurn('p27-f11','counter',  [ 1.30,  3.30], { length: 180, depth: 55 },            'p27-mutfak', 0),
    mkFurn('p27-f12','fridge',   [ 2.70,  3.30], { width: 65, depth: 60 },              'p27-mutfak', 0,      'classic'),
    mkFurn('p27-f13','dtable',   [ 2.00,  4.70], { length: 130, width: 75 },            'p27-mutfak', 0,      'classic'),
    mkFurn('p27-f14','dchair',   [ 1.40,  4.70], {},                                    'p27-mutfak', Math.PI/2,  'classic'),
    mkFurn('p27-f15','dchair',   [ 2.60,  4.70], {},                                    'p27-mutfak', -Math.PI/2, 'classic'),
    mkFurn('p27-f16','bed',      [ 4.80,  4.70], { length: 190, width: 110 },           'p27-cocuk', 0,       'modern'),
    mkFurn('p27-f17','wardrobe', [ 6.00,  3.20], { width: 140, depth: 55 },             'p27-cocuk', 0,       'classic'),
    mkFurn('p27-f18','shelf',    [ 3.70,  5.30], { width: 80, height: 160 },            'p27-cocuk', 0,       'cube'),
  ],
}

// 3+1 Ebeveyn Süiti (ebanyo + giyinme odası)
const apt3p1Suit: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p28-salon',   'salon',   520, 560, [ 2.60, 0.00], 0x4488ff),
    mkRoom('p28-koridor', 'koridor', 140, 560, [-0.70, 0.00], 0xcc8844, { removedWalls: ['right'] }),
    mkRoom('p28-yatak1',  'yatak',   380, 400, [-3.30,-0.80], 0x44cc88, { removedWalls: ['right'] }),
    mkRoom('p28-giyinme', 'koridor', 220, 180, [-6.30, 0.10], 0xcc8844, { removedWalls: ['right'] }),
    mkRoom('p28-ebanyo',  'banyo',   220, 200, [-6.30, 2.00], 0x44cccc, { removedWalls: ['back'] }),
    mkRoom('p28-yatak2',  'yatak',   320, 340, [-3.00, 2.90], 0x6688ff, { removedWalls: ['right', 'back'] }),
    mkRoom('p28-banyo',   'banyo',   200, 200, [-0.30, 3.80], 0x44cccc, { removedWalls: ['back'] }),
    mkRoom('p28-mutfak',  'mutfak',  280, 280, [ 2.10, 4.20], 0xff8844, { removedWalls: ['back', 'left'] }),
    mkRoom('p28-cocuk',   'cocuk',   300, 340, [ 4.90, 4.50], 0xff44cc, { removedWalls: ['back', 'left'] }),
  ],
  furniture: [
    mkFurn('p28-f1', 'lsofa',    [ 2.60,  0.90], { length: 320, width: 230, depth: 95 },'p28-salon', Math.PI, 'chaise'),
    mkFurn('p28-f2', 'ctable',   [ 2.60, -0.30], { diameter: 110 },                     'p28-salon', 0,       'marble'),
    mkFurn('p28-f3', 'tvunit',   [ 2.60, -2.30], { length: 240 },                       'p28-salon', 0, 'floating'),
    mkFurn('p28-f4', 'rug',      [ 2.60,  0.30], { length: 300, width: 220 },           'p28-salon'),
    mkFurn('p28-f5', 'bed',      [-3.30, -0.40], { length: 220, width: 200 },           'p28-yatak1', 0,      'tufted'),
    mkFurn('p28-f6', 'chair',    [-2.00,  0.40], { diameter: 90 },                      'p28-yatak1', -Math.PI/4, 'berjer'),
    mkFurn('p28-f7', 'wardrobe', [-5.30, -0.20], { width: 200, depth: 55 },             'p28-giyinme', 0,     'sliding'),
    mkFurn('p28-f8', 'washer',   [-5.70,  1.60], {},                                    'p28-ebanyo', 0),
    mkFurn('p28-f9', 'bed',      [-3.00,  3.30], { length: 200, width: 140 },           'p28-yatak2', 0,      'classic'),
    mkFurn('p28-f10','wardrobe', [-4.30,  1.90], { width: 180, depth: 55 },             'p28-yatak2', 0,      'classic'),
    mkFurn('p28-f11','washer',   [ 0.10,  3.10], {},                                    'p28-banyo',  0),
    mkFurn('p28-f12','counter',  [ 1.40,  3.40], { length: 200, depth: 60 },            'p28-mutfak', 0),
    mkFurn('p28-f13','fridge',   [ 3.10,  3.40], { width: 70, depth: 65 },              'p28-mutfak', 0,      'classic'),
    mkFurn('p28-f14','dtable',   [ 2.10,  4.80], { length: 140, width: 80 },            'p28-mutfak', 0,      'classic'),
    mkFurn('p28-f15','dchair',   [ 1.40,  4.80], {},                                    'p28-mutfak', Math.PI/2,  'classic'),
    mkFurn('p28-f16','dchair',   [ 2.80,  4.80], {},                                    'p28-mutfak', -Math.PI/2, 'classic'),
    mkFurn('p28-f17','bed',      [ 4.90,  4.80], { length: 190, width: 110 },           'p28-cocuk', 0,       'modern'),
    mkFurn('p28-f18','wardrobe', [ 6.10,  3.20], { width: 140, depth: 55 },             'p28-cocuk', 0,       'classic'),
  ],
}

// 3+1 U-Plan
const apt3p1UPlan: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p29-salon',   'salon',   500, 500, [ 0.00, 0.00], 0x4488ff),
    mkRoom('p29-yatak1',  'yatak',   320, 380, [-4.10,-0.60], 0x44cc88, { removedWalls: ['right'] }),
    mkRoom('p29-yatak2',  'yatak',   300, 340, [ 4.00,-0.80], 0x6688ff, { removedWalls: ['left'] }),
    mkRoom('p29-cocuk',   'cocuk',   300, 320, [ 4.00, 2.50], 0xff44cc, { removedWalls: ['left', 'back'] }),
    mkRoom('p29-mutfak',  'mutfak',  280, 280, [-1.10, 3.90], 0xff8844, { removedWalls: ['back'] }),
    mkRoom('p29-banyo',   'banyo',   220, 220, [ 1.40, 3.60], 0x44cccc, { removedWalls: ['back', 'left'] }),
  ],
  furniture: [
    mkFurn('p29-f1', 'lsofa',    [ 0.00,  0.90], { length: 300, width: 220, depth: 95 },'p29-salon', Math.PI, 'classic'),
    mkFurn('p29-f2', 'ctable',   [ 0.00, -0.30], { diameter: 110 },                     'p29-salon', 0,       'marble'),
    mkFurn('p29-f3', 'tvunit',   [ 0.00, -2.10], { length: 240 },                       'p29-salon', 0, 'floating'),
    mkFurn('p29-f4', 'rug',      [ 0.00,  0.30], { length: 280, width: 200 },           'p29-salon'),
    mkFurn('p29-f5', 'bed',      [-4.10, -0.30], { length: 200, width: 160 },           'p29-yatak1', 0,      'tufted'),
    mkFurn('p29-f6', 'wardrobe', [-5.40,  0.70], { width: 180, depth: 55 },             'p29-yatak1', 0,      'sliding'),
    mkFurn('p29-f7', 'bed',      [ 4.00, -0.50], { length: 200, width: 140 },           'p29-yatak2', 0,      'classic'),
    mkFurn('p29-f8', 'wardrobe', [ 5.20,  0.50], { width: 160, depth: 55 },             'p29-yatak2', 0,      'classic'),
    mkFurn('p29-f9', 'bed',      [ 4.00,  2.40], { length: 190, width: 110 },           'p29-cocuk', 0,       'modern'),
    mkFurn('p29-f10','wardrobe', [ 5.20,  3.20], { width: 140, depth: 55 },             'p29-cocuk', 0,       'classic'),
    mkFurn('p29-f11','counter',  [-1.70,  3.10], { length: 200, depth: 60 },            'p29-mutfak', 0),
    mkFurn('p29-f12','fridge',   [-0.10,  3.10], { width: 70, depth: 65 },              'p29-mutfak', 0,      'classic'),
    mkFurn('p29-f13','dtable',   [-1.10,  4.50], { length: 140, width: 80 },            'p29-mutfak', 0,      'classic'),
    mkFurn('p29-f14','dchair',   [-1.80,  4.50], {},                                    'p29-mutfak', Math.PI/2,  'classic'),
    mkFurn('p29-f15','dchair',   [-0.40,  4.50], {},                                    'p29-mutfak', -Math.PI/2, 'classic'),
    mkFurn('p29-f16','washer',   [ 0.80,  2.90], {},                                    'p29-banyo',  0),
  ],
}

// 3+1 Ofis Odalı
const apt3p1OfisOdali: LayoutData = {
  version: VERSION,
  rooms: [
    mkRoom('p30-salon',   'salon',   520, 540, [ 2.60, 0.00], 0x4488ff),
    mkRoom('p30-koridor', 'koridor', 140, 540, [-0.70, 0.00], 0xcc8844, { removedWalls: ['right'] }),
    mkRoom('p30-yatak1',  'yatak',   340, 380, [-3.10,-0.80], 0x44cc88, { removedWalls: ['right'] }),
    mkRoom('p30-yatak2',  'yatak',   320, 340, [-3.00, 2.80], 0x6688ff, { removedWalls: ['right', 'back'] }),
    mkRoom('p30-ofis',    'cocuk',   300, 320, [ 4.80, 4.40], 0xff44cc, { removedWalls: ['back', 'left'], wallColor: '#d0d0cc' }),
    mkRoom('p30-mutfak',  'mutfak',  280, 280, [ 1.80, 3.90], 0xff8844, { removedWalls: ['back'] }),
    mkRoom('p30-banyo',   'banyo',   220, 220, [ 4.30, 3.80], 0x44cccc, { removedWalls: ['back', 'left'] }),
  ],
  furniture: [
    mkFurn('p30-f1', 'lsofa',    [ 2.60,  0.90], { length: 300, width: 220, depth: 95 },'p30-salon', Math.PI, 'modern'),
    mkFurn('p30-f2', 'ctable',   [ 2.60, -0.30], { diameter: 110 },                     'p30-salon', 0,       'marble'),
    mkFurn('p30-f3', 'tvunit',   [ 2.60, -2.20], { length: 230 },                       'p30-salon', 0, 'floating'),
    mkFurn('p30-f4', 'rug',      [ 2.60,  0.30], { length: 280, width: 200 },           'p30-salon'),
    mkFurn('p30-f5', 'bed',      [-3.10, -0.40], { length: 200, width: 160 },           'p30-yatak1', 0,      'tufted'),
    mkFurn('p30-f6', 'wardrobe', [-4.50,  0.60], { width: 220, depth: 60 },             'p30-yatak1', 0,      'sliding'),
    mkFurn('p30-f7', 'bed',      [-3.00,  3.20], { length: 200, width: 140 },           'p30-yatak2', 0,      'classic'),
    mkFurn('p30-f8', 'wardrobe', [-4.30,  1.80], { width: 180, depth: 55 },             'p30-yatak2', 0,      'classic'),
    mkFurn('p30-f9', 'dtable',   [ 4.80,  4.80], { length: 160, width: 80 },            'p30-ofis', 0,        'modern'),
    mkFurn('p30-f10','dchair',   [ 4.80,  4.20], {},                                    'p30-ofis', 0,        'scandi'),
    mkFurn('p30-f11','shelf',    [ 3.70,  5.30], { width: 140, height: 200 },           'p30-ofis', 0,        'classic'),
    mkFurn('p30-f12','shelf',    [ 6.10,  4.30], { width: 100, height: 180 },           'p30-ofis', -Math.PI/2, 'cube'),
    mkFurn('p30-f13','counter',  [ 1.20,  3.10], { length: 200, depth: 60 },            'p30-mutfak', 0),
    mkFurn('p30-f14','fridge',   [ 2.80,  3.10], { width: 75, depth: 65 },              'p30-mutfak', 0,      'french'),
    mkFurn('p30-f15','dtable',   [ 1.80,  4.50], { length: 140, width: 80 },            'p30-mutfak', 0,      'modern'),
    mkFurn('p30-f16','dchair',   [ 1.20,  4.50], {},                                    'p30-mutfak', Math.PI/2,  'scandi'),
    mkFurn('p30-f17','dchair',   [ 2.40,  4.50], {},                                    'p30-mutfak', -Math.PI/2, 'scandi'),
    mkFurn('p30-f18','washer',   [ 3.70,  3.00], {},                                    'p30-banyo',  0),
  ],
}

// ═══════════════════════════════════════════════════════════════════
//  GK BLOK 2+1 — Gerçek kat planından (89.86 m² brüt / 74.33 m² net)
//
//  Plan düzeni (TL origin → center origin, apt merkezi (5.70, 3.75)):
//
//    TL bbox                    → Center coords (widthCm × lengthCm)
//    ─────────────────────────────────────────────────────────────
//    E.YATAK  x[0,3.60] z[0,4.00]    → (-3.90, -1.75) 360×400
//    ENSÜİT   x[3.60,6.00] z[0,1.80] → (-0.90, -2.85) 240×180
//    WC       x[6.00,7.20] z[0,1.80] → ( 0.90, -2.85) 120×180
//    ANTRE    x[7.20,8.70] z[0,3.00] → ( 2.25, -2.25) 150×300
//    KORDOR   x[3.60,7.20] z[1.80,3.00] → (-0.30, -1.35) 360×120
//    YATAK    x[0,3.30] z[4.00,7.00]    → (-4.05,  1.75) 330×300
//    SALON    x[3.60,8.60] z[3.00,7.50] → ( 0.40,  1.50) 500×450
//    MUTFAK   x[8.60,11.40] z[3.00,6.00] → ( 4.30,  0.75) 280×300
//    BALKON   x[6.00,8.50] z[7.50,8.50] → ( 1.55,  4.25) 250×100 (salon altında çıkıntı)
//
//  Ana giriş: Antre'nin sağ (doğu) duvarı.
//  Akış: Antre → Kordor → (E.Yatak / Ensüit / WC), Antre → Salon,
//        Salon → (Yatak / Mutfak / Balkon).
// ═══════════════════════════════════════════════════════════════════
const gkTipi2p1: LayoutData = {
  version: VERSION,
  rooms: [
    // ── Ebeveyn Yatak Odası (sol üst) ──
    mkRoom('gk-eyatak', 'yatak', 360, 400, [-3.90, -1.75], 0x44cc88, {
      removedWalls: ['right'],  // kordor/ensüit paylaşır
      openings: [
        // Sol dış duvarda pencere
        { id: 'gk-o-ey-win', type: 'panoramic', wall: 'left', positionAlongWall: 0.50, widthCm: 180, heightCm: 140, bottomCm: 90 },
        // Kordora açılan kapı (sağ duvar, alt kısımda)
        { id: 'gk-o-ey-door', type: 'door', wall: 'right', positionAlongWall: 0.82, widthCm: 90, heightCm: 210, bottomCm: 0 },
      ],
    }),

    // ── Çocuk / Misafir Yatak Odası (sol alt) ──
    mkRoom('gk-yatak', 'yatak', 330, 300, [-4.05, 1.75], 0x6688ff, {
      removedWalls: ['right'],  // salon paylaşır (0.30m jog)
      openings: [
        { id: 'gk-o-y-win',  type: 'window', wall: 'left',  positionAlongWall: 0.50, widthCm: 160, heightCm: 140, bottomCm: 90 },
        { id: 'gk-o-y-door', type: 'door',   wall: 'right', positionAlongWall: 0.15, widthCm: 90,  heightCm: 210, bottomCm: 0 },
      ],
    }),

    // ── Ensüit Banyo (üst orta) ──
    mkRoom('gk-ensuit', 'banyo', 240, 180, [-0.90, -2.85], 0x66ddcc, {
      removedWalls: ['front'],  // kordor paylaşır
      openings: [
        { id: 'gk-o-en-win',  type: 'window', wall: 'back',  positionAlongWall: 0.50, widthCm: 90, heightCm: 80,  bottomCm: 140 },
        { id: 'gk-o-en-door', type: 'door',   wall: 'front', positionAlongWall: 0.25, widthCm: 75, heightCm: 210, bottomCm: 0 },
      ],
    }),

    // ── WC (üst orta-sağ) ──
    mkRoom('gk-wc', 'banyo', 120, 180, [0.90, -2.85], 0x44cccc, {
      removedWalls: ['front'],
      openings: [
        { id: 'gk-o-wc-door', type: 'door', wall: 'front', positionAlongWall: 0.50, widthCm: 65, heightCm: 210, bottomCm: 0 },
      ],
    }),

    // ── Antre (sağ üst, apartman giriş holü) ──
    mkRoom('gk-antre', 'koridor', 150, 300, [2.25, -2.25], 0xc0b090, {
      wallColor: '#ddd8cc',
      removedWalls: ['left', 'front'],  // left=kordor, front=salon
      openings: [
        // Daire girişi — dış duvar (sağ)
        { id: 'gk-o-antre-main', type: 'door', wall: 'right', positionAlongWall: 0.50, widthCm: 100, heightCm: 220, bottomCm: 0 },
      ],
    }),

    // ── Kordor (orta, banyoları ve ebeveyn yatak odasını bağlar) ──
    mkRoom('gk-kordor', 'koridor', 360, 120, [-0.30, -1.35], 0xc4b490, {
      wallColor: '#ddd8cc',
      removedWalls: ['back', 'right', 'front'],  // back=ensüit+WC, right=antre, front=salon
    }),

    // ── Salon (merkez-alt, en büyük oda) ──
    mkRoom('gk-salon', 'salon', 500, 450, [0.40, 1.50], 0x4488ff, {
      removedWalls: ['back'],  // kordor/antre paylaşır
      openings: [
        // Sol duvar: yatak odasına kapı
        { id: 'gk-o-s-yatak', type: 'door', wall: 'left', positionAlongWall: 0.06, widthCm: 90, heightCm: 210, bottomCm: 0 },
        // Sağ duvar: mutfak geçişi (geniş açıklık)
        { id: 'gk-o-s-mutfak', type: 'sliding-door', wall: 'right', positionAlongWall: 0.20, widthCm: 180, heightCm: 220, bottomCm: 0 },
        // Ön duvar: balkon kapısı (french balkon)
        { id: 'gk-o-s-balkon', type: 'french-balcony', wall: 'front', positionAlongWall: 0.73, widthCm: 200, heightCm: 220, bottomCm: 0 },
        // Ön duvar: pencere
        { id: 'gk-o-s-win', type: 'triple-window', wall: 'front', positionAlongWall: 0.22, widthCm: 220, heightCm: 150, bottomCm: 90 },
      ],
    }),

    // ── Mutfak (sağ alt) ──
    mkRoom('gk-mutfak', 'mutfak', 280, 300, [4.30, 0.75], 0xff8844, {
      removedWalls: ['left'],  // salon paylaşır
      openings: [
        { id: 'gk-o-m-win', type: 'window', wall: 'right', positionAlongWall: 0.50, widthCm: 140, heightCm: 140, bottomCm: 90 },
        // Mutfak → balkon (yoksa daire girişinin altında küçük pencere olabilir)
        { id: 'gk-o-m-back', type: 'window', wall: 'back', positionAlongWall: 0.50, widthCm: 120, heightCm: 120, bottomCm: 90 },
      ],
    }),

    // ── Balkon (salon+mutfak arasında, daireden çıkıntı) ──
    mkRoom('gk-balkon', 'balkon', 250, 100, [1.55, 4.25], 0x88ccaa, {
      removedWalls: ['back'],  // salon ile paylaşılan duvar (french kapı orada)
    }),
  ],
  furniture: [
    // ── Ebeveyn Yatak Odası — bbox x[-5.70,-2.10] z[-3.75,0.25] ──
    mkFurn('gk-f-ey1', 'bed',        [-3.90, -2.70], { length: 200, width: 180 },           'gk-eyatak', 0,  'tufted'),
    mkFurn('gk-f-ey2', 'wardrobe',   [-2.40, -1.50], { width: 200, depth: 55 },             'gk-eyatak', -Math.PI/2, 'sliding'),
    mkFurn('gk-f-ey3', 'shelf',      [-4.80, -3.50], { width: 45, height: 55 },             'gk-eyatak', 0,  'cube'),
    mkFurn('gk-f-ey4', 'shelf',      [-3.00, -3.50], { width: 45, height: 55 },             'gk-eyatak', 0,  'cube'),
    mkFurn('gk-f-ey5', 'ceilinglamp',[-3.90, -1.75], { diameter: 55 },                      'gk-eyatak', 0,  'pendant'),
    mkFurn('gk-f-ey6', 'desk',       [-5.40, -0.30], { length: 110, depth: 55 },            'gk-eyatak', Math.PI/2, 'classic'),

    // ── Yatak Odası — bbox x[-5.70,-2.40] z[0.25,3.25] ──
    mkFurn('gk-f-y1',  'bed',        [-4.05, 0.80], { length: 200, width: 140 },            'gk-yatak',  0,  'modern'),
    mkFurn('gk-f-y2',  'wardrobe',   [-2.80, 1.75], { width: 180, depth: 55 },              'gk-yatak',  -Math.PI/2, 'classic'),
    mkFurn('gk-f-y3',  'desk',       [-5.30, 2.70], { length: 100, depth: 55 },             'gk-yatak',  Math.PI/2, 'drawer'),
    mkFurn('gk-f-y4',  'ceilinglamp',[-4.05, 1.75], { diameter: 45 },                       'gk-yatak',  0,  'panel'),

    // ── Salon — bbox x[-2.10,2.90] z[-0.75,3.75] ──
    mkFurn('gk-f-s1',  'lsofa',      [ 0.40,  0.40], { length: 310, width: 220, depth: 95 }, 'gk-salon', 0,  'modern'),
    mkFurn('gk-f-s2',  'ctable',     [ 0.40,  1.60], { diameter: 110 },                     'gk-salon', 0,  'round'),
    mkFurn('gk-f-s3',  'tvunit',     [ 0.40,  3.30], { length: 240 },                       'gk-salon', Math.PI,  'floating'),
    mkFurn('gk-f-s4',  'rug',        [ 0.40,  1.50], { length: 300, width: 200 },           'gk-salon'),
    mkFurn('gk-f-s5',  'ceilinglamp',[ 0.40,  1.50], { diameter: 60 },                      'gk-salon', 0,  'chandelier'),
    mkFurn('gk-f-s6',  'plant',      [ 2.60,  0.00], { diameter: 55 },                      'gk-salon', 0,  'tall'),
    mkFurn('gk-f-s7',  'floorlamp',  [-1.80, -0.30], {},                                    'gk-salon', 0,  'arc'),

    // ── Mutfak — bbox x[2.90,5.70] z[-0.75,2.25] ──
    mkFurn('gk-f-m1',  'counter',    [ 4.30, -0.40], { length: 240, depth: 60 },            'gk-mutfak', 0),
    mkFurn('gk-f-m2',  'kitchencab', [ 3.30, -0.35], { width: 60, depth: 35 },              'gk-mutfak', 0),
    mkFurn('gk-f-m3',  'kitchencab', [ 5.20, -0.35], { width: 60, depth: 35 },              'gk-mutfak', 0),
    mkFurn('gk-f-m4',  'fridge',     [ 5.20,  0.80], { width: 70, depth: 65 },              'gk-mutfak', -Math.PI/2, 'classic'),
    mkFurn('gk-f-m5',  'ankastre',   [ 4.30, -0.40], { width: 60 },                         'gk-mutfak', 0),
    mkFurn('gk-f-m6',  'dtable',     [ 3.80,  1.70], { length: 100, width: 70 },            'gk-mutfak', 0,  'classic'),
    mkFurn('gk-f-m7',  'dchair',     [ 3.30,  1.70], {},                                    'gk-mutfak', Math.PI/2,  'classic'),
    mkFurn('gk-f-m8',  'dchair',     [ 4.30,  1.70], {},                                    'gk-mutfak', -Math.PI/2, 'classic'),

    // ── Ensüit — bbox x[-2.10,0.30] z[-3.75,-1.95] ──
    mkFurn('gk-f-en1', 'shower',     [-1.70, -3.30], { width: 80, depth: 80 },              'gk-ensuit', 0,  'corner'),
    mkFurn('gk-f-en2', 'toilet',     [-1.80, -2.35], { depth: 60 },                         'gk-ensuit', -Math.PI/2, 'classic'),
    mkFurn('gk-f-en3', 'sink',       [-0.30, -3.55], { width: 55 },                         'gk-ensuit', 0,  'square'),
    mkFurn('gk-f-en4', 'washer',     [ 0.00, -2.30], {},                                    'gk-ensuit', 0),

    // ── WC — bbox x[0.30,1.50] z[-3.75,-1.95] ──
    mkFurn('gk-f-wc1', 'toilet',     [ 0.55, -3.30], { depth: 60 },                         'gk-wc', 0,  'classic'),
    mkFurn('gk-f-wc2', 'sink',       [ 1.30, -2.40], { width: 40 },                         'gk-wc', -Math.PI/2, 'round'),

    // ── Antre — bbox x[1.50,3.00] z[-3.75,-0.75] ──
    mkFurn('gk-f-a1',  'bench',     [ 1.70, -3.50], { length: 90, depth: 35 },              'gk-antre', 0),
    mkFurn('gk-f-a2',  'mirror',    [ 1.60, -1.50], { width: 50, height: 160 },             'gk-antre', Math.PI/2, 'rectangle'),
    mkFurn('gk-f-a3',  'shelf',     [ 2.80, -3.50], { width: 40, height: 160 },             'gk-antre', 0, 'cube'),

    // ── Balkon — bbox x[0.30,2.80] z[3.75,4.75] ──
    mkFurn('gk-f-b1',  'plant',      [ 0.80,  4.25], { diameter: 50 },                      'gk-balkon', 0,  'tall'),
    mkFurn('gk-f-b2',  'plant',      [ 2.30,  4.25], { diameter: 50 },                      'gk-balkon', 0,  'tall'),
  ],
}

// ═══════════════════════════════════════════════════════════════════
//  LADEN HOUSE A BLOK DAİRE 76 — 3+1 (102.50 m² brüt)
//
//  DETAYLI MİMARİ (fotoğraf analizi):
//    - Sol dış cephe: Ebeveyn (tüm yüksekliği kaplar, 20.30 m²)
//    - Ebeveyn üstünde: Yatak3 (9.84) + Yatak2 (11.21) — daha dar
//    - Sağ orta: Salon (27.10 m²) — mutfak altında
//    - Sağ üst: Mutfak (12.47) + Balkon (20.53, L-şekli sağ+üst)
//    - Sağ alt: Antre (12.82) + Banyolar + İşlik
//    - Merkez: L-şekli KORİDOR (yatay banyo üstü + dikey ebeveyn sağı)
//
//  GRİD ÇİZGİLERİ:
//    X: 0 | 1.80 | 3.80 | 5.00 | 6.20 | 7.50 | 10.50 | 13.80
//    Z: 0 | 2.30 | 3.40 | 6.70 | 9.90
//
//  Her oda koridora/antreye KAPI ile açılır — doğrudan oda-oda geçiş yok.
// ═══════════════════════════════════════════════════════════════════
const ladenHouse76: LayoutData = {
  version: VERSION,
  rooms: [
    // ═══ ALT BANT (z=0 → 2.30) — giriş sırası, banyolar+antre ═══
    // EbvBanyo: x[0, 1.80] z[0, 2.30] = 180×230 = 4.14 m²
    mkRoom('lh-ebbanyo', 'banyo', 180, 230, [0.90, 1.15], 0x44cccc, {
      removedWalls: ['front'],  // z=2.30 = koridor-alt back
      openings: [
        { id: 'lh-o-ebb', type: 'door', wall: 'front', positionAlongWall: 0.65, widthCm: 80, heightCm: 210, bottomCm: 0 },
      ],
    }),
    // Banyo: x[1.80, 3.80] z[0, 2.30] = 200×230 = 4.60 m²
    mkRoom('lh-banyo', 'banyo', 200, 230, [2.80, 1.15], 0x44cccc, {
      removedWalls: ['front'],
      openings: [
        { id: 'lh-o-b', type: 'door', wall: 'front', positionAlongWall: 0.30, widthCm: 80, heightCm: 210, bottomCm: 0 },
      ],
    }),
    // İşlik: x[3.80, 5.00] z[0, 2.30] = 120×230 = 2.76 m²
    mkRoom('lh-islik', 'koridor', 120, 230, [4.40, 1.15], 0xb0a890, {
      wallColor: '#ddd8cc',
      removedWalls: ['front'],
      openings: [
        { id: 'lh-o-i', type: 'door', wall: 'front', positionAlongWall: 0.50, widthCm: 80, heightCm: 210, bottomCm: 0 },
      ],
    }),
    // Antre: x[5.00, 10.50] z[0, 2.30] = 550×230 = 12.65 m² ≈ 12.82 ✓
    mkRoom('lh-antre', 'koridor', 550, 230, [7.75, 1.15], 0xc0b090, {
      wallColor: '#ddd8cc',
      openings: [
        { id: 'lh-door-main', type: 'door', wall: 'back', positionAlongWall: 0.85, widthCm: 100, heightCm: 220, bottomCm: 0 },
      ],
    }),

    // ═══ KORİDOR L-ŞEKLİ (z=2.30 → 3.40 yatay, z=3.40 → 6.70 dikey) ═══
    // Koridor-Yatay: banyolar üstü + antre sol üstü
    // x[0, 6.20] z[2.30, 3.40] = 620×110 = 6.82 m²
    mkRoom('lh-koridor-y', 'koridor', 620, 110, [3.10, 2.85], 0xc4b490, {
      wallColor: '#ddd8cc',
      removedWalls: ['back'],  // z=2.30 = banyo/işlik front (kapılar orada)
      openings: [
        // Ebeveyn yatak odasına kapı (front duvar z=3.40, x≈2.00)
        { id: 'lh-ky-eby', type: 'door', wall: 'front', positionAlongWall: 0.25, widthCm: 90, heightCm: 210, bottomCm: 0 },
        // Salon'a geçiş (right duvarı x=6.20, antre üstünde)
        { id: 'lh-ky-ant', type: 'door', wall: 'right', positionAlongWall: 0.50, widthCm: 90, heightCm: 210, bottomCm: 0 },
      ],
    }),

    // Koridor-Dikey: ebeveyn ile yatak odaları arası
    // x[5.00, 6.20] z[3.40, 6.70] = 120×330 = 3.96 m²
    mkRoom('lh-koridor-d', 'koridor', 120, 330, [5.60, 5.05], 0xc4b490, {
      wallColor: '#ddd8cc',
      removedWalls: ['back'],  // z=3.40 = koridor-yatay front (birleşik L)
      openings: [
        // Salon'a sürgülü kapı (right duvar x=6.20)
        { id: 'lh-kd-sal', type: 'sliding-door', wall: 'right', positionAlongWall: 0.50, widthCm: 100, heightCm: 210, bottomCm: 0 },
        // Yatak2 kapısı (front duvar z=6.70, x≈5.60)
        { id: 'lh-kd-y2', type: 'door', wall: 'front', positionAlongWall: 0.50, widthCm: 90, heightCm: 210, bottomCm: 0 },
      ],
    }),

    // ═══ ORTA BANT (z=3.40 → 6.70) ═══
    // Ebeveyn yatak: x[0, 5.00] z[3.40, 6.70] = 500×330 = 16.50 m²
    // (20.30 m² plandaki, ancak koridor ve giyinme alanı çıkarıldığında
    //  net 16.5 m² — duvar kalınlıkları ve koridor payıyla brüt 20'ye yakın)
    mkRoom('lh-ebyatak', 'yatak', 500, 330, [2.50, 5.05], 0x44cc88, {
      removedWalls: ['right'],  // x=5.00 = koridor-dikey left (kapı koridor'da)
      openings: [
        { id: 'lh-o-ey-w', type: 'panoramic', wall: 'back', positionAlongWall: 0.3, widthCm: 180, heightCm: 220, bottomCm: 0 },
      ],
    }),

    // Salon: x[6.20, 10.50] z[2.30, 6.70] = 430×440 = 18.92 m²
    mkRoom('lh-salon', 'salon', 430, 440, [8.35, 4.50], 0x4488ff, {
      removedWalls: ['left'],  // x=6.20 = koridor right (kapılar koridor'da)
      openings: [
        // Balkona sürgülü kapı (right duvar)
        { id: 'lh-o-s-blk', type: 'sliding-door', wall: 'right', positionAlongWall: 0.50, widthCm: 240, heightCm: 220, bottomCm: 0 },
        // Mutfak'a geçiş (front duvar z=6.70)
        { id: 'lh-o-s-mtf', type: 'sliding-door', wall: 'front', positionAlongWall: 0.50, widthCm: 200, heightCm: 210, bottomCm: 0 },
      ],
    }),

    // ═══ ÜST BANT (z=6.70 → 9.90) ═══
    // Yatak 3: x[0, 3.10] z[6.70, 9.90] = 310×320 = 9.92 m² ≈ 9.84 ✓
    mkRoom('lh-yatak3', 'yatak', 310, 320, [1.55, 8.30], 0x44cc88, {
      removedWalls: ['back'],  // z=6.70 = ebeveyn front (yatak3 back'i ebeveyn üstünde)
      openings: [
        { id: 'lh-o-y3d', type: 'door', wall: 'back', positionAlongWall: 0.60, widthCm: 90, heightCm: 210, bottomCm: 0 },
        { id: 'lh-o-y3w', type: 'window', wall: 'front', positionAlongWall: 0.50, widthCm: 160, heightCm: 220, bottomCm: 0 },
      ],
    }),

    // Yatak 2: x[3.10, 6.20] z[6.70, 9.90] = 310×320 = 9.92 m²
    // (11.21 m² plandaki, ama koridor üst kısmını çıkarınca ~10)
    mkRoom('lh-yatak2', 'yatak', 310, 320, [4.65, 8.30], 0x44cc88, {
      removedWalls: ['back'],  // z=6.70 = koridor-d front / ebeveyn front (kapı koridor'da)
      openings: [
        { id: 'lh-o-y2w', type: 'window', wall: 'front', positionAlongWall: 0.50, widthCm: 160, heightCm: 220, bottomCm: 0 },
      ],
    }),

    // Mutfak: x[6.20, 10.50] z[6.70, 9.90] = 430×320 = 13.76 m²
    // (12.47 m² plandaki; duvar kalınlıkları dahil brüt hesap)
    mkRoom('lh-mutfak', 'mutfak', 430, 320, [8.35, 8.30], 0xff8844, {
      removedWalls: ['back'],  // z=6.70 = salon front (kapı salon'da)
      openings: [
        { id: 'lh-o-m-blk', type: 'sliding-door', wall: 'front', positionAlongWall: 0.70, widthCm: 160, heightCm: 220, bottomCm: 0 },
      ],
    }),

    // ═══ BALKON (L-ŞEKLİ ile MODELLENEMİYOR — tek dikdörtgen sağ kenar) ═══
    // x[10.50, 13.80] z[0, 9.90] = 330×990 = 32.67 m²
    // Plandaki balkon 20.53 m² L-şekli ama tek dikdörtgen modellenebiliyor.
    // Boyutu planın içinde kalacak şekilde: 330×620 = 20.46 m² ≈ 20.53 ✓
    mkRoom('lh-balkon', 'balkon', 330, 620, [12.15, 4.30], 0x88ccaa, {
      removedWalls: ['left'],  // x=10.50 = salon/mutfak right
    }),
  ],
  furniture: [
    // ── Salon (18.9 m²) ──
    mkFurn('lh-f1',  'lsofa',   [8.00, 3.50], { length: 230, width: 170, depth: 85 }, 'lh-salon', Math.PI, 'modern'),
    mkFurn('lh-f2',  'ctable',  [8.35, 4.50], { diameter: 80 },                       'lh-salon', 0, 'round'),
    mkFurn('lh-f3',  'tvunit',  [8.35, 6.20], { length: 180 },                        'lh-salon', Math.PI, 'floating'),
    mkFurn('lh-f4',  'rug',     [8.35, 4.20], { length: 190, width: 140 },            'lh-salon'),
    mkFurn('lh-f5',  'dtable',  [7.00, 5.40], { length: 140, width: 80 },             'lh-salon', 0, 'modern'),

    // ── Mutfak (13.76 m²) ──
    mkFurn('lh-f6',  'counter', [8.35, 7.20], { length: 220, depth: 60 },             'lh-mutfak', 0),
    mkFurn('lh-f7',  'fridge',  [6.70, 7.30], { width: 70, depth: 65 },               'lh-mutfak', Math.PI/2, 'french'),
    mkFurn('lh-f8',  'ankastre',[7.00, 7.20], { width: 60 },                          'lh-mutfak', 0),
    mkFurn('lh-f9',  'kitchencab',[9.50, 9.50], { width: 180, depth: 35 },            'lh-mutfak', Math.PI),

    // ── Ebeveyn yatak (16.5 m²) ──
    mkFurn('lh-f10', 'bed',     [2.50, 4.30], { length: 200, width: 160 },            'lh-ebyatak', 0, 'king'),
    mkFurn('lh-f11', 'wardrobe',[1.00, 6.30], { width: 180, depth: 55 },              'lh-ebyatak', Math.PI, 'sliding'),
    mkFurn('lh-f12', 'nightstand',[1.20, 4.30], { width: 45, height: 50 },            'lh-ebyatak'),
    mkFurn('lh-f13', 'nightstand',[3.80, 4.30], { width: 45, height: 50 },            'lh-ebyatak'),

    // ── Yatak 2 (9.9 m²) ──
    mkFurn('lh-f14', 'bed',     [4.65, 7.80], { length: 190, width: 140 },            'lh-yatak2', 0, 'modern'),
    mkFurn('lh-f15', 'wardrobe',[5.60, 9.40], { width: 100, depth: 50 },              'lh-yatak2', Math.PI, 'classic'),

    // ── Yatak 3 (9.9 m²) ──
    mkFurn('lh-f16', 'bed',     [1.55, 7.80], { length: 190, width: 90 },             'lh-yatak3', 0, 'single'),
    mkFurn('lh-f17', 'wardrobe',[2.40, 9.40], { width: 100, depth: 50 },              'lh-yatak3', Math.PI, 'classic'),

    // ── Ebeveyn Banyo (4.14 m²) ──
    mkFurn('lh-f18', 'shower',  [0.50, 0.60], { width: 90, depth: 90 },               'lh-ebbanyo', 0, 'corner'),
    mkFurn('lh-f19', 'toilet',  [1.40, 0.50], { depth: 60 },                          'lh-ebbanyo', 0, 'wall'),
    mkFurn('lh-f20', 'sink',    [0.90, 1.80], { width: 50 },                          'lh-ebbanyo', Math.PI, 'square'),

    // ── Banyo (4.60 m²) ──
    mkFurn('lh-f21', 'bathtub', [2.80, 1.00], { length: 160, width: 70 },             'lh-banyo', Math.PI/2, 'classic'),
    mkFurn('lh-f22', 'toilet',  [2.20, 1.80], { depth: 60 },                          'lh-banyo', Math.PI, 'classic'),
    mkFurn('lh-f23', 'sink',    [3.30, 1.80], { width: 45 },                          'lh-banyo', Math.PI, 'round'),

    // ── Balkon (20.46 m²) ──
    mkFurn('lh-f24', 'garden-table',[12.15, 4.80], { diameter: 90 },                  'lh-balkon', 0, 'round'),
    mkFurn('lh-f25', 'garden-chair',[11.60, 4.00], { diameter: 50 },                  'lh-balkon', 0, 'rattan'),
    mkFurn('lh-f26', 'garden-chair',[12.70, 4.00], { diameter: 50 },                  'lh-balkon', 0, 'rattan'),
    mkFurn('lh-f27', 'plant',      [12.15,  1.40], { diameter: 50 },                   'lh-balkon', 0, 'tall'),
    mkFurn('lh-f28', 'plant',      [12.15,  7.20], { diameter: 45 },                   'lh-balkon', 0, 'classic'),

    // ── Antre (12.65 m²) ──
    mkFurn('lh-f29', 'shelf',   [5.80, 1.15], { width: 90, height: 150 },             'lh-antre', 0, 'classic'),
    mkFurn('lh-f30', 'mirror',  [9.50, 0.40], { width: 70, height: 100 },             'lh-antre', 0, 'rectangle'),
  ],
}

export const PRESETS: Preset[] = [
  {
    id: 'laden-76',
    label: 'Laden House 3+1 (102 m²)',
    description: 'Laden House A Blok Daire 76: geniş salon+balkon, 3 yatak odası (ebeveyn süit), 2 banyo, mutfak, antre. Brüt 102 m².',
    icon: '🏛',
    data: ladenHouse76,
  },
  {
    id: 'gk-2plus1',
    label: 'GK Blok 2+1 (89.86 m²)',
    description: 'Gerçek kat planından: sol sütun E.Yatak + Yatak odaları, orta kordor ile banyolar (Ensüit+WC), antreden giriş, merkez-altta geniş salon (5×4.5), sağda mutfak + balkon. Brüt 89.86 m² / Net 74.33 m².',
    icon: '🏢',
    data: gkTipi2p1,
  },
  {
    id: 'studio',
    label: 'Stüdyo',
    description: 'Tek hacimli stüdyo daire — salon, yatak ve mutfak nişi bir arada. Küçük metrekare için ideal.',
    icon: '🏢',
    data: studio,
  },
  {
    id: '1plus1',
    label: '1+1 Daire',
    description: 'Salon, 1 yatak odası, mutfak ve banyo. Çift veya yalnız yaşayan için klasik kompakt plan.',
    icon: '🏠',
    data: apt1plus1,
  },
  {
    id: '2plus1-kompakt',
    label: '2+1 Kompakt',
    description: 'Salon, ebeveyn odası, çocuk odası, mutfak, banyo ve koridor. Küçük aile için verimli plan.',
    icon: '🏡',
    data: apt2plus1_kompakt,
  },
  {
    id: '2plus1-genis',
    label: '2+1 Geniş',
    description: 'Daha büyük salon ve odalara sahip 2+1 varyant. Yemek masası için ayrı alan, geniş mutfak.',
    icon: '🏡',
    data: apt2plus1_genis,
  },
  {
    id: '3plus1-standart',
    label: '3+1 Standart',
    description: 'Salon, 2 yatak odası, çocuk odası, mutfak, banyo ve koridor. Geniş aile için standart plan.',
    icon: '🏘',
    data: apt3plus1_standart,
  },
  {
    id: '3plus1-genis',
    label: '3+1 Geniş',
    description: 'Büyük salon ve odalara sahip 3+1 lüks varyant. 4 sandalyeli yemek masası, geniş ebeveyn odası.',
    icon: '🏘',
    data: apt3plus1_genis,
  },
  {
    id: 'open-plan',
    label: 'Açık Plan',
    description: 'Salon + yemek + mutfak tek büyük hacim, master yatak ve banyo. Modern minimalist villa.',
    icon: '🏛',
    data: openPlan,
  },
  // ── Stüdyo varyantları (4) ──
  { id: 'studio-minimal', label: 'Stüdyo Minimal', icon: '◻', description: 'Küçük, sade stüdyo — yalnız yaşayan için yeterli mobilya.',                data: studioMinimal },
  { id: 'studio-full',    label: 'Stüdyo Dolgun',   icon: '🏢', description: 'Kompakt ama tam donanımlı — yatak, oturma ve çalışma alanı birlikte.',   data: studioFull },
  { id: 'studio-balkon',  label: 'Stüdyo Balkonlu', icon: '🌿', description: 'Geniş balkon cephesine açılan stüdyo — manzaralı oturma alanı.',         data: studioBalkon },
  { id: 'studio-loft',    label: 'Loft Stüdyo',     icon: '🏭', description: 'Endüstriyel beton zemin, açık mutfak ve yüksek tavan hissi.',           data: studioLoft },
  // ── 1+1 varyantları (6) ──
  { id: '1p1-klasik',      label: '1+1 Klasik',          icon: '🏠', description: 'Koridorsuz klasik 1+1 — salon, yatak, mutfak ve banyo.',                   data: apt1p1Klasik },
  { id: '1p1-modern',      label: '1+1 Modern',          icon: '🏙', description: 'Gri tonlu modern dokunuşlar, L koltuk ve french-door buzdolabı.',          data: apt1p1Modern },
  { id: '1p1-genis-salon', label: '1+1 Geniş Salon',     icon: '🛋', description: 'Büyük oturma alanı, berjer ekli salon odaklı 1+1 plan.',                 data: apt1p1GenisSalon },
  { id: '1p1-koridor',     label: '1+1 Koridorlu',       icon: '🚪', description: 'Odaları koridorla ayrılan geleneksel 1+1 yerleşim.',                      data: apt1p1Koridor },
  { id: '1p1-acik-mutfak', label: '1+1 Açık Mutfak',     icon: '🍳', description: 'Salon ile mutfak tek hacim — ada masa ve yemek alanı bir arada.',         data: apt1p1AcikMutfak },
  { id: '1p1-master',      label: '1+1 Master Yatak',    icon: '🛏', description: 'Yatak odası salonla eşit büyüklükte — ebeveyn konforu öncelikli.',        data: apt1p1Master },
  // ── 2+1 varyantları (8) ──
  { id: '2p1-klasik',      label: '2+1 Klasik Türk',     icon: '🏡', description: 'Geleneksel koridorlu Türk apartman planı, 2 koltuklu oturma grubu.',      data: apt2p1Klasik },
  { id: '2p1-modern',      label: '2+1 Modern',          icon: '🏙', description: 'Gri duvar tonları, L koltuk, scandi sandalyeler ve french-door buzdolabı.', data: apt2p1Modern },
  { id: '2p1-ebanyolu',    label: '2+1 Ebeveyn Banyolu', icon: '🚿', description: 'Ebeveyn yatağının yanına eklenmiş özel banyo — master süit hissi.',        data: apt2p1Ebanyolu },
  { id: '2p1-zemin',       label: '2+1 Zemin Kat Bahçeli', icon: '🌳', description: 'Zemin katta geniş bahçeli 2+1 — oturma takımıyla dış alan.',            data: apt2p1Zemin },
  { id: '2p1-teras',       label: '2+1 Teraslı',         icon: '🌇', description: 'Salonun önünde uzun teras — açık hava oturma grubu ve bitkiler.',         data: apt2p1Teras },
  { id: '2p1-iki-balkon',  label: '2+1 İki Balkonlu',    icon: '🌤', description: 'Hem salon hem mutfak tarafında balkonlu 2+1 — iki farklı manzara.',       data: apt2p1IkiBalkon },
  { id: '2p1-lplan',       label: '2+1 L-Plan',          icon: '📐', description: '2 yatak aynı cephede L dizilim — koridor pay dışı ergonomik plan.',       data: apt2p1LPlan },
  { id: '2p1-cocuk',       label: '2+1 Çocuk Öncelikli', icon: '🎮', description: 'Geniş çocuk odası, oyun halısı ve çalışma masasıyla aile planı.',        data: apt2p1Cocuk },
  // ── 3+1 yeni varyantlar (6) — mevcut 2 ile toplam 8 ──
  { id: '3p1-gelenek',     label: '3+1 Geleneksel',      icon: '🏛', description: 'Ayrı salon + yemek odası, Türk tarzı 2 koltuklu oturma grubu.',         data: apt3p1Gelenek },
  { id: '3p1-acik-mutfak', label: '3+1 Açık Mutfak',     icon: '🍽', description: 'Salon, yemek alanı ve mutfak tek mega hacim — L koltuk odaklı.',       data: apt3p1AcikMutfak },
  { id: '3p1-iki-banyo',   label: '3+1 İki Banyolu',     icon: '🚿', description: '2 ayrı banyo — biri ebeveyne yakın, diğeri girişte misafir banyosu.',  data: apt3p1IkiBanyo },
  { id: '3p1-suit',        label: '3+1 Ebeveyn Süiti',   icon: '👑', description: 'Yatak + giyinme odası + özel banyo ebeveyn süiti bloğu.',              data: apt3p1Suit },
  { id: '3p1-uplan',       label: '3+1 U-Plan',          icon: '⊔',  description: 'Salon merkezde, yatak odaları iki yanda — simetrik U dizilim.',        data: apt3p1UPlan },
  { id: '3p1-ofis',        label: '3+1 Ofis Odalı',      icon: '💻', description: 'Home-office için ayrılmış çalışma odası, kütüphane raflarıyla.',       data: apt3p1OfisOdali },
]
