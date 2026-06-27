import { useMemo, useState } from 'react'
import { PRESETS as CORE_PRESETS } from '../../data/presets'
import { PRESETS_2PLUS1 } from '../../data/presets-2plus1'
import { PRESETS_3PLUS1 } from '../../data/presets-3plus1'
import { PRESETS_DUPLEX } from '../../data/presets-duplex'
import type { Preset } from '../../data/presets'
import { useDesignStore } from '../../store/designStore'
import { useToast } from '../../hooks/useToast'
import type { Room } from '../../types'

// Tüm preset kaynaklarını birleştir — ID benzersizse eklenir
const _seen = new Set<string>()
const ALL_PRESETS: Preset[] = [
  ...CORE_PRESETS,
  ...PRESETS_2PLUS1,
  ...PRESETS_3PLUS1,
  ...PRESETS_DUPLEX,
].filter(p => {
  if (_seen.has(p.id)) return false
  _seen.add(p.id)
  return true
})

// Kategoriler — preset label'ından otomatik çıkarım
const CATEGORIES = [
  { key: 'all',    label: 'Tümü',    icon: '🏠', match: () => true },
  { key: 'studio', label: 'Stüdyo',  icon: '🏢', match: (p: Preset) => /stüdyo|studio|loft/i.test(p.label) || /stüdyo|studio|loft/i.test(p.id) },
  { key: '1+1',   label: '1+1',     icon: '🏠', match: (p: Preset) => /1\+1|1plus1/i.test(p.label) || /1plus1/i.test(p.id) },
  { key: '2+1',   label: '2+1',     icon: '🏘', match: (p: Preset) => /2\+1|2plus1|2p1/i.test(p.label) || /2plus1|2p1/i.test(p.id) },
  { key: '3+1',   label: '3+1',     icon: '🏙', match: (p: Preset) => /3\+1|3plus1|3p1/i.test(p.label) || /3plus1|3p1/i.test(p.id) },
  { key: 'duplex', label: 'Dubleks', icon: '🏛', match: (p: Preset) => /dubl|duplex|triplex/i.test(p.label) || /duplex|triplex/i.test(p.id) },
  { key: 'villa',  label: 'Villa',   icon: '🌳', match: (p: Preset) => /villa|bahçe|havuz|penthouse/i.test(p.label) || /villa|garden|pool/i.test(p.id) },
  { key: 'other',  label: 'Diğer',   icon: '📐', match: (p: Preset) => /ofis|açık|plan|tiny/i.test(p.label) },
] as const

interface PresetGalleryProps {
  open: boolean
  onClose: () => void
}

