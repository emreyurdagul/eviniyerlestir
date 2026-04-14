import type { Room, FurnitureItem } from '../types'

const SNAP_THRESHOLD = 0.18 // metre
const WALL_T = 0.10         // duvar kalinligi (metre) - RoomMesh ile ayni

interface SnapEdge {
  axis: 'x' | 'z'
  value: number
  type: 'inner' | 'outer' | 'center'
}

function getRoomEdges(room: Room): SnapEdge[] {
  const wM = room.widthCm / 200  // half width in metres
  const lM = room.lengthCm / 200  // half length in metres
  const [cx, cz] = room.position
  const removed = room.removedWalls ?? []

  const edges: SnapEdge[] = [
    { axis: 'x', value: cx, type: 'center' },
    { axis: 'z', value: cz, type: 'center' },
  ]

  // Inner edges (duvar ic yuzeyi)
  edges.push({ axis: 'x', value: cx - wM, type: 'inner' })
  edges.push({ axis: 'x', value: cx + wM, type: 'inner' })
  edges.push({ axis: 'z', value: cz - lM, type: 'inner' })
  edges.push({ axis: 'z', value: cz + lM, type: 'inner' })

  // Outer edges (duvar dis yuzeyi - wall thickness eklenmis)
  if (!removed.includes('left'))  edges.push({ axis: 'x', value: cx - wM - WALL_T, type: 'outer' })
  if (!removed.includes('right')) edges.push({ axis: 'x', value: cx + wM + WALL_T, type: 'outer' })
  if (!removed.includes('back'))  edges.push({ axis: 'z', value: cz - lM - WALL_T, type: 'outer' })
  if (!removed.includes('front')) edges.push({ axis: 'z', value: cz + lM + WALL_T, type: 'outer' })

  return edges
}

/**
 * Snap room position so walls sit side-by-side (not overlapping).
 * Outer edge of one room snaps to outer edge of another.
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

  // Edges of dragged room at proposed position
  const dragOuter: SnapEdge[] = []
  if (!dRemoved.includes('left'))  dragOuter.push({ axis: 'x', value: targetX - wM - WALL_T, type: 'outer' })
  if (!dRemoved.includes('right')) dragOuter.push({ axis: 'x', value: targetX + wM + WALL_T, type: 'outer' })
  if (!dRemoved.includes('back'))  dragOuter.push({ axis: 'z', value: targetZ - lM - WALL_T, type: 'outer' })
  if (!dRemoved.includes('front')) dragOuter.push({ axis: 'z', value: targetZ + lM + WALL_T, type: 'outer' })

  // Also inner edges and center for alignment
  const dragAll: SnapEdge[] = [
    ...dragOuter,
    { axis: 'x', value: targetX - wM, type: 'inner' },
    { axis: 'x', value: targetX + wM, type: 'inner' },
    { axis: 'x', value: targetX, type: 'center' },
    { axis: 'z', value: targetZ - lM, type: 'inner' },
    { axis: 'z', value: targetZ + lM, type: 'inner' },
    { axis: 'z', value: targetZ, type: 'center' },
  ]

  let bestDx = 0, bestDz = 0
  let bestDistX = SNAP_THRESHOLD, bestDistZ = SNAP_THRESHOLD

  for (const other of allRooms) {
    if (other.id === draggedRoom.id) continue
    const otherEdges = getRoomEdges(other)

    for (const de of dragAll) {
      for (const oe of otherEdges) {
        if (de.axis !== oe.axis) continue

        // outer-to-outer snap: walls sit side by side
        // inner-to-inner / center-to-center: alignment
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

/**
 * Snap furniture to room inner edges and other furniture.
 */
export function snapFurniturePosition(
  targetX: number,
  targetZ: number,
  allRooms: Room[],
  allFurniture: FurnitureItem[],
  selfId: string,
): { x: number; z: number } {
  let bestDx = 0, bestDz = 0
  let bestDistX = SNAP_THRESHOLD, bestDistZ = SNAP_THRESHOLD

  // Snap to room inner edges
  for (const room of allRooms) {
    const wM = room.widthCm / 200
    const lM = room.lengthCm / 200
    const [cx, cz] = room.position
    const xEdges = [cx - wM, cx + wM, cx]
    const zEdges = [cz - lM, cz + lM, cz]

    for (const ex of xEdges) {
      const d = Math.abs(targetX - ex)
      if (d < bestDistX) { bestDistX = d; bestDx = ex - targetX }
    }
    for (const ez of zEdges) {
      const d = Math.abs(targetZ - ez)
      if (d < bestDistZ) { bestDistZ = d; bestDz = ez - targetZ }
    }
  }

  // Snap to other furniture
  for (const f of allFurniture) {
    if (f.id === selfId) continue
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
