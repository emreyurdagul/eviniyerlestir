import type { LayoutData, Room, FurnitureItem } from '../types'

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
    mkFurn('p1-f3', 'tvunit',   [-1.5, -1.6], { length: 180 },            'p1-salon', Math.PI,        'classic'),
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
    mkFurn('p2-f3',  'tvunit',      [ 1.50, -2.00], { length: 200 },            'p2-salon', Math.PI,        'classic'),
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
    mkFurn('p3k-f3',  'tvunit',     [ 2.50, -2.10], { length: 200 },                       'p3k-salon', Math.PI,        'classic'),
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
    mkFurn('p3g-f3',  'tvunit',     [ 2.70, -2.30], { length: 220 },                        'p3g-salon', Math.PI,       'floating'),
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
    mkFurn('p4s-f3',  'tvunit',     [ 2.50, -2.20], { length: 220 },                       'p4s-salon', Math.PI,        'floating'),
    mkFurn('p4s-f4',  'chair',      [ 4.50,  0.40], { diameter: 100 },                     'p4s-salon', -Math.PI/4,     'accent'),
    mkFurn('p4s-f5',  'rug',        [ 2.50,  0.30], { length: 280, width: 200 },           'p4s-salon'),
    mkFurn('p4s-f6',  'ceilinglamp',[ 2.50,  0.00], { diameter: 60 },                     'p4s-salon', 0,              'chandelier'),
    mkFurn('p4s-f7',  'plant',      [ 4.60,  2.30], { diameter: 60 },                     'p4s-salon', 0,              'tall'),
    // Yatak1 (ebeveyn) — bbox x[-5.0,-1.4] z[-2.7,1.1]
    mkFurn('p4s-f8',  'bed',        [-3.20, -0.40], { length: 200, width: 180 },           'p4s-yatak1', 0,             'tufted'),
    mkFurn('p4s-f9',  'wardrobe',   [-4.50,  0.60], { width: 200, depth: 60 },             'p4s-yatak1', 0,             'sliding'),
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
    mkFurn('p4g-f3',  'tvunit',     [ 2.80, -2.50], { length: 240 },                        'p4g-salon', Math.PI,       'floating'),
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
    mkFurn('p5-f3',  'tvunit',   [-0.80, -2.50], { length: 260 },                        'p5-salon', Math.PI,        'floating'),
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

export const PRESETS: Preset[] = [
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
]
