import { useEffect, useRef } from 'react'
import { useDesignStore } from '../../store/designStore'
import { MIN_DIM_CM, MAX_DIM_CM } from '../../types'
import { suggestPlacement, suggestFurniture, suggestStyle } from '../../services/ai/client'

const OPENING_LABELS: Record<string, string> = {
  'door': '🚪 Kapı', 'double-door': '🚪🚪 Çift Kapı', 'sliding-door': '↔🚪 Sürgülü Kapı',
  'window': '🪟 Pencere', 'panoramic': '🏙 Panoramik',
  'triple-window': '🪟🪟🪟 Üçlü Pencere', 'french-balcony': '🏛 Fransız Balkon',
}

const ROOM_LABELS: Record<string, string> = {
  salon: 'Salon', yatak: 'Yatak Odası', mutfak: 'Mutfak',
  banyo: 'Banyo', koridor: 'Koridor', cocuk: 'Çocuk Odası',
}

const FURN_LABELS: Record<string, string> = {
  sofa: 'Koltuk', chair: 'Sandalye', dchair: 'Yemek Sandalyesi',
  ctable: 'Sehpa', tvunit: 'TV Ünitesi', dtable: 'Yemek Masası',
  bed: 'Yatak', wardrobe: 'Gardrop', shelf: 'Raf',
  floorlamp: 'Ayaklı Lamba', rug: 'Halı', plant: 'Bitki', custom: 'Özel Model',
}

