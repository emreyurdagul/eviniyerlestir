import type { Room, FurnitureItem } from '../types'
import { MIN_DIM_CM, MAX_DIM_CM } from '../types'
import { WALL_T } from '../constants'
import { doRoomsOverlapPolygon } from './polygon'

const ROOM_SNAP_THRESHOLD = 0.08  // metre — sadece duvarlar neredeyse temas ettiğinde snap
const FURN_SNAP_THRESHOLD = 0.18  // metre — mobilya snap (duvar kenarı vb.)

/**
 * Snap room position: sadece dış yüz → dış yüz (duvarlar flush oturur).
 * İç yüz / merkez hizalama kaldırıldı — çok fazla "sıçrama" yaratıyordu.
 */
export function snapRoomPosition(
  draggedRoom: Room,
  targetX: number,
  targetZ: number,
  allRooms: Room[],
): { x: number; z: number } {
  const wM = draggedRoom.widthCm / 200
  const lM = draggedRoom.lengthCm / 200
  const dRemoved = draggedRoom.removedWalls ?? []

  // Sürüklenen odanın dış yüz konumları (önerilen pozisyonda)
  type OuterEdge = { axis: 'x' | 'z'; value: number }
  const dragOuter: OuterEdge[] = []
  if (!dRemoved.includes('left'))  dragOuter.push({ axis: 'x', value: targetX - wM - WALL_T })
  if (!dRemoved.includes('right')) dragOuter.push({ axis: 'x', value: targetX + wM + WALL_T })
  if (!dRemoved.includes('back'))  dragOuter.push({ axis: 'z', value: targetZ - lM - WALL_T })
  if (!dRemoved.includes('front')) dragOuter.push({ axis: 'z', value: targetZ + lM + WALL_T })

  let bestDx = 0, bestDz = 0
  let bestDistX = ROOM_SNAP_THRESHOLD, bestDistZ = ROOM_SNAP_THRESHOLD

  for (const other of allRooms) {
    if (other.id === draggedRoom.id) continue
    const owM = other.widthCm / 200
    const olM = other.lengthCm / 200
    const [ocx, ocz] = other.position
    const oRemoved = other.removedWalls ?? []

    // Hedef odanın dış yüzleri
    const otherOuter: OuterEdge[] = []
    if (!oRemoved.includes('left'))  otherOuter.push({ axis: 'x', value: ocx - owM - WALL_T })
    if (!oRemoved.includes('right')) otherOuter.push({ axis: 'x', value: ocx + owM + WALL_T })
    if (!oRemoved.includes('back'))  otherOuter.push({ axis: 'z', value: ocz - olM - WALL_T })
    if (!oRemoved.includes('front')) otherOuter.push({ axis: 'z', value: ocz + olM + WALL_T })

    for (const de of dragOuter) {
      for (const oe of otherOuter) {
        if (de.axis !== oe.axis) continue
        const dist = Math.abs(de.value - oe.value)
        if (de.axis === 'x' && dist < bestDistX) {
          bestDistX = dist
          bestDx = oe.value - de.value
        }
        if (de.axis === 'z' && dist < bestDistZ) {
          bestDistZ = dist
          bestDz = oe.value - de.value
        }
      }
    }
  }

  return {
    x: targetX + bestDx,
    z: targetZ + bestDz,
  }
}

// ─────────────────────────────────────────────────────────────────
//  Oda çakışma (AABB overlap) yardımcıları
// ─────────────────────────────────────────────────────────────────

/**
 * r1'in (x,z) konumunda r2 ile çakışıp çakışmadığını döndürür.
 * Polygon odalar için SAT (Separating Axis Theorem) kullanılır;
 * dikdörtgen-dikdörtgen çakışması için hızlı AABB yeterli.
 * margin: bitişik odalar çakışma sayılmasın diye küçük tolerans.
 */
export function doRoomsOverlap(
  r1: Room, r1x: number, r1z: number,
  r2: Room,
  margin = 0.04,
): boolean {
  return doRoomsOverlapPolygon(r1, r1x, r1z, r2, margin)
}

/**
 * Sürüklenen odanın (rawX,rawZ) konumu başka bir odayla çakışıyorsa
 * geçerli en yakın konumu döndürür (önce X, sonra Z, son çare yerinde kal).
 */
