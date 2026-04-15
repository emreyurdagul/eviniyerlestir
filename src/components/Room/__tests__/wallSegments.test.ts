/**
 * wallSegments.ts birim testleri.
 *
 * Kapsam: açıklık yok, ortada pencere, ortada kapı, uçta açıklık, üst üste
 * birden fazla açıklık. Segment sayısı ve toplam genişlik invaryantları.
 */

import { describe, it, expect } from 'vitest'
import type { WallOpening } from '../../../types'
import { computeWallSegments } from '../wallSegments'

function makeOp(overrides: Partial<WallOpening> = {}): WallOpening {
  return {
    id: overrides.id ?? 'op1',
    type: overrides.type ?? 'window',
    wall: overrides.wall ?? 'front',
    positionAlongWall: overrides.positionAlongWall ?? 0.5,
    widthCm: overrides.widthCm ?? 120,
    heightCm: overrides.heightCm ?? 120,
    bottomCm: overrides.bottomCm ?? 90,
  }
}

// ─────────────────────────────────────────────────────────────────

describe('computeWallSegments', () => {
  it('açıklık yoksa tek segment döner (tam duvar)', () => {
    const segs = computeWallSegments(4, 2.5, [])
    expect(segs).toHaveLength(1)
    expect(segs[0]).toEqual({ x: 0, y: 1.25, width: 4, height: 2.5 })
  })

  it('ortada pencere → 4 segment (sol, üst, alt, sağ)', () => {
    const op = makeOp({ positionAlongWall: 0.5, widthCm: 100, heightCm: 100, bottomCm: 90 })
    const segs = computeWallSegments(4, 2.5, [op])

    // sol tam boy + üst (kiriş) + alt (denizlik) + sağ tam boy
    expect(segs).toHaveLength(4)

    // Sol ve sağ eşit tam boy
    const fullHeight = segs.filter(s => s.height === 2.5)
    expect(fullHeight).toHaveLength(2)
    expect(fullHeight[0].width).toBeCloseTo(1.5, 6)  // (4-1)/2 = 1.5
    expect(fullHeight[1].width).toBeCloseTo(1.5, 6)
  })

  it('yerden başlayan kapı (bottomCm=0) → alt segment üretmez', () => {
    const door = makeOp({ type: 'door', widthCm: 90, heightCm: 210, bottomCm: 0, positionAlongWall: 0.5 })
    const segs = computeWallSegments(4, 2.5, [door])

    // sol + üst kiriş + sağ (alt yok)
    expect(segs).toHaveLength(3)
  })

  it('panoramik (tavana ulaşan) açıklık üst segment üretmez', () => {
    // wallHeight = 2.5, açıklık heightCm=250, bottomCm=0 → üst tam yüksekliğe ulaşır
    const pano = makeOp({ type: 'panoramic', widthCm: 220, heightCm: 250, bottomCm: 0 })
    const segs = computeWallSegments(4, 2.5, [pano])

    // sol + sağ (üst ve alt yok)
    expect(segs).toHaveLength(2)
    segs.forEach(s => expect(s.height).toBe(2.5))
  })

  it('birden fazla açıklık positionAlongWall\'a göre sıralanır', () => {
    // Reverse order input
    const op2 = makeOp({ id: 'op2', positionAlongWall: 0.75, widthCm: 80 })
    const op1 = makeOp({ id: 'op1', positionAlongWall: 0.25, widthCm: 80 })
    const segs = computeWallSegments(4, 2.5, [op2, op1])

    // 2 açıklık ile: sol + 2x (üst+alt) + ara + sağ = 7 segment
    // (açıklıkların bottomCm=90 varsayılan, yüksekliği 120 → üst ve alt var)
    expect(segs.length).toBeGreaterThanOrEqual(6)

    // Sol segment en solda (x negatif)
    const leftmost = segs.reduce((a, b) => a.x < b.x ? a : b)
    expect(leftmost.x).toBeLessThan(0)
  })

  it('sıfır-genişlikli segment üretmez (0.01m eşik)', () => {
    // Açıklık tam duvarın solunda bitiyor → sol segment ~0 olmalı
    const op = makeOp({ positionAlongWall: 0.125, widthCm: 100 })  // sol kenar tam duvarın başı
    const segs = computeWallSegments(4, 2.5, [op])

    segs.forEach(s => expect(s.width).toBeGreaterThan(0))
  })

  it('segment genişliklerinin toplamı duvar uzunluğuna eşit (açıklık alanı hariç)', () => {
    const op = makeOp({ positionAlongWall: 0.5, widthCm: 100, heightCm: 100, bottomCm: 90 })
    const segs = computeWallSegments(4, 2.5, [op])

    // Tam boy segmentlerin toplam genişliği = duvar - açıklık genişliği
    const fullHeight = segs.filter(s => s.height === 2.5)
    const total = fullHeight.reduce((sum, s) => sum + s.width, 0)
    expect(total).toBeCloseTo(3, 6)  // 4m - 1m = 3m
  })
})
