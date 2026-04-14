import { useEffect, useCallback, useState, useRef } from 'react'
import './i18n'
import SceneCanvas from './components/Canvas/SceneCanvas'
import Toolbar from './components/UI/Toolbar'
import PropertiesPanel from './components/UI/PropertiesPanel'
import BottomBar from './components/UI/BottomBar'
import FloorPlan2D from './components/UI/FloorPlan2D'
import AIToast from './components/UI/AIToast'
import ContextMenu from './components/UI/ContextMenu'
import RoomMesh from './components/Room/RoomMesh'
import FurnitureItem from './components/Furniture/FurnitureItem'
import { useDesignStore } from './store/designStore'
import { validateAndParse } from './services/serialization'
import { useTouchGestures } from './hooks/useTouchGestures'
import { MIN_DIM_CM, MAX_DIM_CM } from './types'

const MOVE_STEP = 0.1   // metre
const RESIZE_STEP = 5   // cm (boyutlandırma adımı)
const ROOM_RESIZE_STEP = 10  // cm (oda boyutlandırma adımı)

export default function App() {
  const rooms = useDesignStore(s => s.rooms)
  const furniture = useDesignStore(s => s.furniture)
  const selection = useDesignStore(s => s.selection)
  const updateRoom = useDesignStore(s => s.updateRoom)
  const updateFurniture = useDesignStore(s => s.updateFurniture)
  const [show2D, setShow2D] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Mobil dokunmatik hareketler
  useTouchGestures(containerRef as React.RefObject<HTMLDivElement>)

  // Son pointer konumunu global olarak takip et (ContextMenu için)
  useEffect(() => {
    const track = (e: PointerEvent) => {
      ;(window as any).__lastPointerX = e.clientX
      ;(window as any).__lastPointerY = e.clientY
    }
    window.addEventListener('pointermove', track)
    window.addEventListener('pointerdown', track)
    return () => {
      window.removeEventListener('pointermove', track)
      window.removeEventListener('pointerdown', track)
    }
  }, [])

  // Sağ tıklamayı canvas arka planında engelle (mesh'ler kendi handler'larını kullanır)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'CANVAS') {
        e.preventDefault()
        // Canvas arka planına sağ tıklama → seçimi kaldır
        useDesignStore.getState().deselect()
        useDesignStore.getState().setContextMenuPos(null)
      }
    }
    window.addEventListener('contextmenu', handler)
    return () => window.removeEventListener('contextmenu', handler)
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.target as HTMLElement)?.tagName === 'INPUT') return

    // Geri al / İleri al
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

    // Taşı/Boyutlandır mod geçişi
    if (e.key === 'm' || e.key === 'M') {
      if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        useDesignStore.getState().toggleEditMode()
        return
      }
    }

    // Çoğalt
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault()
      if (selection.kind === 'furniture' && selection.id) {
        useDesignStore.getState().duplicateFurniture(selection.id)
      }
      return
    }

    // Seçimi kaldır
    if (e.key === 'Escape') {
      useDesignStore.getState().deselect()
      useDesignStore.getState().setContextMenuPos(null)
      return
    }

    if (!selection.kind || !selection.id) return

    // ── Mobilya kısayolları ──
    if (selection.kind === 'furniture') {
      const furn = furniture.find(f => f.id === selection.id)
      if (!furn) return

      // Döndür
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        const dir = e.shiftKey ? -1 : 1
        updateFurniture(furn.id, { rotation: furn.rotation + dir * Math.PI / 2 })
        return
      }

      // Boyutlandır: ] veya = büyüt, [ veya - küçült
      if (e.key === ']' || e.key === '=') {
        e.preventDefault()
        const newDims = Object.fromEntries(
          Object.entries(furn.dims).map(([k, v]) => [k, Math.min(MAX_DIM_CM, v + RESIZE_STEP)])
        )
        updateFurniture(furn.id, { dims: newDims })
        return
      }
      if (e.key === '[' || e.key === '-') {
        e.preventDefault()
        const newDims = Object.fromEntries(
          Object.entries(furn.dims).map(([k, v]) => [k, Math.max(MIN_DIM_CM, v - RESIZE_STEP)])
        )
        updateFurniture(furn.id, { dims: newDims })
        return
      }

      // Ok tuşları: Shift → ince adım, normal → standart adım
      let dx = 0, dz = 0
      const step = e.shiftKey ? 0.01 : MOVE_STEP
      switch (e.key) {
        case 'ArrowLeft':  dx = -step; break
        case 'ArrowRight': dx = step; break
        case 'ArrowUp':    dz = -step; break
        case 'ArrowDown':  dz = step; break
        case 'Delete':
        case 'Backspace':
          useDesignStore.getState().removeFurniture(furn.id)
          return
        default: return
      }
      e.preventDefault()
      updateFurniture(furn.id, { position: [furn.position[0] + dx, furn.position[1] + dz] })
      return
    }

    // ── Oda kısayolları ──
    if (selection.kind === 'room') {
      const room = rooms.find(r => r.id === selection.id)
      if (!room) return

      // Döndür
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        const dir = e.shiftKey ? -1 : 1
        updateRoom(room.id, { rotation: room.rotation + dir * Math.PI / 2 })
        return
      }

      // Boyutlandır
      if (e.key === ']' || e.key === '=') {
        e.preventDefault()
        updateRoom(room.id, {
          widthCm: Math.min(MAX_DIM_CM, room.widthCm + ROOM_RESIZE_STEP),
          lengthCm: Math.min(MAX_DIM_CM, room.lengthCm + ROOM_RESIZE_STEP),
        })
        return
      }
      if (e.key === '[' || e.key === '-') {
        e.preventDefault()
        updateRoom(room.id, {
          widthCm: Math.max(MIN_DIM_CM, room.widthCm - ROOM_RESIZE_STEP),
          lengthCm: Math.max(MIN_DIM_CM, room.lengthCm - ROOM_RESIZE_STEP),
        })
        return
      }

      // Ok tuşları: normal → taşı, Shift+ok → boyutlandır (tek eksen)
      if (e.shiftKey) {
        e.preventDefault()
        switch (e.key) {
          case 'ArrowLeft':
          case 'ArrowRight':
            updateRoom(room.id, {
              widthCm: Math.max(MIN_DIM_CM, room.widthCm + (e.key === 'ArrowRight' ? ROOM_RESIZE_STEP : -ROOM_RESIZE_STEP))
            })
            break
          case 'ArrowUp':
          case 'ArrowDown':
            updateRoom(room.id, {
              lengthCm: Math.max(MIN_DIM_CM, room.lengthCm + (e.key === 'ArrowDown' ? ROOM_RESIZE_STEP : -ROOM_RESIZE_STEP))
            })
            break
          case 'Delete':
          case 'Backspace':
            useDesignStore.getState().removeRoom(room.id)
            break
        }
        return
      }

      let dx = 0, dz = 0
      switch (e.key) {
        case 'ArrowLeft':  dx = -MOVE_STEP; break
        case 'ArrowRight': dx = MOVE_STEP; break
        case 'ArrowUp':    dz = -MOVE_STEP; break
        case 'ArrowDown':  dz = MOVE_STEP; break
        case 'Delete':
        case 'Backspace':
          useDesignStore.getState().removeRoom(room.id)
          return
        default: return
      }
      e.preventDefault()
      updateRoom(room.id, { position: [room.position[0] + dx, room.position[1] + dz] })
    }
  }, [selection, rooms, furniture, updateRoom, updateFurniture])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // URL hash'ten plan yükle
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
    <div ref={containerRef} className="w-full h-screen relative overflow-hidden" data-testid="app-root">
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
      <AIToast />
      <ContextMenu />
    </div>
  )
}
