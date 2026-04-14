import { useMemo } from 'react'
import { PRESETS } from '../../data/presets'
import type { Preset } from '../../data/presets'
import { useDesignStore } from '../../store/designStore'
import { useToast } from '../../hooks/useToast'
import type { Room } from '../../types'

interface PresetGalleryProps {
  open: boolean
  onClose: () => void
}

/** Basit üst-görünüm mini çizim — oda dikdörtgenlerini SVG'de göster */
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
  const ROOM_COLORS_HEX: Record<string, string> = {
    salon: '#c8d8e0', yatak: '#d8e0c8', mutfak: '#e8d8b8',
    banyo: '#c8e0dc', koridor: '#e0d4c0', cocuk: '#e4c8d8',
  }

  return (
    <svg
      viewBox={`${bounds.minX} ${bounds.minZ} ${width} ${height}`}
      className="w-full h-24 bg-stone-50 rounded-lg border border-stone-200/60"
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
              stroke="#6a5a40"
              strokeWidth={0.04}
            />
            <text
              x={r.position[0]}
              y={r.position[1] + 0.08}
              fontSize={Math.min(hw, hl) * 0.4}
              fill="#4a3a20"
              textAnchor="middle"
              fontWeight="600"
            >
              {r.type === 'salon' ? 'S' :
               r.type === 'yatak' ? 'Y' :
               r.type === 'mutfak' ? 'M' :
               r.type === 'banyo' ? 'B' :
               r.type === 'koridor' ? 'K' :
               r.type === 'cocuk' ? 'Ç' : '?'}
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

  if (!open) return null

  const loadPreset = (preset: Preset) => {
    importLayout(preset.data)
    toast.success(`"${preset.label}" şablonu yüklendi`)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
      data-testid="preset-gallery"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-stone-300/50 w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200/60 bg-amber-50/60">
          <div>
            <div className="text-sm font-bold text-stone-800 flex items-center gap-1.5">
              📋 Hazır Plan Şablonları
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">
              Bir şablon seçip "Yükle" ile başlayın. Sahnedeki mevcut plan silinecek.
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 text-lg cursor-pointer w-8 h-8 flex items-center justify-center leading-none rounded hover:bg-stone-100"
            aria-label="Kapat"
          >✕</button>
        </div>

        {/* Kart grid */}
        <div className="overflow-y-auto p-4 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {PRESETS.map(p => (
            <div
              key={p.id}
              className="bg-stone-50 border border-stone-200/60 rounded-xl overflow-hidden hover:shadow-md hover:border-amber-300 transition-all flex flex-col"
              data-testid={`preset-card-${p.id}`}
            >
              <PresetThumbnail rooms={p.data.rooms} />
              <div className="p-3 flex-1 flex flex-col">
                <div className="text-sm font-bold text-stone-800 flex items-center gap-1.5 mb-1">
                  <span className="text-base">{p.icon}</span>
                  {p.label}
                </div>
                <div className="text-[11px] text-stone-500 leading-snug mb-3 flex-1">
                  {p.description}
                </div>
                <div className="text-[10px] text-stone-400 mb-2">
                  {p.data.rooms.length} oda · {p.data.furniture.length} eşya
                </div>
                <button
                  onClick={() => loadPreset(p)}
                  className="w-full py-2 rounded-lg bg-amber-500 text-white text-xs font-bold cursor-pointer hover:bg-amber-600 transition-colors"
                  data-testid={`preset-load-${p.id}`}
                >
                  Bu Şablonu Yükle
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-stone-200/50 bg-stone-50/50 text-[10px] text-stone-500 leading-tight">
          💡 İpucu: Şablonu yükledikten sonra odaları sürükleyerek, ölçülerini değiştirerek ve eşya ekleyerek kendinize uyarlayabilirsiniz.
        </div>
      </div>
    </div>
  )
}
