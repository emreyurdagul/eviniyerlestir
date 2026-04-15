/**
 * transforms.ts birim testleri.
 *
 * Kapsam:
 *   - rotateFurnitureAroundRoom: sadece parentRoomId eşleşen mobilyaları döndürür,
 *     merkezden uzaklığı korur, rotation'a ekler.
 *   - translateFurnitureWithRoom: pin'li mobilyaları aynı dx/dz ile kaydırır,
 *     bağlantısız mobilyalar dokunulmaz.
 */

import { describe, it, expect } from 'vitest'
import type { Room, FurnitureItem } from '../../types'
import { rotateFurnitureAroundRoom, translateFurnitureWithRoom } from '../transforms'

// ─────────────────────────────────────────────────────────────────

function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: overrides.id ?? 'r1',
    type: overrides.type ?? 'salon',
    widthCm: overrides.widthCm ?? 400,
    lengthCm: overrides.lengthCm ?? 600,
    position: overrides.position ?? [0, 0],
    rotation: overrides.rotation ?? 0,
    color: overrides.color ?? 0xffffff,
    wallColor: overrides.wallColor ?? '#e3ddd4',
    wallColorOuter: overrides.wallColorOuter ?? '#c8c0b4',
    floorType: overrides.floorType ?? 'parke',
    openings: overrides.openings ?? [],
    removedWalls: overrides.removedWalls ?? [],
  }
}

function makeFurn(overrides: Partial<FurnitureItem> = {}): FurnitureItem {
  return {
    id: overrides.id ?? 'f1',
    type: overrides.type ?? 'sofa',
    dims: overrides.dims ?? { length: 200, width: 85 },
    position: overrides.position ?? [0, 0],
    rotation: overrides.rotation ?? 0,
    color: overrides.color ?? 0x888888,
    parentRoomId: overrides.parentRoomId ?? null,
  }
}

// ─────────────────────────────────────────────────────────────────
//  rotateFurnitureAroundRoom
// ─────────────────────────────────────────────────────────────────

describe('rotateFurnitureAroundRoom', () => {
  it('pin\'li mobilyayı oda merkezi etrafında döndürür (90°)', () => {
    const room = makeRoom({ id: 'r1', position: [0, 0] })
    const pinned = makeFurn({ id: 'f1', position: [1, 0], parentRoomId: 'r1' })
    const [out] = rotateFurnitureAroundRoom(room, [pinned], Math.PI / 2)

    // 90° dönüş: (1, 0) → (0, 1)
    expect(out.position[0]).toBeCloseTo(0, 6)
    expect(out.position[1]).toBeCloseTo(1, 6)
    // Mobilyanın kendi rotation'ı da dRot kadar artmalı
    expect(out.rotation).toBeCloseTo(Math.PI / 2, 6)
  })

  it('oda merkezi sıfır-dışı olduğunda göreli mesafeyi korur', () => {
    // Oda (2, 3)'te, mobilya odaya göre (1, 0) yani dünyada (3, 3)
    const room = makeRoom({ id: 'r1', position: [2, 3] })
    const pinned = makeFurn({ id: 'f1', position: [3, 3], parentRoomId: 'r1' })
    const [out] = rotateFurnitureAroundRoom(room, [pinned], Math.PI / 2)

    // 90° sonra göreli (0, 1), yani dünyada (2, 4)
    expect(out.position[0]).toBeCloseTo(2, 6)
    expect(out.position[1]).toBeCloseTo(4, 6)
  })

  it('parentRoomId eşleşmeyen mobilyaya dokunmaz', () => {
    const room = makeRoom({ id: 'r1' })
    const other = makeFurn({ id: 'f2', position: [5, 5], rotation: 1, parentRoomId: 'r-other' })
    const [out] = rotateFurnitureAroundRoom(room, [other], Math.PI / 2)

    expect(out.position).toEqual([5, 5])
    expect(out.rotation).toBe(1)
    // Aynı referans da olabilir (saf fonksiyon optimizasyonu)
    expect(out).toBe(other)
  })

  it('parentRoomId null olan bağımsız mobilyayı korur', () => {
    const room = makeRoom({ id: 'r1' })
    const free = makeFurn({ id: 'f3', position: [1, 1], parentRoomId: null })
    const [out] = rotateFurnitureAroundRoom(room, [free], Math.PI)

    expect(out).toBe(free)
  })

  it('boş mobilya dizisiyle boş dizi döner', () => {
    const room = makeRoom({ id: 'r1' })
    expect(rotateFurnitureAroundRoom(room, [], Math.PI / 4)).toEqual([])
  })
})

// ─────────────────────────────────────────────────────────────────
//  translateFurnitureWithRoom
// ─────────────────────────────────────────────────────────────────

describe('translateFurnitureWithRoom', () => {
  it('pin\'li mobilyayı dx/dz kadar kaydırır', () => {
    const pinned = makeFurn({ id: 'f1', position: [1, 2], parentRoomId: 'r1' })
    const [out] = translateFurnitureWithRoom('r1', [pinned], 0.5, -0.3)

    expect(out.position[0]).toBeCloseTo(1.5, 6)
    expect(out.position[1]).toBeCloseTo(1.7, 6)
  })

  it('bağlantısız mobilyaya dokunmaz', () => {
    const free = makeFurn({ id: 'f2', position: [1, 2], parentRoomId: null })
    const [out] = translateFurnitureWithRoom('r1', [free], 5, 5)

    expect(out).toBe(free)
    expect(out.position).toEqual([1, 2])
  })

  it('sadece eşleşen parentRoomId\'ler kayar, diğerleri kalır', () => {
    const list = [
      makeFurn({ id: 'a', position: [0, 0], parentRoomId: 'r1' }),
      makeFurn({ id: 'b', position: [0, 0], parentRoomId: 'r2' }),
      makeFurn({ id: 'c', position: [0, 0], parentRoomId: null }),
    ]
    const out = translateFurnitureWithRoom('r1', list, 1, 1)

    expect(out[0].position).toEqual([1, 1])
    expect(out[1].position).toEqual([0, 0])
    expect(out[2].position).toEqual([0, 0])
  })

  it('rotation değişmez', () => {
    const pinned = makeFurn({ id: 'f1', rotation: 0.5, parentRoomId: 'r1' })
    const [out] = translateFurnitureWithRoom('r1', [pinned], 1, 1)
    expect(out.rotation).toBe(0.5)
  })
})
