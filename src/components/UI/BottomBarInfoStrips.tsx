/**
 * BottomBarInfoStrips — BottomBar üstünde beliren bağlam çubukları.
 *
 * 5 şerit (hepsi koşullu render):
 *   1. ✏ Çizim modu bilgilendirmesi + nokta sayısı + temizle butonu
 *   2. 🗺 Kroki kontrolleri (boyut / saydamlık slider + AI analiz)
 *   3. 🌞 Güneş kontrolleri (saat / ay / pusula açısı)
 *   4. Seçili öğe rozeti (oda / mobilya)
 *   5. m² özet pill (toplam alan, oda sayısı, eşya sayısı)
 *
 * Eskiden BottomBar'ın ~100 satırı bu şeritlerden oluşuyordu — ayrı bileşen
 * olunca ana bar kodu daha okunabilir ve bu şeritleri ileride başka bir
 * konteynerde yeniden konumlandırmak kolaylaşıyor.
 *
 * Saf presentational — state store'dan okunuyor ama logic yok.
 */

import { useDesignStore } from '../../store/designStore'
import { ROOM_TYPES, FURNITURE_CATALOG } from '../../types'

interface Props {
  onAiBlueprint: () => void
}

export default function BottomBarInfoStrips({ onAiBlueprint }: Props) {
  const selection = useDesignStore(s => s.selection)
  const rooms = useDesignStore(s => s.rooms)
  const furniture = useDesignStore(s => s.furniture)
  const isDrawing = useDesignStore(s => s.isDrawing)
  const drawPoints = useDesignStore(s => s.drawPoints)
  const clearDrawPoints = useDesignStore(s => s.clearDrawPoints)
  const blueprintUrl = useDesignStore(s => s.blueprintUrl)
  const setBlueprint = useDesignStore(s => s.setBlueprint)
  const blueprintScale = useDesignStore(s => s.blueprintScale)
  const setBlueprintScale = useDesignStore(s => s.setBlueprintScale)
  const blueprintOpacity = useDesignStore(s => s.blueprintOpacity)
  const setBlueprintOpacity = useDesignStore(s => s.setBlueprintOpacity)
  const showCompass = useDesignStore(s => s.showCompass)
  const compassAngle = useDesignStore(s => s.compassAngle)
  const setCompassAngle = useDesignStore(s => s.setCompassAngle)
  const sunHour = useDesignStore(s => s.sunHour)
  const setSunHour = useDesignStore(s => s.setSunHour)
  const sunMonth = useDesignStore(s => s.sunMonth)
  const setSunMonth = useDesignStore(s => s.setSunMonth)
  const aiApiKey = useDesignStore(s => s.aiApiKey)
  const aiLoading = useDesignStore(s => s.aiLoading)

  const selRoom = selection.kind === 'room' ? rooms.find(r => r.id === selection.id) : null
  const selFurn = selection.kind === 'furniture' ? furniture.find(f => f.id === selection.id) : null
  const selFurnCat = selFurn ? FURNITURE_CATALOG.find(c => c.type === selFurn.type) : null
  const selRoomCat = selRoom ? ROOM_TYPES.find(c => c.type === selRoom.type) : null
  const hex = (c: number) => '#' + c.toString(16).padStart(6, '0')

  return (
    <>
      {isDrawing && (
        <div className="pointer-events-auto bg-amber-100/95 backdrop-blur-sm rounded-2xl shadow-md border border-amber-400/50 py-1 px-3 text-[11px] text-amber-900 flex items-center gap-2 whitespace-nowrap" data-testid="drawing-badge">
          <b>✏ Çizim Modu</b> — Tıkla: nokta ekle ({drawPoints.length}) | İlk noktaya yaklaş: oda oluştur
          {drawPoints.length > 0 && (
            <button onClick={clearDrawPoints} className="ml-1 px-1.5 py-0.5 rounded bg-amber-200 hover:bg-amber-300 text-[10px]" data-testid="btn-clear-draw">🗑</button>
          )}
        </div>
      )}

      {blueprintUrl && !isDrawing && (
        <div className="pointer-events-auto bg-blue-50/95 backdrop-blur-sm rounded-2xl shadow-md border border-blue-300/40 py-1 px-3 text-[10px] text-blue-900 flex items-center gap-2 whitespace-nowrap flex-wrap justify-center" data-testid="blueprint-controls">
          <span className="font-bold">🗺 Kroki</span>
          <label className="flex items-center gap-1">
            Boyut:
            <input type="range" min={2} max={40} step={0.5} value={blueprintScale}
              onChange={e => setBlueprintScale(parseFloat(e.target.value))}
              className="w-14 h-3 accent-blue-600 cursor-pointer" />
            <span className="w-5 text-right text-[9px]">{blueprintScale}m</span>
          </label>
          <label className="flex items-center gap-1">
            Saydamlık:
            <input type="range" min={0.1} max={1} step={0.05} value={blueprintOpacity}
              onChange={e => setBlueprintOpacity(parseFloat(e.target.value))}
              className="w-14 h-3 accent-blue-600 cursor-pointer" />
          </label>
          {aiApiKey && (
            <button
              onClick={onAiBlueprint}
              disabled={aiLoading}
              className="px-2 py-0.5 bg-amber-100 border border-amber-400/50 rounded-xl text-[9px] font-bold text-amber-800 cursor-pointer hover:bg-amber-200 disabled:opacity-40 transition-colors"
              data-testid="btn-ai-blueprint"
            >
              {aiLoading ? '⏳' : '🤖 AI Analiz'}
            </button>
          )}
          <button
            onClick={() => setBlueprint(null)}
            className="px-2 py-0.5 bg-red-50 border border-red-300/40 rounded-xl text-[9px] font-bold text-red-700 cursor-pointer hover:bg-red-100 transition-colors"
            data-testid="btn-blueprint-remove"
          >🗑</button>
        </div>
      )}

      {showCompass && !isDrawing && (
        <div className="pointer-events-auto bg-amber-50/95 backdrop-blur-sm rounded-2xl shadow-md border border-amber-400/40 py-1 px-3 text-[10px] text-amber-900 flex items-center gap-3 whitespace-nowrap flex-wrap justify-center" data-testid="sun-controls">
          <span className="font-bold">🌞 Güneş</span>
          <label className="flex items-center gap-1">
            Saat:
            <input type="range" min={0} max={24} step={0.5} value={sunHour}
              onChange={e => setSunHour(parseFloat(e.target.value))}
              className="w-20 h-3 accent-amber-600 cursor-pointer" />
            <span className="w-9 text-right text-[10px] font-mono">{sunHour.toFixed(1)}h</span>
          </label>
          <label className="flex items-center gap-1">
            Ay:
            <input type="range" min={1} max={12} step={1} value={sunMonth}
              onChange={e => setSunMonth(parseInt(e.target.value))}
              className="w-14 h-3 accent-amber-600 cursor-pointer" />
            <span className="w-4 text-right text-[10px]">{sunMonth}</span>
          </label>
          <label className="flex items-center gap-1">
            🧭 K°:
            <input type="range" min={0} max={360} step={5}
              value={Math.round((compassAngle * 180) / Math.PI)}
              onChange={e => setCompassAngle((parseFloat(e.target.value) * Math.PI) / 180)}
              className="w-16 h-3 accent-amber-600 cursor-pointer" />
            <span className="w-7 text-right text-[10px]">{Math.round((compassAngle * 180) / Math.PI)}°</span>
          </label>
        </div>
      )}

      {!isDrawing && (selRoom || selFurn) && (
        <div className="pointer-events-auto bg-white/95 backdrop-blur-sm rounded-2xl shadow-md border border-stone-300/30 py-1 px-3 text-[11px] text-stone-800 flex items-center gap-1.5 whitespace-nowrap" data-testid="selection-badge">
          {selRoom && (
            <>
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: hex(selRoom.color) }} />
              <b>{selRoomCat?.icon} {selRoomCat?.label}</b> seçili — sürükle / ↻
            </>
          )}
          {selFurn && (
            <>
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: hex(selFurn.color) }} />
              <b>{selFurnCat?.icon} {selFurnCat?.label ?? selFurn.customLabel}</b> seçili — sürükle / ↻
            </>
          )}
        </div>
      )}

      {rooms.length > 0 && (
        <div className="pointer-events-none bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-stone-200/50 py-1 px-2.5 text-[10px] text-stone-600 flex items-center gap-2 whitespace-nowrap">
          <span className="font-black text-amber-700 text-[12px]">{rooms.reduce((s, r) => s + r.widthCm * r.lengthCm / 10000, 0).toFixed(1)} m²</span>
          <span className="text-stone-400">·</span>
          <span>{rooms.length} oda</span>
          {furniture.length > 0 && <><span className="text-stone-400">·</span><span>{furniture.length} eşya</span></>}
        </div>
      )}
    </>
  )
}
