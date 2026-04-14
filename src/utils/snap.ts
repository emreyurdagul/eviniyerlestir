import type { Room, FurnitureItem } from '../types'

const SNAP_THRESHOLD = 0.15 // metre - bu mesafeden yakınsa yapış

interface Edge {
  axis: 'x' | 'z'
  value: number
}

function getRoomEdges(room: Room): Edge[] {
  const wM = room.widthCm / 200  // half width in metres
  const lM = room.lengthCm / 200  // half length in metres
  const [cx, cz] = room.position
  // Simplified: ignoring rotation for snap (works for axis-aligned rooms)
  return [
    { axis: 'x', value: cx - wM },
    { axis: 'x', value: cx + wM },
    { axis: 'x', value: cx },       // center
    { axis: 'z', value: cz - lM },
    { axis: 'z', value: cz + lM },
    { axis: 'z', value: cz },       // center
  ]
}

/**
 * Given a room being dragged to (x, z), snap to nearby room edges.
 * Returns adjusted [x, z] position.
 */
export function snapRoomPosition(
  draggedRoom: Room,
  targetX: number,
  targetZ: number,
  allRooms: Room[],
): { x: number; z: number; snapX: number | null; snapZ: number | null } {
  const wM = draggedRoom.widthCm / 200
  const lM = draggedRoom.lengthCm / 200

  // Edges of dragged room at proposed position
  const dragEdges: Edge[] = [
    { axis: 'x', value: targetX - wM },
    { axis: 'x', value: targetX + wM },
    { axis: 'x', value: targetX },
    { axis: 'z', value: targetZ - lM },
    { axis: 'z', value: targetZ + lM },
    { axis: 'z', value: targetZ },
  ]

  let bestSnapX: number | null = null
  let bestSnapZ: number | null = null
  let bestDistX = SNAP_THRESHOLD
  let bestDistZ = SNAP_THRESHOLD

  for (const other of allRooms) {
    if (other.id === draggedRoom.id) continue
    const otherEdges = getRoomEdges(other)

    for (const de of dragEdges) {
      for (const oe of otherEdges) {
        if (de.axis !== oe.axis) continue
        const dist = Math.abs(de.value - oe.value)
        if (de.axis === 'x' && dist < bestDistX) {
          bestDistX = dist
          bestSnapX = targetX + (oe.value - de.value)
        }
        if (de.axis === 'z' && dist < bestDistZ) {
          bestDistZ = dist
          bestSnapZ = targetZ + (oe.value - de.value)
        }
      }
    }
  }

  return {
    x: bestSnapX ?? targetX,
    z: bestSnapZ ?? targetZ,
    snapX: bestSnapX !== null ? (bestSnapX - targetX + targetX) : null,
    snapZ: bestSnapZ !== null ? (bestSnapZ - targetZ + targetZ) : null,
  }
}

/**
 * Snap furniture position to room edges and other furniture.
 */
export function snapFurniturePosition(
  targetX: number,
  targetZ: number,
  allRooms: Room[],
  allFurniture: FurnitureItem[],
  selfId: string,
): { x: number; z: number } {
  let bestSnapX: number | null = null
  let bestSnapZ: number | null = null
  let bestDistX = SNAP_THRESHOLD
  let bestDistZ = SNAP_THRESHOLD

  // Snap to room edges
  for (const room of allRooms) {
    const edges = getRoomEdges(room)
    for (const e of edges) {
      if (e.axis === 'x') {
        const d = Math.abs(targetX - e.value)
        if (d < bestDistX) { bestDistX = d; bestSnapX = e.value }
      } else {
        const d = Math.abs(targetZ - e.value)
        if (d < bestDistZ) { bestDistZ = d; bestSnapZ = e.value }
      }
    }
  }

  // Snap to other furniture centers
  for (const f of allFurniture) {
    if (f.id === selfId) continue
    const dx = Math.abs(targetX - f.position[0])
    const dz = Math.abs(targetZ - f.position[1])
    if (dx < bestDistX) { bestDistX = dx; bestSnapX = f.position[0] }
    if (dz < bestDistZ) { bestDistZ = dz; bestSnapZ = f.position[1] }
  }

  return {
    x: bestSnapX ?? targetX,
    z: bestSnapZ ?? targetZ,
  }
}