export function clampNoOverlap(
  dragged: Room,
  rawX: number,
  rawZ: number,
  allRooms: Room[],
): { x: number; z: number } {
  const others = allRooms.filter(r => r.id !== dragged.id)
  const overlaps = (x: number, z: number) =>
    others.some(r => doRoomsOverlap(dragged, x, z, r))

  if (!overlaps(rawX, rawZ)) return { x: rawX, z: rawZ }

  // Sadece X hareketi dene
  if (!overlaps(rawX, dragged.position[1])) return { x: rawX, z: dragged.position[1] }

  // Sadece Z hareketi dene
  if (!overlaps(dragged.position[0], rawZ)) return { x: dragged.position[0], z: rawZ }

  // Hiçbiri geçerli değil — yerinde kal
  return { x: dragged.position[0], z: dragged.position[1] }
}

/**
 * Snap furniture so its EDGE touches room walls (not center through wall).
 * boundingBox: furniture extents in metres { halfW, halfD } (after rotation handled by caller)
 */
export function snapFurniturePosition(
  targetX: number,
  targetZ: number,
  allRooms: Room[],
  allFurniture: FurnitureItem[],
  selfId: string,
  halfW: number = 0,
  halfD: number = 0,
): { x: number; z: number } {
  let bestDx = 0, bestDz = 0
  let bestDistX = FURN_SNAP_THRESHOLD, bestDistZ = FURN_SNAP_THRESHOLD

  for (const room of allRooms) {
    // BUG-013: walls live in the room's local frame. Snap there and rotate the
    // correction back. Only quarter-turn rooms have walls parallel to the world
    // axes; for any other angle an axis-aligned snap would pull the furniture
    // into the wall, so those rooms are skipped.
    const quarter = Math.round(room.rotation / (Math.PI / 2))
    if (Math.abs(room.rotation - quarter * (Math.PI / 2)) > 0.01) continue
    const cos = Math.round(Math.cos(room.rotation))
    const sin = Math.round(Math.sin(room.rotation))
    const swapped = quarter % 2 !== 0

    const wM = room.widthCm / 200
    const lM = room.lengthCm / 200
    const [cx, cz] = room.position
    const removed = room.removedWalls ?? []

    // World → room-local (inverse of getWorldVertices in polygon.ts)
    const dx = targetX - cx
    const dz = targetZ - cz
    const lx = dx * cos + dz * sin
    const lz = -dx * sin + dz * cos
    const lHalfW = swapped ? halfD : halfW
    const lHalfD = swapped ? halfW : halfD

    // Candidate corrections: [along local X?, correction on that axis, distance]
    const candidates: [boolean, number, number][] = []
    if (!removed.includes('left'))  candidates.push([true,  -wM - (lx - lHalfW), Math.abs((lx - lHalfW) + wM)])
    if (!removed.includes('right')) candidates.push([true,   wM - (lx + lHalfW), Math.abs((lx + lHalfW) - wM)])
    if (!removed.includes('back'))  candidates.push([false, -lM - (lz - lHalfD), Math.abs((lz - lHalfD) + lM)])
    if (!removed.includes('front')) candidates.push([false,  lM - (lz + lHalfD), Math.abs((lz + lHalfD) - lM)])
    // Center alignment within room
    candidates.push([true, -lx, Math.abs(lx)])
    candidates.push([false, -lz, Math.abs(lz)])

    for (const [localX, delta, d] of candidates) {
      // Local → world (same rotation as getWorldVertices). For a quarter turn a
      // local-X correction lands entirely on world X when cos ≠ 0, otherwise on
      // world Z; local Z is the mirror case.
      const wdx = localX ? delta * cos : -delta * sin
      const wdz = localX ? delta * sin : delta * cos
      const onWorldX = localX ? cos !== 0 : sin !== 0
      if (onWorldX) {
        if (d < bestDistX) { bestDistX = d; bestDx = wdx }
      } else if (d < bestDistZ) {
        bestDistZ = d; bestDz = wdz
      }
    }
  }

  // Snap to other furniture (edge-to-edge alignment)
  for (const f of allFurniture) {
    if (f.id === selfId) continue
    // align centers
    const dx = Math.abs(targetX - f.position[0])
    const dz = Math.abs(targetZ - f.position[1])
    if (dx < bestDistX) { bestDistX = dx; bestDx = f.position[0] - targetX }
    if (dz < bestDistZ) { bestDistZ = dz; bestDz = f.position[1] - targetZ }
  }

  return {
    x: targetX + bestDx,
    z: targetZ + bestDz,
  }
}

// ─────────────────────────────────────────────────────────────────
//  Resize snap — moving edge aligns to a nearby room outer face
// ─────────────────────────────────────────────────────────────────

const RESIZE_SNAP_THRESHOLD = 0.15  // 15 cm — sürüklenen kenar bu mesafede snap

