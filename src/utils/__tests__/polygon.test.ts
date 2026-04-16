/**
 * polygon.ts birim testleri.
 *
 * Kapsam:
 *   - computeCentroid: ortalama merkez hesabı
 *   - polygonSignedArea: shoelace imzalı alan (CCW/CW ayrımı)
 *   - ensureCCW: CW girişi tersine çevirir, CCW'yi korur
 *   - getLocalVertices: dikdörtgen için 4 köşe türetme, polygon için CCW
 *   - getWorldVertices: position + rotation uygulaması
 *   - getWorldVerticesAt: geçici merkez ile dünya köşeleri
 *   - doRoomsOverlapPolygon: AABB reddi, SAT hassas test
 *   - getRoomEdges: kenar sayısı, uzunluk, rotY
 */

import { describe, it, expect } from 'vitest'
import {
  computeCentroid,
  polygonSignedArea,
  ensureCCW,
  getLocalVertices,
  getWorldVertices,
  getWorldVerticesAt,
  doRoomsOverlapPolygon,
  getRoomEdges,
} from '../polygon'
import type { Room } from '../../types'

// Yardımcı: minimum geçerli dikdörtgen oda üretir
function makeRect(x: number, z: number, wCm: number, lCm: number): Room {
  return {
    id: 'r-test',
    type: 'salon',
    widthCm: wCm,
    lengthCm: lCm,
    position: [x, z],
    rotation: 0,
    color: 0,
    wallColor: '#fff',
    wallColorOuter: '#ccc',
    floorType: 'parke',
    openings: [],
    removedWalls: [],
  }
}

// Yardımcı: polygon oda üretir (CCW sıralı yerel köşeler)
function makePoly(x: number, z: number, verts: [number, number][]): Room {
  return {
    ...makeRect(x, z, 0, 0),
    shape: 'polygon',
    vertices: verts,
    // bbox approximate için; test içinde override edilebilir
    widthCm: 400,
    lengthCm: 400,
  }
}

// ─────────────────────────────────────────────────────────────────
//  computeCentroid
// ─────────────────────────────────────────────────────────────────

