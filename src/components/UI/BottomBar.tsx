import { useRef } from 'react'
import { useDesignStore } from '../../store/designStore'
import { ROOM_TYPES, FURNITURE_CATALOG } from '../../types'
import { exportToJSON, downloadFile, readFile, validateAndParse } from '../../services/serialization'

export default function BottomBar() {
  const selection = useDesignStore(s => s.selection)
  const rooms = useDesignStore(s => s.rooms)
  const furniture = useDesignStore(s => s.furniture)
  const updateRoom = useDesignStore(s => s.updateRoom)
  const updateFurniture = useDesignStore(s => s.updateFurniture)
  const isTopView = useDesignStore(s => s.isTopView)
  const setTopView = useDesignStore(s => s.setTopView)
  const exportLayout = useDesignStore(s => s.exportLayout)
  const importLayout = useDesignStore(s => s.importLayout)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasSelection = selection.kind !== null && selection.id !== null
  const selRoom = selection.kind === 'room' ? rooms.find(r => r.id === selection.id) : null
  const selFurn = selection.kind === 'furniture' ? furniture.find(f => f.id === selection.id) : null
  const selFurnCat = selFurn ? FURNITURE_CATALOG.find(c => c.type === selFurn.type) : null
  const selRoomCat = selRoom ? ROOM_TYPES.find(c => c.type === selRoom.type) : null

  const handleRotate = () => {
    if (selection.kind === 'room' && selection.id) {
      const r = rooms.find(r => r.id === selection.id)
      if (r) updateRoom(r.id, { rotation: r.rotation + Math.PI / 2 })
    }
    if (selection.kind === 'furniture' && selection.id) {
      const f = furniture.find(f => f.id === selection.id)
      if (f) updateFurniture(f.id, { rotation: f.rotation + Math.PI / 2 })
    }
  }

  const handleSave = () => {
    const data = exportLayout()
    const json = exportToJSON(data)
    downloadFile(json)
  }

  const handleLoad = () => fileInputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await readFile(file)
      const data = validateAndParse(text)
      importLayout(data)
    } catch {
      alert('Geçersiz dosya formatı')
    }
    e.target.value = ''
  }

  const hex = (c: number) => '#' + c.toString(16).padStart(6, '0')

  const btnClass = (highlight = false) =>
    `bg-white/95 backdrop-blur-sm px-4 py-2.5 rounded-3xl text-xs font-semibold cursor-pointer shadow-md hover:-translate-y-0.5 transition-transform whitespace-nowrap border ${
      highlight
        ? 'text-amber-800 bg-amber-100/60 border-amber-400/50'
        : 'text-stone-800 border-stone-300/30'
    }`

  return (
    <>
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 flex-wrap justify-center z-10" data-testid="bottom-bar">
        <button onClick={handleRotate} className={btnClass(hasSelection)} data-testid="btn-rotate">
          ↻ Döndür
        </button>
        <button onClick={() => setTopView(!isTopView)} className={btnClass()} data-testid="btn-view-toggle">
          {isTopView ? '🔭 3D' : '🗺 Üstten'}
        </button>
        <button onClick={handleSave} className={btnClass()} data-testid="btn-save">
          💾 Kaydet
        </button>
        <button onClick={handleLoad} className={btnClass()} data-testid="btn-load">
          📂 Yükle
        </button>
      </div>

      {/* Selection badge */}
      {(selRoom || selFurn) && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-2xl shadow-md border border-stone-300/30 py-1 px-3.5 text-[11.5px] text-stone-800 flex items-center gap-1.5 whitespace-nowrap z-10" data-testid="selection-badge">
          {selRoom && (
            <>
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: hex(selRoom.color) }} />
              <b>{selRoomCat?.icon} {selRoomCat?.label}</b> seçili — sürükle / ↻
            </>
          )}
          {selFurn && (
            <>
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: hex(selFurn.color) }} />
              <b>{selFurnCat?.icon} {selFurnCat?.label}</b> seçili — sürükle / ↻
            </>
          )}
        </div>
      )}

      <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" data-testid="file-input" />
    </>
  )
}
