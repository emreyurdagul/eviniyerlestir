import { describe, it, expect } from 'vitest'
import { collectSnapTargets, findSmartSnap, findPointSnap } from '../editor-snap'
import type { SnapERoom, SnapVertex } from '../editor-snap'

function makeRoom(id: string, cx: number, cy: number, w: number, h: number, rot = 0): SnapERoom {
  return { id, cx, cy, wCm: w, hCm: h, rot }
}

describe('collectSnapTargets', () => {
  it('tek rect için 6 hedef (3 x-axis + 3 y-axis) üretir', () => {
    const r = makeRoom('a', 100, 200, 400, 300)
    const targets = collectSnapTargets('other', [r], [])
    expect(targets).toHaveLength(6)
    const xs = targets.filter(t => t.axis === 'x').map(t => t.value).sort((a, b) => a - b)
    expect(xs).toEqual([-100, 100, 300])  // left, cx, right
    const ys = targets.filter(t => t.axis === 'y').map(t => t.value).sort((a, b) => a - b)
    expect(ys).toEqual([50, 200, 350])    // top, cy, bottom
  })

  it('excludeId ile oda filtrelenir', () => {
    const r1 = makeRoom('a', 0, 0, 100, 100)
    const r2 = makeRoom('b', 500, 500, 100, 100)
    const targets = collectSnapTargets('a', [r1, r2], [])
    expect(targets.every(t => t.sourceId !== 'a')).toBe(true)
    expect(targets.every(t => t.sourceId === 'b')).toBe(true)
  })

  it('döndürülmüş rect axis-aligned hedef üretmez', () => {
    const r = makeRoom('a', 100, 100, 200, 200, Math.PI / 4)
    const targets = collectSnapTargets('other', [r], [])
    expect(targets).toHaveLength(0)
  })

  it('vertex her eksende bir hedef üretir', () => {
    const v: SnapVertex = { id: 'v1', x: 50, y: 75 }
    const targets = collectSnapTargets('other', [], [v])
    expect(targets).toHaveLength(2)
    expect(targets.find(t => t.axis === 'x')!.value).toBe(50)
    expect(targets.find(t => t.axis === 'y')!.value).toBe(75)
  })
})

describe('findSmartSnap', () => {
  it('threshold içinde hedef yoksa dx=dy=0 ve guides boş', () => {
    const targets = collectSnapTargets('other', [makeRoom('a', 1000, 1000, 100, 100)], [])
    const result = findSmartSnap(
      { left: 0, right: 100, top: 0, bottom: 100, cx: 50, cy: 50 },
      targets, 6,
    )
    expect(result.dx).toBe(0)
    expect(result.dy).toBe(0)
    expect(result.guidesX).toHaveLength(0)
    expect(result.guidesY).toHaveLength(0)
  })

  it('sol kenar soldaki odanın sol kenarına hizalanır', () => {
    const neighbor = makeRoom('n', 100, 300, 200, 200)  // left=0, right=200
    const targets = collectSnapTargets('drag', [neighbor], [])
    // Sürüklenen rect'in left'i 3cm sağda — 6cm threshold içinde snap
    const result = findSmartSnap(
      { left: 3, right: 103, top: 500, bottom: 600, cx: 53, cy: 550 },
      targets, 6,
    )
    expect(result.dx).toBe(-3)  // -3 cm uygulanırsa left=0 olur
    expect(result.guidesX.length).toBeGreaterThanOrEqual(1)
    expect(result.guidesX[0].value).toBe(0)
  })

  it('merkez hizalama center-x hedefine yapışır', () => {
    // Neighbor cx=500, ama kenarları farklı (left=400, right=600).
    // Sürüklenen dar bir rect (genişlik 100) — sadece cx match etsin.
    const neighbor = makeRoom('n', 500, 100, 200, 200)  // cx=500, left=400, right=600
    const targets = collectSnapTargets('drag', [neighbor], [])
    // Sürüklenen rect: cx=502 → left=452, right=552. Kenarlar komşu ile hizalı DEĞİL;
    // sadece center-x 2cm uzakta, dx=-2 bekleniyor.
    const result = findSmartSnap(
      { left: 452, right: 552, top: 800, bottom: 900, cx: 502, cy: 850 },
      targets, 6,
    )
    expect(result.dx).toBe(-2)
  })

  it('X ve Y aynı anda snap olabilir', () => {
    const n = makeRoom('n', 0, 0, 100, 100)  // edges: left=-50, top=-50, cx=0, cy=0
    const targets = collectSnapTargets('drag', [n], [])
    const result = findSmartSnap(
      { left: 2, right: 102, top: 3, bottom: 103, cx: 52, cy: 53 },
      targets, 10,
    )
    // Hem x'te hem y'de snap olmalı; bir edge x'e, bir edge y'ye yapışsın
    expect(result.dx).not.toBe(0)
    expect(result.dy).not.toBe(0)
  })

  it('threshold dışındaki hedefler göz ardı edilir', () => {
    const neighbor = makeRoom('n', 100, 100, 200, 200)  // left=0
    const targets = collectSnapTargets('drag', [neighbor], [])
    // Sürüklenen çok uzakta — 6cm threshold yetmez
    const result = findSmartSnap(
      { left: 20, right: 120, top: 500, bottom: 600, cx: 70, cy: 550 },
      targets, 6,
    )
    expect(result.dx).toBe(0)
    expect(result.guidesX).toHaveLength(0)
  })
})

describe('findPointSnap', () => {
  it('nokta vertex\'e snap eder', () => {
    const targets = collectSnapTargets('other', [], [{ id: 'v1', x: 100, y: 200 }])
    const result = findPointSnap(102, 203, targets, 6)
    expect(result.dx).toBe(-2)
    expect(result.dy).toBe(-3)
  })

  it('threshold dışı → snap yok', () => {
    const targets = collectSnapTargets('other', [], [{ id: 'v1', x: 100, y: 200 }])
    const result = findPointSnap(150, 250, targets, 6)
    expect(result.dx).toBe(0)
    expect(result.dy).toBe(0)
  })
})
