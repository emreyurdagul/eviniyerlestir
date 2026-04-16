/**
 * polygon.ts — Polygon oda sistemi için 2D matematik yardımcıları.
 *
 * Tüm koordinatlar XZ düzleminde (Three.js sahne koordinatı, Y=yukari).
 * Polygon köşeleri:
 *   - yerel uzayda: position merkezine göre (Room.vertices)
 *   - dünya uzayında: position + rotation uygulanmış (getWorldVertices)
 *
 * Dikdörtgen odalar da bu API üzerinden birleşik şekilde işlenebilir;
 * getLocalVertices() dikdörtgen için 4 köşe üretir.
 */

import type { Room } from '../types'

// ── Temel geometri ─────────────────────────────────────────────────────────────

/**
 * Ağırlık merkezi (centroid) — basit ortalama (dışbükey poligonlar için yeterli).
 */
export function computeCentroid(pts: [number, number][]): [number, number] {
  const n = pts.length
  if (n === 0) return [0, 0]
  let sx = 0, sz = 0
  for (const [x, z] of pts) { sx += x; sz += z }
  return [sx / n, sz / n]
}

/**
 * Shoelace formülü ile imzalı alan.
 * Pozitif → CCW (saat yönünün tersi), negatif → CW.
 */
export function polygonSignedArea(pts: [number, number][]): number {
  const n = pts.length
  let area = 0
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += pts[i][0] * pts[j][1]
    area -= pts[j][0] * pts[i][1]
  }
  return area / 2
}

/**
 * Poligonun CCW (saat yönünün tersi) sıralı olmasını garantiler.
 * THREE.Shape CCW beklediğinde bu çıktı doğrudan kullanılabilir.
 */
export function ensureCCW(pts: [number, number][]): [number, number][] {
  return polygonSignedArea(pts) < 0 ? [...pts].reverse() : pts
}

// ── Oda → köşe dönüşümleri ─────────────────────────────────────────────────────

/**
 * Oda için yerel uzay köşeleri döner.
 * - Polygon oda: Room.vertices (CCW garantili hale getirilir)
 * - Dikdörtgen oda: widthCm/lengthCm'den 4 köşe türetilir (CCW)
 */
export function getLocalVertices(room: Room): [number, number][] {
  if (room.shape === 'polygon' && room.vertices && room.vertices.length >= 3) {
    return ensureCCW(room.vertices)
  }
  // Dikdörtgen: CCW sırada 4 köşe
  const hw = room.widthCm / 200
  const hl = room.lengthCm / 200
  return [
    [-hw, -hl],
    [ hw, -hl],
    [ hw,  hl],
    [-hw,  hl],
  ]
}

/**
 * Odanın dünya uzayı köşelerini döner (position + rotation uygulanmış).
 * Hem dikdörtgen hem polygon odalar için çalışır.
 */
export function getWorldVertices(room: Room): [number, number][] {
  const local = getLocalVertices(room)
  const [cx, cz] = room.position
  const cos = Math.cos(room.rotation)
  const sin = Math.sin(room.rotation)
  return local.map(([lx, lz]) => [
    cx + lx * cos - lz * sin,
    cz + lx * sin + lz * cos,
  ])
}

/**
 * Geçici pozisyon ile dünya köşeleri (sürükleme sırasında kullanılır).
 * Rotation değişmez, sadece merkez kayar.
 */
export function getWorldVerticesAt(
  room: Room,
  atX: number,
  atZ: number,
): [number, number][] {
  const temp: Room = { ...room, position: [atX, atZ] }
  return getWorldVertices(temp)
}

// ── Bounding-box (hızlı AABB) ─────────────────────────────────────────────────

export function polygonAABB(pts: [number, number][]): {
  minX: number; maxX: number; minZ: number; maxZ: number
} {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity
  for (const [x, z] of pts) {
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (z < minZ) minZ = z
    if (z > maxZ) maxZ = z
  }
  return { minX, maxX, minZ, maxZ }
}

// ── SAT (Separating Axis Theorem) — dışbükey poligon çakışması ────────────────

/**
 * Poligon kenarlarına dik eksenleri üretir (normalize edilmemiş normal'lar).
 * SAT için tek yönlü eksenleri test etmek yeterli.
 */
function polygonAxes(poly: [number, number][]): [number, number][] {
  const axes: [number, number][] = []
  const n = poly.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const edgeDx = poly[j][0] - poly[i][0]
    const edgeDz = poly[j][1] - poly[i][1]
    // Kenar normali: dik vektör (-dz, dx)
    axes.push([-edgeDz, edgeDx])
  }
  return axes
}

/**
 * Poligonu eksene (nx, nz) yansıtır; [min, max] döner.
 */
