import { useState, useRef } from 'react'
import { useDesignStore } from '../../store/designStore'
import { FURNITURE_CATALOG, MIN_DIM_CM, MAX_DIM_CM } from '../../types'

export default function PropertiesPanel() {
  const [open, setOpen] = useState(true)
  const rooms = useDesignStore(s => s.rooms)
  const furniture = useDesignStore(s => s.furniture)
  const selection = useDesignStore(s => s.selection)
  const updateRoom = useDesignStore(s => s.updateRoom)
  const updateFurniture = useDesignStore(s => s.updateFurniture)
  const removeRoom = useDesignStore(s => s.removeRoom)
  const removeFurniture = useDesignStore(s => s.removeFurniture)
  const select = useDesignStore(s => s.select)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selFurn = selection.kind === 'furniture' ? furniture.find(f => f.id === selection.id) : null

  const handleRoomDim = (id: string, key: 'widthCm' | 'lengthCm', val: string) => {
    const v = parseInt(val)
    if (!isNaN(v) && v >= MIN_DIM_CM && v <= MAX_DIM_CM) updateRoom(id, { [key]: v })
  }

  const handleFurnDim = (id: string, key: string, val: string) => {
    const v = parseInt(val)
    if (!isNaN(v) && v >= 10) {
      updateFurniture(id, { dims: { ...selFurn!.dims, [key]: v } })
    }
  }

  const hex = (c: number) => '#' + c.toString(16).padStart(6, '0')

  return (
    <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end z-10" data-testid="properties-panel">
      <button
        onClick={() => setOpen(o => !o)}
        className="bg-white/95 backdrop-blur-sm px-3.5 py-1.5 rounded-3xl text-xs font-bold text-stone-800 border border-stone-300/40 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
        data-testid="properties-toggle"
      >
        {open ? '✕ Kapat' : '📋 Liste'}
      </button>

      {open && (
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-stone-300/30 p-2.5 w-56 max-h-[calc(100vh-100px)] overflow-y-auto">

          {/* Rooms */}
          {rooms.length > 0 && (
            <>
              <div className="text-[11.5px] font-bold text-stone-700 mb-1.5 flex items-center gap-1">
                🏠 Odalar ({rooms.length})
              </div>
              {rooms.map(r => {
                const isSel = selection.kind === 'room' && selection.id === r.id
                return (
                  <div
                    key={r.id}
                    onClick={() => select('room', r.id)}
                    className={`mb-1.5 p-1.5 rounded-lg cursor-pointer border transition-colors ${
                      isSel ? 'bg-amber-50/70 border-amber-400/50' : 'bg-stone-50/50 border-stone-200/30 hover:bg-stone-100/60'
                    }`}
                    data-testid={`room-item-${r.id}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-1 text-xs font-bold text-stone-800">
                        <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: hex(r.color) }} />
                        {r.type === 'salon' && '🛋'}{r.type === 'yatak' && '🛏'}{r.type === 'mutfak' && '🍳'}
                        {r.type === 'banyo' && '🚿'}{r.type === 'koridor' && '🚪'}{r.type === 'cocuk' && '🎮'}
                        {' '}{r.type.charAt(0).toUpperCase() + r.type.slice(1)}
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); removeRoom(r.id) }}
                        className="bg-red-100/60 border border-red-300/40 rounded px-1.5 text-red-600 text-[10px] cursor-pointer hover:bg-red-200/60"
                        data-testid={`room-delete-${r.id}`}
                      >✕</button>
                    </div>
                    <div className="flex gap-1.5">
                      {([['En', 'widthCm'], ['Boy', 'lengthCm']] as const).map(([label, key]) => (
                        <div key={key} className="flex-1">
                          <div className="text-[9px] text-stone-500 mb-0.5">{label}</div>
                          <div className="flex items-center gap-0.5">
                            <input
                              type="number"
                              defaultValue={r[key]}
                              key={`${r.id}-${key}-${r[key]}`}
                              min={MIN_DIM_CM}
                              max={MAX_DIM_CM}
                              onChange={e => handleRoomDim(r.id, key, e.target.value)}
                              onClick={e => e.stopPropagation()}
                              className="w-12 py-0.5 px-1 text-[11px] font-bold text-stone-800 bg-amber-50/90 border border-stone-300/40 rounded text-right outline-none focus:border-amber-400"
                              data-testid={`room-dim-${r.id}-${key}`}
                            />
                            <span className="text-[9px] text-stone-500">cm</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
              <div className="border-t border-stone-200/30 my-1.5" />
            </>
          )}

          {/* Furniture */}
          {furniture.length > 0 && (
            <>
              <div className="text-[11.5px] font-bold text-stone-700 mb-1.5">🛋 Eşyalar ({furniture.length})</div>
              {furniture.map(f => {
                const cat = FURNITURE_CATALOG.find(c => c.type === f.type)
                const isSel = selection.kind === 'furniture' && selection.id === f.id
                return (
                  <div
                    key={f.id}
                    onClick={() => select('furniture', f.id)}
                    className={`mb-1 p-1.5 rounded-lg cursor-pointer border transition-colors ${
                      isSel ? 'bg-amber-50/70 border-amber-400/50' : 'bg-stone-50/50 border-stone-200/30 hover:bg-stone-100/60'
                    }`}
                    data-testid={`furn-item-${f.id}`}
                  >
                    <div className="flex justify-between items-center mb-0.5">
                      <div className="flex items-center gap-1 text-[11.5px] font-bold text-stone-800">
                        <span className="w-1.5 h-1.5 rounded-full inline-block shrink-0" style={{ background: hex(f.color) }} />
                        {cat?.icon} {cat?.label}
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); removeFurniture(f.id) }}
                        className="bg-red-100/60 border border-red-300/40 rounded px-1 text-red-600 text-[10px] cursor-pointer hover:bg-red-200/60"
                        data-testid={`furn-delete-${f.id}`}
                      >✕</button>
                    </div>
                    {cat?.dimDefs.map(def => (
                      <div key={def.key} className="flex justify-between items-center mb-0.5">
                        <span className="text-[10px] text-stone-600">{def.label}</span>
                        <div className="flex items-center gap-0.5">
                          <input
                            type="number"
                            defaultValue={f.dims[def.key]}
                            key={`${f.id}-${def.key}-${f.dims[def.key]}`}
                            min={def.min}
                            max={def.max}
                            onChange={e => handleFurnDim(f.id, def.key, e.target.value)}
                            onClick={e => e.stopPropagation()}
                            className="w-12 py-0.5 px-1 text-[11px] font-bold text-stone-800 bg-amber-50/90 border border-stone-300/40 rounded text-right outline-none focus:border-amber-400"
                            data-testid={`furn-dim-${f.id}-${def.key}`}
                          />
                          <span className="text-[9px] text-stone-500">{def.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </>
          )}

          {rooms.length === 0 && furniture.length === 0 && (
            <div className="text-[11px] text-stone-400 text-center py-3 leading-relaxed">
              Henüz hiçbir şey yok.<br />Sol panelden oda veya<br />mobilya ekleyin.
            </div>
          )}
        </div>
      )}
      <input ref={fileInputRef} type="file" accept=".json" className="hidden" />
    </div>
  )
}