/** Basit üst-görünüm mini çizim */
function PresetThumbnail({ rooms }: { rooms: Room[] }) {
  const bounds = useMemo(() => {
    if (rooms.length === 0) return { minX: -5, maxX: 5, minZ: -5, maxZ: 5 }
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity
    for (const r of rooms) {
      const hw = r.widthCm / 200
      const hl = r.lengthCm / 200
      minX = Math.min(minX, r.position[0] - hw)
      maxX = Math.max(maxX, r.position[0] + hw)
      minZ = Math.min(minZ, r.position[1] - hl)
      maxZ = Math.max(maxZ, r.position[1] + hl)
    }
    const pad = 0.3
    return { minX: minX - pad, maxX: maxX + pad, minZ: minZ - pad, maxZ: maxZ + pad }
  }, [rooms])

  const width = bounds.maxX - bounds.minX
  const height = bounds.maxZ - bounds.minZ
  // Daha canlı renkler — soluk pastel yerine belirgin tonlar
  const ROOM_COLORS_HEX: Record<string, string> = {
    salon: '#7bafd4', yatak: '#8ec47a', mutfak: '#e8b84c',
    banyo: '#5cc4b8', koridor: '#c4a87c', cocuk: '#d890b8',
    balkon: '#8cc8a0',
  }

  return (
    <svg
      viewBox={`${bounds.minX} ${bounds.minZ} ${width} ${height}`}
      className="w-full h-28 sm:h-32 bg-white rounded-lg border border-stone-300/60"
      preserveAspectRatio="xMidYMid meet"
    >
      {rooms.map(r => {
        const hw = r.widthCm / 200
        const hl = r.lengthCm / 200
        const fill = ROOM_COLORS_HEX[r.type] ?? '#e0e0e0'
        return (
          <g key={r.id}>
            <rect
              x={r.position[0] - hw}
              y={r.position[1] - hl}
              width={hw * 2}
              height={hl * 2}
              fill={fill}
              stroke="#4a3a20"
              strokeWidth={0.06}
            />
            <text
              x={r.position[0]}
              y={r.position[1] + 0.12}
              fontSize={Math.min(hw, hl) * 0.55}
              fill="#1a1a1a"
              textAnchor="middle"
              fontWeight="600"
            >
              {r.type === 'salon' ? 'S' :
               r.type === 'yatak' ? 'Y' :
               r.type === 'mutfak' ? 'M' :
               r.type === 'banyo' ? 'B' :
               r.type === 'koridor' ? 'K' :
               r.type === 'cocuk' ? 'Ç' :
               r.type === 'balkon' ? 'BL' : '?'}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default function PresetGallery({ open, onClose }: PresetGalleryProps) {
  const importLayout = useDesignStore(s => s.importLayout)
  const toast = useToast()
  const [activeCat, setActiveCat] = useState('all')
  const [search, setSearch] = useState('')

  const filteredPresets = useMemo(() => {
    let list = ALL_PRESETS
    // Kategori filtresi
    if (activeCat !== 'all') {
      const cat = CATEGORIES.find(c => c.key === activeCat)
      if (cat) list = list.filter(cat.match)
    }
    // Arama filtresi
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.label.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      )
    }
    return list
  }, [activeCat, search])

  if (!open) return null

  const loadPreset = (preset: Preset) => {
    importLayout(preset.data)
    toast.success(`"${preset.label}" şablonu yüklendi`)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 sm:p-4"
      onClick={onClose}
      data-testid="preset-gallery"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-stone-300/50 w-full max-w-4xl max-h-[min(92vh,calc(100dvh-1rem))] sm:max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-b border-stone-200/60 bg-amber-50/60 flex-shrink-0">
          <div className="min-w-0">
            <div className="text-sm font-bold text-stone-800 flex items-center gap-1.5">
              📋 Hazır Plan Şablonları
              <span className="text-[10px] font-normal text-stone-500 ml-1">({ALL_PRESETS.length} plan)</span>
            </div>
            <div className="text-[10px] text-stone-500 mt-0.5 hidden sm:block">
              Bir şablon seçip yükleyin. Mevcut plan silinecek.
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 text-lg cursor-pointer w-8 h-8 flex items-center justify-center leading-none rounded hover:bg-stone-100 flex-shrink-0"
            aria-label="Kapat"
          >✕</button>
        </div>

        {/* Kategori tabları + arama */}
        <div className="px-3 sm:px-4 py-2 border-b border-stone-100 flex-shrink-0 space-y-2">
          {/* Kategori tab bar — yatay scroll */}
          <div className="flex gap-1 overflow-x-auto pb-0.5 -mx-1 px-1 scrollbar-thin">
            {CATEGORIES.map(cat => {
              const count = cat.key === 'all' ? ALL_PRESETS.length : ALL_PRESETS.filter(cat.match).length
              if (count === 0 && cat.key !== 'all') return null
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCat(cat.key)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer flex-shrink-0 ${
                    activeCat === cat.key
                      ? 'bg-amber-100 text-amber-800 shadow-sm'
                      : 'bg-stone-50 text-stone-500 hover:bg-stone-100 hover:text-stone-700'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  <span className={`text-[9px] px-1 rounded-full ${
                    activeCat === cat.key ? 'bg-amber-200 text-amber-900' : 'bg-stone-200 text-stone-600'
                  }`}>{count}</span>
                </button>
              )
            })}
          </div>
          {/* Arama */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Plan ara... (ör: açık mutfak, ebeveyn)"
              className="w-full border border-stone-200 rounded-lg px-3 py-1.5 pl-8 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 bg-stone-50"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs">🔍</span>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
              >✕</button>
            )}
          </div>
        </div>

        {/* Kart grid — scrollable. min-h-0: flex-1 öğelerinin max-h kısıtını
            saygıyla uygulaması için gerekli (flexbox overflow bug önleme) */}
        <div className="overflow-y-auto flex-1 min-h-0 p-3 sm:p-4 grid gap-3 grid-cols-1 sm:grid-cols-2 auto-rows-max">
          {filteredPresets.length === 0 ? (
            <div className="col-span-full text-center py-8 text-stone-400 text-sm">
              Sonuç bulunamadı.
            </div>
          ) : (
            filteredPresets.map(p => (
              <div
                key={p.id}
                className="bg-stone-50 border border-stone-200/60 rounded-xl overflow-hidden hover:shadow-md hover:border-amber-300 transition-all flex flex-col cursor-pointer group"
                onClick={() => loadPreset(p)}
                data-testid={`preset-card-${p.id}`}
              >
                <PresetThumbnail rooms={p.data.rooms} />
                <div className="p-3 flex-1 flex flex-col">
                  <div className="text-sm font-bold text-stone-800 flex items-center gap-2 mb-1">
                    <span className="text-base">{p.icon}</span>
                    <span className="truncate">{p.label}</span>
                  </div>
                  <div className="text-xs text-stone-500 leading-snug mb-2 flex-1 line-clamp-2">
                    {p.description}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-stone-400">
                      {p.data.rooms.length} oda · {p.data.furniture.length} eşya
                      {p.data.floors && p.data.floors.length > 1 ? ` · ${p.data.floors.length} kat` : ''}
                    </span>
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      Yükle →
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-3 sm:px-4 py-1.5 border-t border-stone-200/50 bg-stone-50/50 text-[9px] sm:text-[10px] text-stone-500 leading-tight flex-shrink-0">
          💡 Şablonu yükledikten sonra odaları düzenleyebilirsiniz. Kartın herhangi bir yerine tıklayarak yükleyin.
        </div>
      </div>
    </div>
  )
}
