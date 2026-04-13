import { useEffect, useCallback } from 'react'
import './i18n'
import SceneCanvas from './components/Canvas/SceneCanvas'
import Toolbar from './components/UI/Toolbar'
import PropertiesPanel from './components/UI/PropertiesPanel'
import BottomBar from './components/UI/BottomBar'
import RoomMesh from './components/Room/RoomMesh'
import FurnitureItem from './components/Furniture/FurnitureItem'
import { useDesignStore } from './store/designStore'

const MOVE_STEP = 0.1 // metre

export default function App() {
  const rooms = useDesignStore(s => s.rooms)
  const furniture = useDesignStore(s => s.furniture)
  const selection = useDesignStore(s => s.selection)
  const updateRoom = useDesignStore(s => s.updateRoom)
  const updateFurniture = useDesignStore(s => s.updateFurniture)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Skip if user is typing in an input
    if ((e.target as HTMLElement)?.tagName === 'INPUT') return
    if (!selection.kind || !selection.id) return

    let dx = 0, dz = 0
    switch (e.key) {
      case 'ArrowLeft':  dx = -MOVE_STEP; break
      case 'ArrowRight': dx = MOVE_STEP; break
      case 'ArrowUp':    dz = -MOVE_STEP; break
      case 'ArrowDown':  dz = MOVE_STEP; break
      case 'Delete':
      case 'Backspace': {
        if (selection.kind === 'room') useDesignStore.getState().removeRoom(selection.id)
        if (selection.kind === 'furniture') useDesignStore.getState().removeFurniture(selection.id)
        return
      }
      default: return
    }

    e.preventDefault()

    if (selection.kind === 'room') {
      const room = rooms.find(r => r.id === selection.id)
      if (room) updateRoom(room.id, { position: [room.position[0] + dx, room.position[1] + dz] })
    } else if (selection.kind === 'furniture') {
      const furn = furniture.find(f => f.id === selection.id)
      if (furn) updateFurniture(furn.id, { position: [furn.position[0] + dx, furn.position[1] + dz] })
    }
  }, [selection, rooms, furniture, updateRoom, updateFurniture])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="w-full h-screen relative overflow-hidden" data-testid="app-root">
      <SceneCanvas>
        {rooms.map(r => (
          <RoomMesh key={r.id} room={r} />
        ))}
        {furniture.map(f => (
          <FurnitureItem key={f.id} item={f} />
        ))}
      </SceneCanvas>
      <Toolbar />
      <PropertiesPanel />
      <BottomBar />
    </div>
  )
}