function projectPolygon(
  poly: [number, number][],
  nx: number,
  nz: number,
): [number, number] {
  let min = Infinity, max = -Infinity
  for (const [px, pz] of poly) {
    const proj = px * nx + pz * nz
    if (proj < min) min = proj
    if (proj > max) max = proj
  }
  return [min, max]
}

/**
 * SAT ile iki dışbükey poligon arasında çakışma testi.
 * margin: bitişik odalar ayrı sayılsın diye küçük tolerans.
 */
function satConvexOverlap(
  a: [number, number][],
  b: [number, number][],
  margin = 0.04,
): boolean {
  const axes = [...polygonAxes(a), ...polygonAxes(b)]
  for (const [nx, nz] of axes) {
    // Sıfır uzunluklu kenar oluşabilir; atla
    const len = Math.sqrt(nx * nx + nz * nz)
    if (len < 1e-9) continue
    const [minA, maxA] = projectPolygon(a, nx, nz)
    const [minB, maxB] = projectPolygon(b, nx, nz)
    // Ayırıcı eksen bulundu → çakışma yok
    if (maxA - margin <= minB || maxB - margin <= minA) return false
  }
  // Hiçbir ayırıcı eksen yok → çakışıyor
  return true
}

// ── Ana çakışma API'si ─────────────────────────────────────────────────────────

/**
 * İki odanın çakışıp çakışmadığını polygon-aware olarak test eder.
 *
 * Önce AABB hızlı ret, sonra:
 * - Her iki oda da dikdörtgen → AABB sonucu kesin (SAT gerekmez)
 * - En az biri polygon → SAT ile hassas test
 *
 * r1x / r1z: sürüklenen odanın ANLIKTAKI merkezi (gerçek Room.position değil)
 */
export function doRoomsOverlapPolygon(
  r1: Room,
  r1x: number,
  r1z: number,
  r2: Room,
  margin = 0.04,
): boolean {
  // ── Hızlı AABB reddi ────────────────────────────────────────────────────────
  // Bounding-box boyutları (polygon için approximate — factory widthCm/lengthCm'yi bbox'a set eder)
  const r1hw = r1.widthCm / 200
  const r1hl = r1.lengthCm / 200
  const r2hw = r2.widthCm / 200
  const r2hl = r2.lengthCm / 200
  const [r2cx, r2cz] = r2.position

  if (
    r1x - r1hw + margin >= r2cx + r2hw ||
    r1x + r1hw - margin <= r2cx - r2hw ||
    r1z - r1hl + margin >= r2cz + r2hl ||
    r1z + r1hl - margin <= r2cz - r2hl
  ) {
    return false // Kesin çakışma yok
  }

  // ── Her ikisi de dikdörtgen → AABB zaten tam doğru ────────────────────────
  const r1IsRect = !r1.shape || r1.shape === 'rectangle'
  const r2IsRect = !r2.shape || r2.shape === 'rectangle'
  if (r1IsRect && r2IsRect) return true

  // ── En az biri polygon → SAT hassas test ──────────────────────────────────
  const vA = getWorldVerticesAt(r1, r1x, r1z)
  const vB = getWorldVertices(r2)
  return satConvexOverlap(vA, vB, margin)
}

// ── Kenar bilgisi ──────────────────────────────────────────────────────────────

export interface EdgeInfo {
  /** Yerel uzaydaki başlangıç köşesi */
  v1: [number, number]
  /** Yerel uzaydaki bitiş köşesi */
  v2: [number, number]
  /** Kenar uzunluğu (metre) */
  length: number
  /** Kenar orta noktası (yerel uzay) */
  midX: number
  midZ: number
  /**
   * Y ekseni etrafında dönüş açısı (radyan) — BoxGeometry'nin Z eksenini
   * kenar yönüne hizalamak için:
   *   sin(angle) = edgeDx/length
   *   cos(angle) = edgeDz/length
   *   → angle = atan2(edgeDx, edgeDz)
   */
  rotY: number
}

/**
 * Polygon odanın kenarlarını döner (yerel uzay, 3D wall üretimi için).
 * Dikdörtgen odalar için de çalışır (4 kenar).
 */
export function getRoomEdges(room: Room): EdgeInfo[] {
  const verts = getLocalVertices(room)
  const n = verts.length
  const edges: EdgeInfo[] = []
  for (let i = 0; i < n; i++) {
    const v1 = verts[i]
    const v2 = verts[(i + 1) % n]
    const edgeDx = v2[0] - v1[0]
    const edgeDz = v2[1] - v1[1]
    const length = Math.sqrt(edgeDx * edgeDx + edgeDz * edgeDz)
    if (length < 0.01) continue // Çok kısa kenar — atla
    edges.push({
      v1,
      v2,
      length,
      midX: (v1[0] + v2[0]) / 2,
      midZ: (v1[1] + v2[1]) / 2,
      rotY: Math.atan2(edgeDx, edgeDz),
    })
  }
  return edges
}
