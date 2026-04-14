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
  let bestDistX = SNAP_THRESHOLD, bestDistZ = SNAP_THRESHOLD

  // Furniture edges at proposed center
  const furnLeft   = targetX - halfW
  const furnRight  = targetX + halfW
  const furnBack   = targetZ - halfD
  const furnFront  = targetZ + halfD

  for (const room of allRooms) {
    const wM = room.widthCm / 200
    const lM = room.lengthCm / 200
    const [cx, cz] = room.position
    const removed = room.removedWalls ?? []

    // Inner wall positions
    const innerLeft  = cx - wM
    const innerRight = cx + wM
    const innerBack  = cz - lM
    const innerFront = cz + lM

    // Snap furniture LEFT edge to room inner-left wall (only if left wall present)
    if (!removed.includes('left')) {
      const d = Math.abs(furnLeft - innerLeft)
      if (d < bestDistX) { bestDistX = d; bestDx = innerLeft - furnLeft }
    }
    // Snap furniture RIGHT edge to room inner-right wall
    if (!removed.includes('right')) {
      const d = Math.abs(furnRight - innerRight)
      if (d < bestDistX) { bestDistX = d; bestDx = innerRight - furnRight }
    }
    // Snap furniture BACK edge to room inner-back wall
    if (!removed.includes('back')) {
      const d = Math.abs(furnBack - innerBack)
      if (d < bestDistZ) { bestDistZ = d; bestDz = innerBack - furnBack }
    }
    // Snap furniture FRONT edge to room inner-front wall
    if (!removed.includes('front')) {
      const d = Math.abs(furnFront - innerFront)
      if (d < bestDistZ) { bestDistZ = d; bestDz = innerFront - furnFront }
    }

    // Center alignment within room
    const dCx = Math.abs(targetX - cx)
    if (dCx < bestDistX) { bestDistX = dCx; bestDx = cx - targetX }
    const dCz = Math.abs(targetZ - cz)
    if (dCz < bestDistZ) { bestDistZ = dCz; bestDz = cz - targetZ }
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
