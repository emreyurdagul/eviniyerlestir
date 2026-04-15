/**
 * snap.ts birim testleri.
 *
 * Kapsam: Oda snap, oda çakışma (AABB), mobilya snap, resize snap.
 * Test fixture'ları minimal Room nesneleriyle çalışır.
 */

import { describe, it, expect } from 'vitest'
import type { Room, FurnitureItem } from '../../types'
import {
  snapRoomPosition,
  doRoomsOverlap,
  clampNoOverlap,
  snapFurniturePosition,
  snapResizeDelta,
} from '../snap'

// ─────────────────────────────────────────────────────────────────
//  Fixture yardımcıları
// ─────────────────────────────────────────────────────────────────

function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: overrides.id ?? 'r1',
    type: overrides.type ?? 'salon',
    widthCm: overrides.widthCm ?? 400,   // 2 m half-width
    lengthCm: overrides.lengthCm ?? 600, // 3 m half-length
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

function makeFurniture(overrides: Partial<FurnitureItem> = {}): FurnitureItem {
  return {
    id: overrides.id ?? 'f1',
    type: (overrides.type ?? 'sofa') as FurnitureItem['type'],
    variant: overrides.variant,
    position: overrides.position ?? [0, 0],
    rotation: overrides.rotation ?? 0,
    dims: overrides.dims ?? {},
    color: overrides.color ?? 0x888888,
    parentRoomId: overrides.parentRoomId ?? null,
  }
}

// ─────────────────────────────────────────────────────────────────
//  snapRoomPosition
// ─────────────────────────────────────────────────────────────────

describe('snapRoomPosition', () => {
  it('tek oda varsa (hedef yok) pozisyonu değiştirmez', () => {
    const r = makeRoom({ id: 'a', widthCm: 400, lengthCm: 400 })
    const { x, z } = snapRoomPosition(r, 10, 10, [r])
    expect(x).toBe(10)
    expect(z).toBe(10)
  })

  it('uzak odalar (threshold dışında) snap yapmaz', () => {
    const r1 = makeRoom({ id: 'a', position: [0, 0], widthCm: 400, lengthCm: 400 })
    const r2 = makeRoom({ id: 'b', position: [20, 20], widthCm: 400, lengthCm: 400 })
    const { x, z } = snapRoomPosition(r1, 5, 5, [r1, r2])
    expect(x).toBe(5)
    expect(z).toBe(5)
  })

  it('yakın oda dış yüzleri snap yapar (threshold=0.08 m içinde)', () => {
    // r2 sabit (x=0, hw=2m, WALL_T=0.1 → sağ dış yüz = 2.1)
    // r1 sol dış yüzü 2.1'e snap olsun → r1 merkezi = 2.1 + 2 + 0.1 = 4.2
    const r2 = makeRoom({ id: 'b', position: [0, 0], widthCm: 400, lengthCm: 400 })
    const r1 = makeRoom({ id: 'a', widthCm: 400, lengthCm: 400 })
    // Hedef 4.15 (0.05 m offset) → snap etmeli 4.2'ye
    const { x } = snapRoomPosition(r1, 4.15, 0, [r1, r2])
    expect(x).toBeCloseTo(4.2, 3)
  })

  it('kaldırılmış duvarlar snap dışı tutulur', () => {
    const r2 = makeRoom({ id: 'b', position: [0, 0], widthCm: 400, lengthCm: 400, removedWalls: ['right'] })
    const r1 = makeRoom({ id: 'a', widthCm: 400, lengthCm: 400 })
    // r2'nin sağ duvarı yok → snap hedefi kayıp. r1 serbest.
    const { x } = snapRoomPosition(r1, 4.15, 0, [r1, r2])
    expect(x).toBe(4.15)  // snap yok
  })
})

// ─────────────────────────────────────────────────────────────────
//  doRoomsOverlap
// ─────────────────────────────────────────────────────────────────

