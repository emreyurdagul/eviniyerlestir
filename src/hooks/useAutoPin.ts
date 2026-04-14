import { useCallback } from 'react'
import { useDesignStore } from '../store/designStore'
import type { Room } from '../types'

function isInsideRoom(fx: number, fz: number, room: Room): boolean {
  const halfW = room.widthCm / 200  // cm → m → half
  const halfL = room.lengthCm / 200
  const [rx, rz] = room.position
  // Transform world pos to room-local space (inverse rotation)
  const dx = fx - rx
  const dz = fz - rz
  const cosR = Math.cos(-room.rotation)
  const sinR = Math.sin(-room.rotation)
  const localX = dx * cosR - dz * sinR
  const localZ = dx * sinR + dz * cosR
  return Math.abs(localX) <= halfW && Math.abs(localZ) <= halfL
}

export function useAutoPin(furnitureId: string) {
  const setPendingAutoPin = useDesignStore(s => s.setPendingAutoPin)
  const unpinFromRoom = useDesignStore(s => s.unpinFromRoom)

  const checkAndSuggestPin = useCallback(() => {
    const state = useDesignStore.getState()
    const furniture = state.furniture.find(f => f.id === furnitureId)
    if (!furniture) return

    const [fx, fz] = furniture.position

    if (furniture.parentRoomId) {
      // Already pinned: unpin if dragged outside parent room
      const parentRoom = state.rooms.find(r => r.id === furniture.parentRoomId)
      if (parentRoom && !isInsideRoom(fx, fz, parentRoom)) {
        unpinFromRoom(furnitureId)
      }
      return
    }

    // Not pinned: check if inside any room → suggest pin
    for (const room of state.rooms) {
      if (isInsideRoom(fx, fz, room)) {
        setPendingAutoPin({ furnitureId, roomId: room.id })
        return
      }
    }
  }, [furnitureId, setPendingAutoPin, unpinFromRoom])

  return { checkAndSuggestPin }
}
