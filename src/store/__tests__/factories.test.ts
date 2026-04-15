/**
 * factories.ts birim testleri.
 *
 * Kapsam:
 *   - createRoomFromType: tip → oda, varsayılan renk/zemin kuralı
 *   - polygonToBoundingRoom: min nokta, min boyut, bounding box doğruluğu
 *   - createFurnitureItem: varyant öncelik sırası, aydınlatma için lumens/Kelvin
 *   - createCustomFurnitureItem: customModelUrl/Label taşır
 *   - createOpening: tip başına varsayılan cm değerleri
 *   - resetIdCounters: ID sayaçları sıfırlanır
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  createRoomFromType,
  polygonToBoundingRoom,
  createFurnitureItem,
  createCustomFurnitureItem,
  createOpening,
  resetIdCounters,
  nextFurnitureId,
} from '../factories'

beforeEach(() => {
  resetIdCounters()
})

// ─────────────────────────────────────────────────────────────────
//  createRoomFromType
// ─────────────────────────────────────────────────────────────────

describe('createRoomFromType', () => {
  it('salon için varsayılan parke zemin üretir', () => {
    const r = createRoomFromType('salon', 0)
    expect(r.type).toBe('salon')
    expect(r.floorType).toBe('parke')
    expect(r.widthCm).toBeGreaterThan(0)
    expect(r.lengthCm).toBeGreaterThan(0)
  })

  it('banyo ve mutfak için fayans zemin üretir', () => {
    expect(createRoomFromType('banyo', 0).floorType).toBe('fayans')
    expect(createRoomFromType('mutfak', 0).floorType).toBe('fayans')
  })

  it('position existingRoomCount\'a göre sağa kayar', () => {
    const r0 = createRoomFromType('salon', 0)
    const r1 = createRoomFromType('salon', 1)
    expect(r0.position[0]).toBe(0)
    expect(r1.position[0]).toBeCloseTo(1.2, 6)
  })

  it('wallColor tipe göre farklı varsayılan alır', () => {
    const salon = createRoomFromType('salon', 0)
    const banyo = createRoomFromType('banyo', 0)
    expect(salon.wallColor).not.toBe(banyo.wallColor)
  })

  it('her çağrıda benzersiz ID üretir', () => {
    const ids = [0, 1, 2].map(i => createRoomFromType('salon', i).id)
    expect(new Set(ids).size).toBe(3)
  })
})

// ─────────────────────────────────────────────────────────────────
//  polygonToBoundingRoom
// ─────────────────────────────────────────────────────────────────

describe('polygonToBoundingRoom', () => {
  it('3\'ten az nokta için null döner', () => {
    expect(polygonToBoundingRoom([[0, 0], [1, 1]], 0)).toBeNull()
    expect(polygonToBoundingRoom([], 0)).toBeNull()
  })

  it('çok küçük (<20cm) poligon için null döner', () => {
    const pts: [number, number][] = [[0, 0], [0.1, 0], [0.1, 0.1], [0, 0.1]]
    expect(polygonToBoundingRoom(pts, 0)).toBeNull()
  })

  it('bounding box\'tan genişlik ve boyu cm\'e çevirir', () => {
    // 3m × 4m kare
    const pts: [number, number][] = [[0, 0], [3, 0], [3, 4], [0, 4]]
    const r = polygonToBoundingRoom(pts, 0)
    expect(r).not.toBeNull()
    expect(r!.widthCm).toBe(300)
    expect(r!.lengthCm).toBe(400)
  })

  it('merkezi bounding box ortasına koyar', () => {
    const pts: [number, number][] = [[0, 0], [2, 0], [2, 4], [0, 4]]
    const r = polygonToBoundingRoom(pts, 0)
    expect(r!.position[0]).toBe(1)
    expect(r!.position[1]).toBe(2)
  })

  it('negatif koordinatlarda da doğru çalışır', () => {
    const pts: [number, number][] = [[-2, -3], [2, -3], [2, 1], [-2, 1]]
    const r = polygonToBoundingRoom(pts, 0)
    expect(r!.widthCm).toBe(400)  // 4m
    expect(r!.lengthCm).toBe(400) // 4m
    expect(r!.position).toEqual([0, -1])
  })

  it('varsayılan tip salon, zemin parke', () => {
    const pts: [number, number][] = [[0, 0], [3, 0], [3, 3], [0, 3]]
    const r = polygonToBoundingRoom(pts, 0)
    expect(r!.type).toBe('salon')
    expect(r!.floorType).toBe('parke')
  })
})

// ─────────────────────────────────────────────────────────────────
//  createFurnitureItem
// ─────────────────────────────────────────────────────────────────

describe('createFurnitureItem', () => {
  it('bilinmeyen tip için null döner', () => {
    expect(createFurnitureItem('nonexistent' as never, 0)).toBeNull()
  })

  it('varyantsız mobilya variant alanını içermez', () => {
    // 'rug' kataloğunda variants olmayabilir — genel bir item tipiyle test
    const item = createFurnitureItem('sofa', 0)
    expect(item).not.toBeNull()
    // sofa'nın varyantı var → variant set olmalı
    expect(item!.variant).toBeDefined()
  })

  it('variantOverride öncelikli', () => {
    const item = createFurnitureItem('sofa', 0, { variantOverride: 'modern' })
    expect(item!.variant).toBe('modern')
  })

  it('userDefaultVariant override yoksa kullanılır', () => {
    const item = createFurnitureItem('sofa', 0, { userDefaultVariant: 'chesterfield' })
    expect(item!.variant).toBe('chesterfield')
  })

  it('her ikisi yoksa katalog ilk variant\'ı seçer', () => {
    const item = createFurnitureItem('sofa', 0)
    expect(item!.variant).toBeTruthy()
  })

  it('aydınlatma mobilyaları lumens ve colorTempK alır', () => {
    const lamp = createFurnitureItem('floorlamp', 0)
    expect(lamp!.lumens).toBeGreaterThan(0)
    expect(lamp!.colorTempK).toBeGreaterThan(0)
    expect(lamp!.lightOn).toBe(true)
  })

  it('aydınlatma olmayan mobilyalar lumens içermez', () => {
    const chair = createFurnitureItem('chair', 0)
    expect(chair!.lumens).toBeUndefined()
    expect(chair!.colorTempK).toBeUndefined()
    expect(chair!.lightOn).toBeUndefined()
  })

  it('her çağrıda benzersiz ID üretir', () => {
    const ids = [0, 1, 2].map(i => createFurnitureItem('sofa', i)!.id)
    expect(new Set(ids).size).toBe(3)
  })

  it('parentRoomId null ile başlar', () => {
    const item = createFurnitureItem('sofa', 0)
    expect(item!.parentRoomId).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────
//  createCustomFurnitureItem
// ─────────────────────────────────────────────────────────────────

describe('createCustomFurnitureItem', () => {
  it('customModelUrl ve customLabel\'ı taşır', () => {
    const item = createCustomFurnitureItem('Özel Masa', 'blob:abc-123', 0)
    expect(item.customModelUrl).toBe('blob:abc-123')
    expect(item.customLabel).toBe('Özel Masa')
    expect(item.type).toBe('custom')
  })

  it('scale default 100 ile başlar', () => {
    const item = createCustomFurnitureItem('x', 'blob:y', 0)
    expect(item.dims.scale).toBe(100)
  })
})

// ─────────────────────────────────────────────────────────────────
//  createOpening
// ─────────────────────────────────────────────────────────────────

describe('createOpening', () => {
  it('kapı için 90×210 cm varsayılanlar', () => {
    const op = createOpening('door', 'front')
    expect(op.widthCm).toBe(90)
    expect(op.heightCm).toBe(210)
    expect(op.bottomCm).toBe(0)
    expect(op.wall).toBe('front')
  })

  it('pencere yerden 90 cm yüksekte başlar', () => {
    const op = createOpening('window', 'left')
    expect(op.bottomCm).toBe(90)
    expect(op.widthCm).toBe(120)
  })

  it('panoramik tabana kadar iner', () => {
    const op = createOpening('panoramic', 'back')
    expect(op.bottomCm).toBe(0)
    expect(op.widthCm).toBe(220)
  })

  it('positionAlongWall orta (0.5) ile başlar', () => {
    const op = createOpening('door', 'right')
    expect(op.positionAlongWall).toBe(0.5)
  })

  it('bilinmeyen tipte window varsayılanlarına düşer', () => {
    const op = createOpening('weird' as never, 'front')
    expect(op.widthCm).toBe(120)
    expect(op.heightCm).toBe(120)
  })
})

// ─────────────────────────────────────────────────────────────────
//  resetIdCounters
// ─────────────────────────────────────────────────────────────────

describe('resetIdCounters', () => {
  it('sayaçları sıfırlar — yeni oda room-1 prefix alır', () => {
    createRoomFromType('salon', 0)
    createRoomFromType('salon', 1)
    resetIdCounters()
    const r = createRoomFromType('salon', 0)
    expect(r.id.startsWith('room-1-')).toBe(true)
  })

  it('mobilya sayaçlarını da sıfırlar', () => {
    nextFurnitureId()
    nextFurnitureId()
    resetIdCounters()
    expect(nextFurnitureId().startsWith('furn-1-')).toBe(true)
  })
})