describe('doRoomsOverlap', () => {
  it('aynı konumdaki iki oda çakışır', () => {
    const r1 = makeRoom({ id: 'a' })
    const r2 = makeRoom({ id: 'b' })
    expect(doRoomsOverlap(r1, 0, 0, r2)).toBe(true)
  })

  it('uzaktaki odalar çakışmaz', () => {
    const r1 = makeRoom({ id: 'a', widthCm: 200, lengthCm: 200 })
    const r2 = makeRoom({ id: 'b', widthCm: 200, lengthCm: 200, position: [10, 10] })
    expect(doRoomsOverlap(r1, 0, 0, r2)).toBe(false)
  })

  it('bitişik odalar (sıfır kesişme) margin sayesinde çakışma sayılmaz', () => {
    // r1: hw=1m @ x=0 → sağ kenar 1
    // r2: hw=1m @ x=2 → sol kenar 1 (tam bitişik)
    const r1 = makeRoom({ id: 'a', widthCm: 200, lengthCm: 200 })
    const r2 = makeRoom({ id: 'b', widthCm: 200, lengthCm: 200, position: [2, 0] })
    expect(doRoomsOverlap(r1, 0, 0, r2)).toBe(false)
  })

  it('kısmen iç içe geçmiş odalar çakışır', () => {
    const r1 = makeRoom({ id: 'a', widthCm: 200, lengthCm: 200 })
    const r2 = makeRoom({ id: 'b', widthCm: 200, lengthCm: 200, position: [1, 0] })
    expect(doRoomsOverlap(r1, 0, 0, r2)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────
//  clampNoOverlap
// ─────────────────────────────────────────────────────────────────

describe('clampNoOverlap', () => {
  it('çakışma yoksa raw pozisyon aynen döner', () => {
    const r1 = makeRoom({ id: 'a', widthCm: 200, lengthCm: 200, position: [0, 0] })
    const r2 = makeRoom({ id: 'b', widthCm: 200, lengthCm: 200, position: [10, 10] })
    const { x, z } = clampNoOverlap(r1, 5, 5, [r1, r2])
    expect(x).toBe(5)
    expect(z).toBe(5)
  })

  it('hiçbir tek-eksen hareketi işe yaramazsa başlangıçta kalır', () => {
    // Dragged @ (0,0); komşular tam sarılı → hem X-only hem Z-only çakışıyor
    const r1 = makeRoom({ id: 'a', widthCm: 200, lengthCm: 200, position: [0, 0] })
    // raw hedefi ile çakışan ve X-only / Z-only pozisyonlarıyla da çakışan komşular
    const blockX = makeRoom({ id: 'bX', widthCm: 200, lengthCm: 200, position: [5, 0] })
    const blockZ = makeRoom({ id: 'bZ', widthCm: 200, lengthCm: 200, position: [0, 5] })
    const blockRaw = makeRoom({ id: 'bR', widthCm: 200, lengthCm: 200, position: [5, 5] })
    const out = clampNoOverlap(r1, 5, 5, [r1, blockX, blockZ, blockRaw])
    expect(out.x).toBe(0)
    expect(out.z).toBe(0)
  })

  it('tek eksende çakışma çözülürse o pozisyon seçilir', () => {
    // r1 başlangıç (0,0), r2 @ (5,5); raw = (5, 0) → X çakışabilir ama Z ayrılınca serbest
    const r1 = makeRoom({ id: 'a', widthCm: 200, lengthCm: 200, position: [0, 0] })
    const r2 = makeRoom({ id: 'b', widthCm: 200, lengthCm: 200, position: [0, 0.5] })
    // raw çakışır; sadece Z hareketi ile çözüm mümkünse onu döner
    const out = clampNoOverlap(r1, 0, 5, [r1, r2])
    expect(out.z).toBe(5)
  })
})

// ─────────────────────────────────────────────────────────────────
//  snapFurniturePosition
// ─────────────────────────────────────────────────────────────────

describe('snapFurniturePosition', () => {
  it('oda yoksa pozisyonu değiştirmez', () => {
    const { x, z } = snapFurniturePosition(1.5, 2.5, [], [], 'f1', 0.3, 0.3)
    expect(x).toBe(1.5)
    expect(z).toBe(2.5)
  })

  it('mobilya sol kenarını oda sol duvarına snap yapar', () => {
    // Oda merkez (0,0), hw=2m → iç sol duvar x=-2
    // Mobilya halfW=0.3, hedef x=-1.65 → sol kenar=-1.95, iç duvara dist=0.05 m → snap
    const room = makeRoom({ id: 'r', widthCm: 400, lengthCm: 400, position: [0, 0] })
    const { x } = snapFurniturePosition(-1.65, 0, [room], [], 'f1', 0.3, 0.3)
    // sol kenar -2'ye hizalanmalı → x = -2 + 0.3 = -1.7
    expect(x).toBeCloseTo(-1.7, 3)
  })

  it('mobilya merkezi oda merkezine snap yapar', () => {
    const room = makeRoom({ id: 'r', widthCm: 400, lengthCm: 400, position: [0, 0] })
    // Hedef (0.05, 0.05) → threshold içinde → merkeze snap
    const { x, z } = snapFurniturePosition(0.05, 0.05, [room], [], 'f1', 0.3, 0.3)
    expect(x).toBe(0)
    expect(z).toBe(0)
  })

  it('kaldırılmış duvara snap yapmaz', () => {
    // Sol duvar kaldırılmış → iç sol duvar snap hedefi değil. Oda merkez=0 snap'i hala var ama uzak.
    const room = makeRoom({ id: 'r', widthCm: 400, lengthCm: 400, position: [0, 0], removedWalls: ['left'] })
    const { x } = snapFurniturePosition(-1.65, 0, [room], [], 'f1', 0.3, 0.3)
    // Sol duvar snap iptal, merkez (0) çok uzak (>0.18) → raw korunur
    expect(x).toBe(-1.65)
  })

  it('selfId kendi kendine snap yapmaz', () => {
    const f1 = makeFurniture({ id: 'f1', position: [1, 1] })
    // Hedef çok yakın kendi eski pozisyonuna ama kendi id'si — snap yok
    const { x, z } = snapFurniturePosition(1.05, 1.05, [], [f1], 'f1')
    expect(x).toBe(1.05)
    expect(z).toBe(1.05)
  })

  it('farklı mobilyaya merkez-merkez hizalama yapar', () => {
    const f2 = makeFurniture({ id: 'f2', position: [1, 1] })
    // Hedef (1.05, 1.05) → mevcut mobilya merkezine çok yakın → snap
    const { x, z } = snapFurniturePosition(1.05, 1.05, [], [f2], 'f1')
    expect(x).toBeCloseTo(1, 3)
    expect(z).toBeCloseTo(1, 3)
  })
})

// ─────────────────────────────────────────────────────────────────
//  snapResizeDelta
// ─────────────────────────────────────────────────────────────────

describe('snapResizeDelta', () => {
  it('wSign=0 ve lSign=0 → rawDw/rawDl değişmez', () => {
    const { rawDw, rawDl } = snapResizeDelta(0, 0, 400, 400, 50, 60, 0, 0, [], 'self')
    expect(rawDw).toBe(50)
    expect(rawDl).toBe(60)
  })

  it('komşu oda yoksa snap uygulanmaz', () => {
    const { rawDw } = snapResizeDelta(0, 0, 400, 400, 50, 0, 1, 0, [], 'self')
    expect(rawDw).toBe(50)
  })

  it('sağ kenarı komşu odanın sol dış yüzüne snap yapar', () => {
    // Kendisi: merkez (0,0), startW=400cm → hw=2m. wSign=+1 → sağ kenar hareket ediyor.
    // Komşu @ x=5, hw=2m → sol dış yüz = 5 - 2 - 0.1 = 2.9 m
    // Raw genişlik delta 70cm → prospW=470, newCx = 0 + 1*70/200 = 0.35, movEdge=0.35 + 470/200 + 0.1 = 2.8
    // target 2.9'a mesafe 0.1 → threshold 0.15 içinde → snap ✓
    const neighbor = makeRoom({ id: 'n', position: [5, 0], widthCm: 400, lengthCm: 400 })
    const { rawDw } = snapResizeDelta(0, 0, 400, 0 + 400, 70, 0, 1, 0, [neighbor], 'self')
    // snap sonrası sağ kenar 2.9 → newW = (2.9 - 0 + 2 - 0.1) * 100 = 480
    // snapDw = 480 - 400 = 80
    expect(rawDw).toBeCloseTo(80, 1)
  })

  it('snap hedefi yoksa rawDw/rawDl olduğu gibi döner (clamp yapılmaz)', () => {
    // Komşu yok → snap yolu devreye girmez → raw korunur
    const { rawDw } = snapResizeDelta(0, 0, 400, 400, -10000, 0, -1, 0, [], 'self')
    expect(rawDw).toBe(-10000)

    const { rawDw: big } = snapResizeDelta(0, 0, 400, 400, 100000, 0, 1, 0, [], 'self')
    expect(big).toBe(100000)
  })

  it('snap yolunda MIN_DIM_CM / MAX_DIM_CM sınırlarına clamp uygulanır', () => {
    // Komşunun sol dış yüzü 2.9 m; rawDw aşırı büyükse MAX_DIM_CM (5000) clamp devrede
    const neighbor = makeRoom({ id: 'n', position: [5, 0], widthCm: 400, lengthCm: 400 })
    // Büyük bir raw ile başla — snap hedefi yakın (movEdge snap threshold'a girmeli)
    const { rawDw } = snapResizeDelta(0, 0, 400, 400, 70, 0, 1, 0, [neighbor], 'self')
    // Snap sonrası prospW 480, MAX_DIM_CM (5000) sınırının altında — clamp aktif değil
    expect(rawDw).toBeCloseTo(80, 1)
    // snap sonrası sonuçlanan yeni genişlik startWCm + rawDw aralıkta
    expect(400 + rawDw).toBeGreaterThanOrEqual(20)
    expect(400 + rawDw).toBeLessThanOrEqual(5000)
  })

  it('komşu odanın kaldırılmış duvarına snap yapmaz', () => {
    // Komşunun sol duvarı kaldırılmış → snap hedefi o yüzde yok
    // Ama sağ duvarı hala candidate (ocx + ohw + WALL_T = 7.1)
    // movEdge 2.8 → 7.1'e mesafe 4.3 → threshold dışı → snap yok
    const neighbor = makeRoom({
      id: 'n', position: [5, 0], widthCm: 400, lengthCm: 400,
      removedWalls: ['left'],
    })
    const { rawDw } = snapResizeDelta(0, 0, 400, 400, 70, 0, 1, 0, [neighbor], 'self')
    expect(rawDw).toBe(70)  // snap yok
  })
})