/**
 * Resize sırasında aktif kenarı komşu odanın dış yüzüne snap yapar.
 * Döndürülmüş odalar için snap uygulanmaz (karmaşık matematik gereksiz).
 *
 * rawDw / rawDl: genişlik / uzunluk değişimi (cm); pozitif = büyüme.
 * wSign / lSign: hangi tarafın hareket ettiği (+1=sağ/ön, -1=sol/arka, 0=pasif).
 *
 * Dönüş: snap uygulanmış rawDw ve rawDl (cm).
 */
export function snapResizeDelta(
  startCx: number,   // sürükleme başında oda merkezi X (metre)
  startCz: number,   // sürükleme başında oda merkezi Z (metre)
  startWCm: number,  // başlangıç genişliği (cm)
  startLCm: number,  // başlangıç uzunluğu (cm)
  rawDw: number,     // anlık genişlik değişimi (cm)
  rawDl: number,     // anlık uzunluk değişimi (cm)
  wSign: 0 | 1 | -1,
  lSign: 0 | 1 | -1,
  allRooms: Room[],
  selfId: string,
): { rawDw: number; rawDl: number } {
  let snapDw = rawDw
  let snapDl = rawDl

  // ── X ekseni snap (sol/sağ handle) ────────────────────────────
  if (wSign !== 0) {
    const prospW = Math.max(MIN_DIM_CM, Math.min(MAX_DIM_CM, startWCm + rawDw))
    const actualDw = prospW - startWCm
    const newCx   = startCx + wSign * actualDw / 200
    const movEdge = newCx + wSign * (prospW / 200 + WALL_T)

    let bestDist = RESIZE_SNAP_THRESHOLD
    let bestTarget: number | null = null

    for (const r of allRooms) {
      if (r.id === selfId) continue
      const ohw = r.widthCm / 200
      const [ocx] = r.position
      const rem = r.removedWalls ?? []
      const cands = [
        !rem.includes('right') ? ocx + ohw + WALL_T : null,
        !rem.includes('left')  ? ocx - ohw - WALL_T : null,
      ]
      for (const t of cands) {
        if (t === null) continue
        const d = Math.abs(movEdge - t)
        if (d < bestDist) { bestDist = d; bestTarget = t }
      }
    }

    if (bestTarget !== null) {
      // wSign=+1: startCx - startHw + 2*newHw + WALL_T = bestTarget  →  newW = (target - startCx + startHw - WALL_T)*100
      // wSign=-1: startCx + startHw - 2*newHw - WALL_T = bestTarget  →  newW = (startCx + startHw - WALL_T - target)*100
      const startHw = startWCm / 200
      const newW = wSign === 1
        ? (bestTarget - startCx + startHw - WALL_T) * 100
        : (startCx + startHw - WALL_T - bestTarget) * 100
      snapDw = Math.max(MIN_DIM_CM, Math.min(MAX_DIM_CM, newW)) - startWCm
    }
  }

  // ── Z ekseni snap (ön/arka handle) ────────────────────────────
  if (lSign !== 0) {
    const prospL = Math.max(MIN_DIM_CM, Math.min(MAX_DIM_CM, startLCm + rawDl))
    const actualDl = prospL - startLCm
    const newCz   = startCz + lSign * actualDl / 200
    const movEdge = newCz + lSign * (prospL / 200 + WALL_T)

    let bestDist = RESIZE_SNAP_THRESHOLD
    let bestTarget: number | null = null

    for (const r of allRooms) {
      if (r.id === selfId) continue
      const ohl = r.lengthCm / 200
      const [, ocz] = r.position
      const rem = r.removedWalls ?? []
      const cands = [
        !rem.includes('front') ? ocz + ohl + WALL_T : null,
        !rem.includes('back')  ? ocz - ohl - WALL_T : null,
      ]
      for (const t of cands) {
        if (t === null) continue
        const d = Math.abs(movEdge - t)
        if (d < bestDist) { bestDist = d; bestTarget = t }
      }
    }

    if (bestTarget !== null) {
      // lSign=+1: startCz - startHl + 2*newHl + WALL_T = bestTarget
      // lSign=-1: startCz + startHl - 2*newHl - WALL_T = bestTarget
      const startHl = startLCm / 200
      const newL = lSign === 1
        ? (bestTarget - startCz + startHl - WALL_T) * 100
        : (startCz + startHl - WALL_T - bestTarget) * 100
      snapDl = Math.max(MIN_DIM_CM, Math.min(MAX_DIM_CM, newL)) - startLCm
    }
  }

  return { rawDw: snapDw, rawDl: snapDl }
}
