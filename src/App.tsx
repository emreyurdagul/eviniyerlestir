import { useEffect, useCallback, useState } from 'react'
import './i18n'
import SceneCanvas from './components/Canvas/SceneCanvas'
import Toolbar from './components/UI/Toolbar'
import PropertiesPanel from './components/UI/PropertiesPanel'
import BottomBar from './components/UI/BottomBar'
import FloorPlan2D from './components/UI/FloorPlan2D'
import RoomMesh from './components/Room/RoomMesh'
import FurnitureItem from './components/Furniture/FurnitureItem'
import { useDesignStore } from './store/designStore'
import { validateAndParse } from './services/serialization'

const MOVE_STEP = 0.1 // metre

export default function App() {
  const rooms = useDesignStore(s => s.rooms)
  const furniture = useDesignStore(s => s.furniture)
  const selection = useDesignStore(s => s.selection)
  const updateRoom = useDesignStore(s => s.updateRoom)
  const updateFurniture = useDesignStore(s => s.updateFurniture)
  const [show2D, setShow2D] = useState(false)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.target as HTMLElement)?.tagName === 'INPUT') return

    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      useDesignStore.temporal.getState().undo()
      return
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault()
      useDesignStore.temporal.getState().redo()
      return
    }

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

  // Load plan from URL hash on startup
  useEffect(() => {
    const hash = window.location.hash
    if (hash.startsWith('#plan=')) {
      try {
        const encoded = hash.slice(6)
        const json = decodeURIComponent(escape(atob(encoded)))
        const data = validateAndParse(json)
        useDesignStore.getState().importLayout(data)
        window.location.hash = ''
      } catch { /* ignore invalid hash */ }
    }
  }, [])

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
      <BottomBar onShow2D={() => setShow2D(true)} />
      {show2D && <FloorPlan2D onClose={() => setShow2D(false)} />}
    </div>
  )
}
