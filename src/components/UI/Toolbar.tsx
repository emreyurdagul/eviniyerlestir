import { useState, useRef } from 'react'
import { useDesignStore } from '../../store/designStore'
import { ROOM_TYPES, FURNITURE_CATALOG } from '../../types'

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  oturma:     { label: 'Oturma Odası', icon: '🛋' },
  yatak:      { label: 'Yatak Odası',  icon: '🛏' },
  yemek:      { label: 'Yemek Odası',  icon: '🍽' },
  mutfak:     { label: 'Mutfak',       icon: '🍳' },
  depolama:   { label: 'Depolama',     icon: '📦' },
  aydinlatma: { label: 'Aydınlatma',   icon: '💡' },
  dekor:      { label: 'Dekor',        icon: '🌿' },
}

export default function Toolbar() {
  const [open, setOpen] = useState(true)
  const [tab, setTab] = useState<'room' | 'furniture'>('room')
  const [openCats, setOpenCats] = useState<Set<string>>(new Set(['oturma', 'mutfak']))
  const addRoom = useDesignStore(s => s.addRoom)
  const addFurniture = useDesignStore(s => s.addFurniture)
  const addCustomFurniture = useDesignStore(s => s.addCustomFurniture)
  const modelInputRef = useRef<HTMLInputElement>(null)

  const handleModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    const name = file.name.replace(/\.(glb|gltf)$/i, '')
    addCustomFurniture(name, url)
    e.target.value = ''
  }

  const toggleCat = (cat: string) => {
    setOpenCats(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  // Group furniture by category in order defined by CATEGORY_META
  const catOrder = Object.keys(CATEGORY_META)
  const byCategory = catOrder.map(cat => ({
    cat,
    meta: CATEGORY_META[cat],
    items: FURNITURE_CATALOG.filter(c => c.category === cat),
  })).filter(g => g.items.length > 0)

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
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-stone-300/30 p-2.5 w-44">
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

          {/* Oda listesi */}
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

          {/* Mobilya kategorileri — accordion */}
          {tab === 'furniture' && (
            <>
              {byCategory.map(({ cat, meta, items }) => (
                <div key={cat}>
                  {/* Kategori başlığı */}
                  <button
                    onClick={() => toggleCat(cat)}
                    className="flex items-center justify-between w-full py-1 px-1 mb-0.5 text-[10px] font-bold text-stone-600 hover:text-stone-800 transition-colors cursor-pointer"
                    data-testid={`toolbar-cat-${cat}`}
                  >
                    <span>{meta.icon} {meta.label}</span>
                    <span className="text-stone-400">{openCats.has(cat) ? '▴' : '▾'}</span>
                  </button>

                  {/* Kategori içeriği */}
                  {openCats.has(cat) && items.map(c => (
                    <button
                      key={c.type}
                      onClick={() => addFurniture(c.type)}
                      className="flex items-center gap-1.5 w-full py-1.5 px-2 mb-1 ml-1 bg-amber-50/80 border border-stone-300/30 rounded-lg cursor-pointer text-xs font-semibold text-stone-800 hover:translate-x-0.5 transition-transform text-left"
                      data-testid={`toolbar-furn-${c.type}`}
                    >
                      <span className="text-sm">{c.icon}</span>
                      <span className="truncate">{c.label}</span>
                    </button>
                  ))}
                </div>
              ))}

              <div className="border-t border-stone-200/30 my-1.5" />
              <button
                onClick={() => modelInputRef.current?.click()}
                className="flex items-center gap-1.5 w-full py-1.5 px-2 mb-1 bg-blue-50/80 border border-blue-300/40 rounded-lg cursor-pointer text-xs font-semibold text-blue-800 hover:translate-x-0.5 transition-transform text-left"
                data-testid="toolbar-upload-model"
              >
                <span className="text-sm">📦</span> 3D Model Yükle (.glb)
              </button>
              <input
                ref={modelInputRef}
                type="file"
                accept=".glb,.gltf"
                onChange={handleModelUpload}
                className="hidden"
              />
            </>
          )}

          <div className="text-[9px] text-stone-400 mt-1 text-center leading-snug">
            Tıkla → ekle → sürükle
          </div>
        </div>
      )}
    </div>
  )
}