describe('computeCentroid', () => {
  it('kare için merkezi doğru hesaplar', () => {
    const pts: [number, number][] = [[0, 0], [2, 0], [2, 2], [0, 2]]
    const [cx, cz] = computeCentroid(pts)
    expect(cx).toBeCloseTo(1)
    expect(cz).toBeCloseTo(1)
  })

  it('tek nokta kendi merkezi', () => {
    const [cx, cz] = computeCentroid([[3, 7]])
    expect(cx).toBe(3)
    expect(cz).toBe(7)
  })

  it('boş dizi (0,0) döner', () => {
    const [cx, cz] = computeCentroid([])
    expect(cx).toBe(0)
    expect(cz).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────
//  polygonSignedArea
// ─────────────────────────────────────────────────────────────────

describe('polygonSignedArea', () => {
  it('CCW kare için pozitif alan', () => {
    const ccw: [number, number][] = [[0, 0], [2, 0], [2, 2], [0, 2]]
    expect(polygonSignedArea(ccw)).toBeCloseTo(4)
  })

  it('CW kare için negatif alan', () => {
    const cw: [number, number][] = [[0, 0], [0, 2], [2, 2], [2, 0]]
    expect(polygonSignedArea(cw)).toBeCloseTo(-4)
  })

  it('dikdörtgen için doğru alan', () => {
    const pts: [number, number][] = [[0, 0], [3, 0], [3, 2], [0, 2]]
    expect(Math.abs(polygonSignedArea(pts))).toBeCloseTo(6)
  })
})

// ─────────────────────────────────────────────────────────────────
//  ensureCCW
// ─────────────────────────────────────────────────────────────────

describe('ensureCCW', () => {
  it('CCW girişi değiştirmez', () => {
    const ccw: [number, number][] = [[0, 0], [2, 0], [2, 2], [0, 2]]
    const result = ensureCCW(ccw)
    expect(polygonSignedArea(result)).toBeGreaterThan(0)
    // Uzunluk aynı
    expect(result.length).toBe(4)
  })

  it('CW girişi tersine çevirir', () => {
    const cw: [number, number][] = [[0, 0], [0, 2], [2, 2], [2, 0]]
    const result = ensureCCW(cw)
    expect(polygonSignedArea(result)).toBeGreaterThan(0)
  })
})

// ─────────────────────────────────────────────────────────────────
//  getLocalVertices
// ─────────────────────────────────────────────────────────────────

describe('getLocalVertices', () => {
  it('dikdörtgen oda için 4 köşe üretir (CCW)', () => {
    const room = makeRect(0, 0, 200, 300) // 2m × 3m
    const v = getLocalVertices(room)
    expect(v.length).toBe(4)
    // CCW
    expect(polygonSignedArea(v)).toBeGreaterThan(0)
  })

  it('dikdörtgen boyutlarını doğru uygular', () => {
    const room = makeRect(0, 0, 400, 600) // 4m × 6m; hw=2, hl=3
    const v = getLocalVertices(room)
    const xs = v.map(p => p[0])
    const zs = v.map(p => p[1])
    expect(Math.max(...xs)).toBeCloseTo(2)
    expect(Math.min(...xs)).toBeCloseTo(-2)
    expect(Math.max(...zs)).toBeCloseTo(3)
    expect(Math.min(...zs)).toBeCloseTo(-3)
  })

  it('polygon oda için kendi vertices\'ini döner (CCW garantili)', () => {
    const verts: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]]
    const room = makePoly(0, 0, verts)
    const v = getLocalVertices(room)
    expect(v.length).toBe(4)
    expect(polygonSignedArea(v)).toBeGreaterThan(0)
  })
})

// ─────────────────────────────────────────────────────────────────
//  getWorldVertices / getWorldVerticesAt
// ─────────────────────────────────────────────────────────────────

describe('getWorldVertices', () => {
  it('rotasyon 0\'da local = world (position offset hariç)', () => {
    const room = makeRect(5, 3, 200, 200) // merkez (5,3)
    const v = getWorldVertices(room)
    // Merkez (5,3) etrafında 1m radius → dünya köşeleri ortalama (5,3) olmalı
    const meanX = v.reduce((s, p) => s + p[0], 0) / v.length
    const meanZ = v.reduce((s, p) => s + p[1], 0) / v.length
    expect(meanX).toBeCloseTo(5)
    expect(meanZ).toBeCloseTo(3)
  })

  it('90° rotasyon köşeleri doğru döndürür', () => {
    // 4m×2m oda, 90° döndür → 2m×4m olur (X↔Z swap)
    const room: Room = { ...makeRect(0, 0, 400, 200), rotation: Math.PI / 2 }
    const v = getWorldVertices(room)
    const xs = v.map(p => p[0])
    const zs = v.map(p => p[1])
    // Orijinal hw=2, hl=1. Döndürünce X genişliği hl=1, Z genişliği hw=2 olur
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(2) // hl*2=2
    expect(Math.max(...zs) - Math.min(...zs)).toBeCloseTo(4) // hw*2=4
  })
})

describe('getWorldVerticesAt', () => {
  it('farklı merkez konumunda doğru hesaplar', () => {
    const room = makeRect(0, 0, 200, 200) // orijinal (0,0)
    const v = getWorldVerticesAt(room, 10, 5)
    const meanX = v.reduce((s, p) => s + p[0], 0) / v.length
    const meanZ = v.reduce((s, p) => s + p[1], 0) / v.length
    expect(meanX).toBeCloseTo(10)
    expect(meanZ).toBeCloseTo(5)
  })
})

// ─────────────────────────────────────────────────────────────────
//  doRoomsOverlapPolygon
// ─────────────────────────────────────────────────────────────────

describe('doRoomsOverlapPolygon', () => {
  it('uzak dikdörtgenler çakışmaz', () => {
    const r1 = makeRect(0, 0, 200, 200)
    const r2 = makeRect(10, 0, 200, 200)
    expect(doRoomsOverlapPolygon(r1, 0, 0, r2)).toBe(false)
  })

  it('üst üste dikdörtgenler çakışır', () => {
    const r1 = makeRect(0, 0, 400, 400)
    const r2 = makeRect(1, 1, 400, 400)
    expect(doRoomsOverlapPolygon(r1, 0, 0, r2)).toBe(true)
  })

  it('bitişik dikdörtgenler (margin ile) çakışmaz', () => {
    // r1: (-1,0)→(1,0) genişlik 2m; r2: (1,0)→(3,0) bitişik
    const r1 = makeRect(0, 0, 200, 200)  // [-1,1] x [-1,1]
    const r2 = makeRect(2, 0, 200, 200)  // [1,3] x [-1,1] — tam bitişik
    // margin=0.04 ile bitişik odalar çakışmaz (outer edge = outer edge)
    expect(doRoomsOverlapPolygon(r1, 0, 0, r2, 0.04)).toBe(false)
  })

  it('polygon-dikdörtgen çakışması SAT ile doğru saptanır', () => {
    // Polygon: kare (CCW) merkezde
    const polyVerts: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]]
    const poly = { ...makePoly(0, 0, polyVerts), widthCm: 200, lengthCm: 200 }
    const rect = makeRect(0, 0, 200, 200)
    expect(doRoomsOverlapPolygon(poly, 0, 0, rect)).toBe(true)
  })

  it('polygon uzakta dikdörtgenle çakışmaz', () => {
    const polyVerts: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]]
    const poly = { ...makePoly(0, 0, polyVerts), widthCm: 200, lengthCm: 200 }
    const rect = makeRect(10, 10, 200, 200)
    expect(doRoomsOverlapPolygon(poly, 0, 0, rect)).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────
//  getRoomEdges
// ─────────────────────────────────────────────────────────────────

describe('getRoomEdges', () => {
  it('dikdörtgen oda için 4 kenar üretir', () => {
    const room = makeRect(0, 0, 200, 200)
    const edges = getRoomEdges(room)
    expect(edges.length).toBe(4)
  })

  it('her kenarın uzunluğu doğru', () => {
    const room = makeRect(0, 0, 400, 600) // 4m × 6m; hw=2, hl=3
    const edges = getRoomEdges(room)
    const lengths = edges.map(e => e.length).sort((a, b) => a - b)
    // 2 kenar 4m (top/bottom), 2 kenar 6m (left/right)
    expect(lengths[0]).toBeCloseTo(4)
    expect(lengths[1]).toBeCloseTo(4)
    expect(lengths[2]).toBeCloseTo(6)
    expect(lengths[3]).toBeCloseTo(6)
  })

  it('L-şekilli polygon için 6 kenar üretir', () => {
    const lVerts: [number, number][] = [[-2, -2], [2, -2], [2, 0], [0, 0], [0, 2], [-2, 2]]
    const room = makePoly(0, 0, lVerts)
    const edges = getRoomEdges(room)
    expect(edges.length).toBe(6)
  })

  it('rotY kenar yönünü doğru açıyla hesaplar', () => {
    const room = makeRect(0, 0, 200, 200)
    const edges = getRoomEdges(room)
    // Her kenar için: sin(rotY)/cos(rotY) kenarın yönüne uymalı
    for (const edge of edges) {
      const dx = edge.v2[0] - edge.v1[0]
      const dz = edge.v2[1] - edge.v1[1]
      const len = Math.sqrt(dx * dx + dz * dz)
      // rotY = atan2(dx, dz) → sin(rotY)=dx/len, cos(rotY)=dz/len
      expect(Math.sin(edge.rotY)).toBeCloseTo(dx / len, 5)
      expect(Math.cos(edge.rotY)).toBeCloseTo(dz / len, 5)
    }
  })
})
