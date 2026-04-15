import { useEffect, useRef } from 'react'
import { useDesignStore } from '../../store/designStore'
import { MIN_DIM_CM, MAX_DIM_CM } from '../../types'
import { suggestPlacement, suggestFurniture, suggestStyle } from '../../services/ai/client'
import { useToast } from '../../hooks/useToast'

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
  const toast = useToast()

  const runAI = async (fn: () => Promise<import('../../store/designStore').AIPreview>) => {
    close()
    try {
      const preview = await fn()
      setAiPreview(preview)
    } catch (e: unknown) {
      toast.error('AI öneri üretemedi: ' + (e instanceof Error ? e.message : String(e)))
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

  // Ekran sınırlarına göre konum ayarla (duvar menüsü daha büyük)
  const isWallMenu = selection.kind === 'wall'
  const menuW = isWallMenu ? 272 : 200
  const menuH = isWallMenu ? 360 : 260
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

  // ── Duvar Paneli ──
  if (selection.kind === 'wall') {
    const room = rooms.find(r => r.id === selection.parentId)
    if (!room) return null
    const wallSide = selection.id as 'left' | 'right' | 'front' | 'back'
    const isRemoved = (room.removedWalls ?? []).includes(wallSide)
    const wallOpenings = (room.openings ?? []).filter(o => o.wall === wallSide)

    const WALL_DIR: Record<string, string> = {
      left: '← Sol', right: 'Sağ →', front: '↓ Ön', back: '↑ Arka',
    }
    type OType = 'door' | 'double-door' | 'sliding-door' | 'window' | 'panoramic' | 'triple-window' | 'french-balcony'

    const DOORS: { type: OType; svg: React.ReactNode; label: string; dims: string }[] = [
      {
        type: 'door', label: 'Tek Kanatlı', dims: '90×210',
        svg: <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="1" width="13" height="22" rx="1"/>
          <circle cx="13.5" cy="12" r="1.2" fill="currentColor" stroke="none"/>
        </svg>,
      },
      {
        type: 'double-door', label: 'Çift Kanatlı', dims: '160×210',
        svg: <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="1" y="1" width="10" height="22" rx="1"/>
          <rect x="13" y="1" width="10" height="22" rx="1"/>
          <circle cx="10" cy="12" r="1.1" fill="currentColor" stroke="none"/>
          <circle cx="14" cy="12" r="1.1" fill="currentColor" stroke="none"/>
        </svg>,
      },
      {
        type: 'sliding-door', label: 'Sürgülü', dims: '180×210',
        svg: <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="1" y="1" width="22" height="22" rx="1"/>
          <line x1="12" y1="1" x2="12" y2="23"/>
          <polyline points="8,8 4,12 8,16"/>
          <polyline points="16,8 20,12 16,16"/>
        </svg>,
      },
    ]

    const WINDOWS: { type: OType; svg: React.ReactNode; label: string; dims: string }[] = [
      {
        type: 'window', label: 'Standart', dims: '120×120',
        svg: <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="1" y="3" width="22" height="18" rx="1"/>
          <line x1="12" y1="3" x2="12" y2="21"/>
          <line x1="1" y1="12" x2="23" y2="12"/>
        </svg>,
      },
      {
        type: 'panoramic', label: 'Panoramik', dims: '220×230',
        svg: <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="1" y="1" width="22" height="22" rx="1"/>
          <line x1="8" y1="1" x2="8" y2="23"/>
          <line x1="16" y1="1" x2="16" y2="23"/>
        </svg>,
      },
      {
        type: 'triple-window', label: 'Üçlü', dims: '240×140',
        svg: <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="1" y="4" width="22" height="16" rx="1"/>
          <line x1="9" y1="4" x2="9" y2="20"/>
          <line x1="15" y1="4" x2="15" y2="20"/>
          <line x1="1" y1="12" x2="23" y2="12"/>
        </svg>,
      },
      {
        type: 'french-balcony', label: 'Fr. Balkon', dims: '120×230',
        svg: <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="2" y="1" width="20" height="22" rx="1"/>
          <line x1="12" y1="1" x2="12" y2="23"/>
          <rect x="2" y="18" width="20" height="3" rx="0.5"/>
        </svg>,
      },
    ]

    const addO = (type: OType) => {
      useDesignStore.getState().addOpening(room.id, wallSide, type)
      // Menüyü kapatma — birden fazla açıklık eklenebilsin
    }

    return (
      <div
        ref={menuRef}
        className="fixed bg-gray-900 text-white rounded-2xl shadow-2xl z-[200] select-none overflow-hidden"
        style={{ left: x, top: y, width: menuW }}
        onContextMenu={e => e.preventDefault()}
      >
        {/* ── Başlık ── */}
        <div className="px-3 py-2 flex items-center justify-between bg-gray-800 border-b border-gray-700">
          <div>
            <div className="text-sm font-semibold text-teal-300">
              {WALL_DIR[wallSide] ?? wallSide} Duvar
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              {ROOM_LABELS[room.type] ?? room.type}
            </div>
          </div>
          <button
            onClick={close}
            className="text-gray-500 hover:text-white w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-700 text-xs"
          >✕</button>
        </div>

        {isRemoved ? (
          <div className="px-4 py-3 text-xs text-gray-400">
            Bu duvar kaldırılmış. Geri getirmek için aşağıdaki butonu kullanın.
          </div>
        ) : (
          <div className="px-2 py-2 space-y-2">
            {/* ── Kapı ── */}
            <div>
              <div className="px-1 pb-1 text-[10px] text-stone-400 font-semibold uppercase tracking-wider">
                Kapı Ekle
              </div>
              <div className="grid grid-cols-3 gap-1">
                {DOORS.map(d => (
                  <button
                    key={d.type}
                    onClick={() => addO(d.type)}
                    title={`${d.label} (${d.dims}cm)`}
                    className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl bg-gray-800 hover:bg-teal-700/70 active:bg-teal-600/80 transition-colors text-center group"
                  >
                    <span className="text-gray-300 group-hover:text-white transition-colors">{d.svg}</span>
                    <span className="text-[10px] leading-tight text-gray-200">{d.label}</span>
                    <span className="text-[9px] text-gray-500 group-hover:text-gray-300">{d.dims}cm</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Pencere ── */}
            <div className="border-t border-gray-700/60 pt-2">
              <div className="px-1 pb-1 text-[10px] text-stone-400 font-semibold uppercase tracking-wider">
                Pencere Ekle
              </div>
              <div className="grid grid-cols-4 gap-1">
                {WINDOWS.map(w => (
                  <button
                    key={w.type}
                    onClick={() => addO(w.type)}
                    title={`${w.label} (${w.dims}cm)`}
                    className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl bg-gray-800 hover:bg-sky-700/70 active:bg-sky-600/80 transition-colors text-center group"
                  >
                    <span className="text-gray-300 group-hover:text-white transition-colors">{w.svg}</span>
                    <span className="text-[9px] leading-tight text-gray-200">{w.label}</span>
                    <span className="text-[8px] text-gray-500 group-hover:text-gray-300">{w.dims}cm</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Mevcut açıklıklar ── */}
            {wallOpenings.length > 0 && (
              <div className="border-t border-gray-700/60 pt-2">
                <div className="px-1 pb-1 text-[10px] text-stone-400 font-semibold uppercase tracking-wider">
                  Bu Duvardaki Açıklıklar
                </div>
                <div className="space-y-0.5">
                  {wallOpenings.map(op => (
                    <div
                      key={op.id}
                      className="flex items-center justify-between px-2 py-1.5 bg-gray-800 rounded-xl"
                    >
                      <span className="text-xs text-gray-200 truncate">
                        {OPENING_LABELS[op.type] ?? op.type}
                      </span>
                      <span className="text-[10px] text-gray-500 mx-2 shrink-0">
                        {op.widthCm}×{op.heightCm}cm
                      </span>
                      <button
                        onClick={() => removeOpening(room.id, op.id)}
                        className="text-red-400 hover:text-red-300 w-5 h-5 flex items-center justify-center rounded-lg hover:bg-gray-700 text-xs shrink-0"
                      >×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Duvarı kaldır / geri getir ── */}
        <div className="border-t border-gray-700 px-2 py-1.5">
          <button
            onClick={() => { useDesignStore.getState().toggleWall(room.id, wallSide); close() }}
            className={`w-full text-left px-3 py-1.5 text-xs rounded-xl flex items-center gap-2 transition-colors ${
              isRemoved
                ? 'text-green-400 hover:bg-gray-700 hover:text-green-300'
                : 'text-red-400 hover:bg-gray-700 hover:text-red-300'
            }`}
          >
            <span>{isRemoved ? '▮' : '✕'}</span>
            {isRemoved ? 'Duvarı Geri Getir' : 'Duvarı Kaldır'}
          </button>
        </div>
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
