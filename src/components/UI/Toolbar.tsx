import { useState } from 'react'
import { useDesignStore } from '../../store/designStore'
import { ROOM_TYPES, FURNITURE_CATALOG } from '../../types'

export default function Toolbar() {
  const [open, setOpen] = useState(true)
  const [tab, setTab] = useState<'room' | 'furniture'>('room')
  const addRoom = useDesignStore(s => s.addRoom)
  const addFurniture = useDesignStore(s => s.addFurniture)

  return (
    <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start z-10" data-testid="toolbar">
      <button
        onClick={() => setOpen(o => !o)}
        className="bg-white/95 backdrop-blur-sm px-3.5 py-1.5 rounded-3xl text-xs font-bold text-stone-800 border border-stone-300/40 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
        data-testid="toolbar-toggle"
      >
        {open ? '✕ Kapat' : '➕ Ekle'}
      </button>

      {open && (
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-stone-300/30 p-2.5 w-40">
          {/* Tabs */}
          <div className="flex gap-0.5 mb-2 bg-stone-100/60 rounded-xl p-0.5">
            <button
              onClick={() => setTab('room')}
              className={`flex-1 py-1.5 px-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                tab === 'room' ? 'bg-amber-100/60 text-amber-800' : 'text-stone-500 hover:text-stone-700'
              }`}
              data-testid="toolbar-tab-room"
            >
              🏠 Oda
            </button>
            <button
              onClick={() => setTab('furniture')}
              className={`flex-1 py-1.5 px-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                tab === 'furniture' ? 'bg-amber-100/60 text-amber-800' : 'text-stone-500 hover:text-stone-700'
              }`}
              data-testid="toolbar-tab-furniture"
            >
              🛋 Mobilya
            </button>
          </div>

          {/* Items */}
          {tab === 'room' && ROOM_TYPES.map(c => (
            <button
              key={c.type}
              onClick={() => addRoom(c.type)}
              className="flex items-center gap-1.5 w-full py-1.5 px-2 mb-1 bg-amber-50/80 border border-stone-300/30 rounded-lg cursor-pointer text-xs font-semibold text-stone-800 hover:translate-x-0.5 transition-transform text-left"
              data-testid={`toolbar-room-${c.type}`}
            >
              <span className="text-sm">{c.icon}</span> {c.label}
            </button>
          ))}

          {tab === 'furniture' && FURNITURE_CATALOG.map(c => (
            <button
              key={c.type}
              onClick={() => addFurniture(c.type)}
              className="flex items-center gap-1.5 w-full py-1.5 px-2 mb-1 bg-amber-50/80 border border-stone-300/30 rounded-lg cursor-pointer text-xs font-semibold text-stone-800 hover:translate-x-0.5 transition-transform text-left"
              data-testid={`toolbar-furn-${c.type}`}
            >
              <span className="text-sm">{c.icon}</span> {c.label}
            </button>
          ))}

          <div className="text-[9px] text-stone-400 mt-1 text-center leading-snug">
            Tıkla → ekle → sürükle
          </div>
        </div>
      )}
    </div>
  )
}