export default function ContextMenu() {
  const pos = useDesignStore(s => s.contextMenuPos)
  const setPos = useDesignStore(s => s.setContextMenuPos)
  const selection = useDesignStore(s => s.selection)
  const rooms = useDesignStore(s => s.rooms)
  const furniture = useDesignStore(s => s.furniture)
  const updateRoom = useDesignStore(s => s.updateRoom)
  const updateFurniture = useDesignStore(s => s.updateFurniture)
  const updateOpening = useDesignStore(s => s.updateOpening)
  const removeRoom = useDesignStore(s => s.removeRoom)
  const removeFurniture = useDesignStore(s => s.removeFurniture)
  const removeOpening = useDesignStore(s => s.removeOpening)
  const duplicateFurniture = useDesignStore(s => s.duplicateFurniture)
  const pinToRoom = useDesignStore(s => s.pinToRoom)
  const unpinFromRoom = useDesignStore(s => s.unpinFromRoom)
  const pendingAutoPin = useDesignStore(s => s.pendingAutoPin)
  const aiApiKey = useDesignStore(s => s.aiApiKey)
  const setAiPreview = useDesignStore(s => s.setAiPreview)

  const menuRef = useRef<HTMLDivElement>(null)

  const runAI = async (fn: () => Promise<import('../../store/designStore').AIPreview>) => {
    close()
    try {
      const preview = await fn()
      setAiPreview(preview)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : String(e))
    }
  }

  // Dışarı tıklanınca kapat
  useEffect(() => {
    if (!pos) return
    const handler = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setPos(null)
      }
    }
    const escHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') setPos(null) }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    document.addEventListener('keydown', escHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
      document.removeEventListener('keydown', escHandler)
    }
  }, [pos, setPos])

  if (!pos || !selection.id) return null

  const close = () => setPos(null)

  // Ekran sınırlarına göre konum ayarla
  const menuW = 200
  const menuH = 260
  const x = Math.min(pos.x, window.innerWidth - menuW - 8)
  const y = Math.min(pos.y, window.innerHeight - menuH - 8)

  // ── Mobilya Menüsü ──
  if (selection.kind === 'furniture') {
    const furn = furniture.find(f => f.id === selection.id)
    if (!furn) return null
    const isPinned = !!furn.parentRoomId
    const label = furn.customLabel ?? FURN_LABELS[furn.type] ?? furn.type

    const rotateFurn = (dir: 1 | -1) => {
      updateFurniture(furn.id, { rotation: furn.rotation + dir * Math.PI / 2 })
      close()
    }

    const resizeFurn = (delta: number) => {
      const newDims = Object.fromEntries(
        Object.entries(furn.dims).map(([k, v]) => [k, Math.round(Math.max(MIN_DIM_CM, Math.min(MAX_DIM_CM, v + delta)))])
      )
      updateFurniture(furn.id, { dims: newDims })
      close()
    }

    const handlePin = () => {
      if (isPinned) {
        unpinFromRoom(furn.id)
      } else if (pendingAutoPin?.furnitureId === furn.id) {
        pinToRoom(furn.id, pendingAutoPin.roomId)
        useDesignStore.getState().setPendingAutoPin(null)
      } else {
        // İçinde olduğu odayı bul
        const state = useDesignStore.getState()
        for (const room of state.rooms) {
          const hw = room.widthCm / 200
          const hl = room.lengthCm / 200
          const dx = furn.position[0] - room.position[0]
          const dz = furn.position[1] - room.position[1]
          const cosR = Math.cos(-room.rotation)
          const sinR = Math.sin(-room.rotation)
          const lx = dx * cosR - dz * sinR
          const lz = dx * sinR + dz * cosR
          if (Math.abs(lx) <= hw && Math.abs(lz) <= hl) {
            pinToRoom(furn.id, room.id)
            break
          }
        }
      }
      close()
    }

    return (
      <div
        ref={menuRef}
        className="fixed bg-gray-900 text-white rounded-xl shadow-2xl py-1 z-[200] select-none"
        style={{ left: x, top: y, minWidth: menuW }}
        onContextMenu={e => e.preventDefault()}
      >
        <div className="px-3 py-1.5 text-xs text-gray-400 border-b border-gray-700">{label}</div>

        <MenuItem icon="↻" label="Döndür +90°" onClick={() => rotateFurn(1)} />
        <MenuItem icon="↺" label="Döndür -90°" onClick={() => rotateFurn(-1)} />
        <div className="border-t border-gray-700 my-1" />
        <MenuItem icon="⊕" label={`Büyüt (+5cm)`} onClick={() => resizeFurn(5)} />
        <MenuItem icon="⊖" label={`Küçült (-5cm)`} onClick={() => resizeFurn(-5)} />
        <div className="border-t border-gray-700 my-1" />
        <MenuItem icon="⧉" label="Çoğalt" onClick={() => { duplicateFurniture(furn.id); close() }} />
        <MenuItem
          icon={isPinned ? '📌' : '📍'}
          label={isPinned ? 'Odadan Kopar' : 'Odaya Sabitle'}
          onClick={handlePin}
        />
        <div className="border-t border-gray-700 my-1" />
        <MenuItem icon="🗑" label="Sil" danger onClick={() => { removeFurniture(furn.id); close() }} />
      </div>
    )
  }

  // ── Oda Menüsü ──
  if (selection.kind === 'room') {
    const room = rooms.find(r => r.id === selection.id)
    if (!room) return null
    const label = ROOM_LABELS[room.type] ?? room.type

    const rotateRoom = (dir: 1 | -1) => {
      updateRoom(room.id, { rotation: room.rotation + dir * Math.PI / 2 })
      close()
    }

    const resizeRoom = (dw: number, dl: number) => {
      updateRoom(room.id, {
        widthCm: Math.round(Math.max(MIN_DIM_CM, Math.min(MAX_DIM_CM, room.widthCm + dw))),
        lengthCm: Math.round(Math.max(MIN_DIM_CM, Math.min(MAX_DIM_CM, room.lengthCm + dl))),
      })
      close()
    }

    return (
      <div
        ref={menuRef}
        className="fixed bg-gray-900 text-white rounded-xl shadow-2xl py-1 z-[200] select-none"
        style={{ left: x, top: y, minWidth: menuW }}
        onContextMenu={e => e.preventDefault()}
      >
        <div className="px-3 py-1.5 text-xs text-gray-400 border-b border-gray-700">{label}</div>

        <MenuItem icon="↻" label="Döndür +90°" onClick={() => rotateRoom(1)} />
        <MenuItem icon="↺" label="Döndür -90°" onClick={() => rotateRoom(-1)} />
        <div className="border-t border-gray-700 my-1" />
        <MenuItem icon="⊕" label="Genişlet (+10cm)" onClick={() => resizeRoom(10, 10)} />
        <MenuItem icon="⊖" label="Daralt (-10cm)" onClick={() => resizeRoom(-10, -10)} />
        <div className="border-t border-gray-700 my-1" />
        <MenuItem icon="🗑" label="Sil" danger onClick={() => { removeRoom(room.id); close() }} />

        {aiApiKey && <>
          <div className="border-t border-gray-700 my-1" />
          <div className="px-2 py-0.5 text-[10px] text-stone-400 font-semibold">✨ AI</div>
          <MenuItem icon="🪑" label="Yerleşim Öner" onClick={() => runAI(() => suggestPlacement(room.id))} />
          <MenuItem icon="🛋" label="Eksik Mobilya Öner" onClick={() => runAI(() => suggestFurniture(room.id))} />
          <MenuItem icon="🎨" label="Stil Öner" onClick={() => runAI(() => suggestStyle(room.id))} />
        </>}
      </div>
    )
  }

  // ── Açıklık Menüsü ──
  if (selection.kind === 'opening') {
    const room = rooms.find(r => r.id === selection.parentId)
    if (!room) return null
    const opening = (room.openings ?? []).find(o => o.id === selection.id)
    if (!opening) return null
    const label = OPENING_LABELS[opening.type] ?? opening.type

    const resizeW = (delta: number) => {
      updateOpening(room.id, opening.id, { widthCm: Math.round(Math.max(30, Math.min(500, opening.widthCm + delta))) })
      close()
    }
    const resizeH = (delta: number) => {
      updateOpening(room.id, opening.id, { heightCm: Math.round(Math.max(30, Math.min(300, opening.heightCm + delta))) })
      close()
    }
    const movePos = (delta: number) => {
      updateOpening(room.id, opening.id, { positionAlongWall: Math.max(0.05, Math.min(0.95, opening.positionAlongWall + delta)) })
    }

    return (
      <div
        ref={menuRef}
        className="fixed bg-gray-900 text-white rounded-xl shadow-2xl py-1 z-[200] select-none"
        style={{ left: x, top: y, minWidth: menuW }}
        onContextMenu={e => e.preventDefault()}
      >
        <div className="px-3 py-1.5 text-xs text-gray-400 border-b border-gray-700">{label}</div>
        <div className="px-3 py-1 text-[10px] text-gray-500">{opening.widthCm}×{opening.heightCm}cm</div>

        <MenuItem icon="⊕" label="Genişlet (+10cm)" onClick={() => resizeW(10)} />
        <MenuItem icon="⊖" label="Daralt (-10cm)"   onClick={() => resizeW(-10)} />
        <div className="border-t border-gray-700 my-1" />
        <MenuItem icon="↑" label="Yükselt (+10cm)"  onClick={() => resizeH(10)} />
        <MenuItem icon="↓" label="Alçalt (-10cm)"   onClick={() => resizeH(-10)} />
        <div className="border-t border-gray-700 my-1" />
        <MenuItem icon="←" label="Sola Kaydır"      onClick={() => { movePos(-0.05); close() }} />
        <MenuItem icon="→" label="Sağa Kaydır"      onClick={() => { movePos(0.05); close() }} />
        <div className="border-t border-gray-700 my-1" />
        <MenuItem icon="🗑" label="Sil" danger onClick={() => { removeOpening(room.id, opening.id); close() }} />
      </div>
    )
  }

  return null
}

function MenuItem({ icon, label, onClick, danger }: {
  icon: string
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-700 active:bg-gray-600 transition-colors ${danger ? 'text-red-400 hover:text-red-300' : ''}`}
      onClick={onClick}
    >
      <span className="w-4 text-center">{icon}</span>
      {label}
    </button>
  )
}
