import { useState, useRef } from 'react'
import { useDesignStore } from '../../store/designStore'
import {
  FLOOR_TYPES, WALL_COLOR_PALETTE, MIN_DIM_CM, MAX_DIM_CM, ROOM_TYPES,
} from '../../types'
import type { FloorType, OpeningType } from '../../types'
import NumberField from './NumberField'
import PlanSummary from './PlanSummary'
import FurnitureRow from './FurnitureRow'
import { wallWorldNormal, toCardinal } from '../../utils/compass'

interface PropertiesPanelProps {
  onShowPresets?: () => void
}

export default function PropertiesPanel({ onShowPresets }: PropertiesPanelProps = {}) {
  const [open, setOpen] = useState(true)
  const rooms = useDesignStore(s => s.rooms)
  const addRoom = useDesignStore(s => s.addRoom)
  const furniture = useDesignStore(s => s.furniture)
  const selection = useDesignStore(s => s.selection)
  const updateRoom = useDesignStore(s => s.updateRoom)
  const updateFurniture = useDesignStore(s => s.updateFurniture)
  const removeRoom = useDesignStore(s => s.removeRoom)
  const removeFurniture = useDesignStore(s => s.removeFurniture)
  const addOpening = useDesignStore(s => s.addOpening)
  const removeOpening = useDesignStore(s => s.removeOpening)
  const updateOpening = useDesignStore(s => s.updateOpening)
  const selectOpening = useDesignStore(s => s.selectOpening)
  const toggleWall = useDesignStore(s => s.toggleWall)
  const addPolygonOpening = useDesignStore(s => s.addPolygonOpening)
  const togglePolygonWall = useDesignStore(s => s.togglePolygonWall)
  const setWallColor = useDesignStore(s => s.setWallColor)
  const select = useDesignStore(s => s.select)
  const compassAngle = useDesignStore(s => s.compassAngle)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hex = (c: number) => '#' + c.toString(16).padStart(6, '0')

  // Furniture grouped by room
  const furnitureByRoom = rooms.map(r => ({
    room: r,
    items: furniture.filter(f => f.parentRoomId === r.id),
  })).filter(g => g.items.length > 0)
  const furnitureUnpinned = furniture.filter(f => !f.parentRoomId)

  // ── Plan istatistikleri ──
  const totalAreaM2 = rooms.reduce((s, r) => s + r.widthCm * r.lengthCm / 10000, 0)
  const livingTypes = new Set(['salon', 'yatak', 'cocuk'])
  const serviceTypes = new Set(['mutfak', 'banyo', 'koridor'])
  const livingAreaM2 = rooms.filter(r => livingTypes.has(r.type))
    .reduce((s, r) => s + r.widthCm * r.lengthCm / 10000, 0)
  const serviceAreaM2 = rooms.filter(r => serviceTypes.has(r.type))
    .reduce((s, r) => s + r.widthCm * r.lengthCm / 10000, 0)

  // Bölüm collapse durumları
  const [roomsCollapsed, setRoomsCollapsed] = useState(false)
  const [furnCollapsed, setFurnCollapsed] = useState(false)

  // Reusable furniture row — FurnitureRow bileşenini store'a bağlayan shim.
  const renderFurnItem = (f: typeof furniture[0]) => {
    const isSel = selection.kind === 'furniture' && selection.id === f.id
    return (
      <FurnitureRow
        key={f.id}
        furniture={f}
        isSelected={isSel}
        onSelect={() => select('furniture', f.id)}
        onRemove={() => removeFurniture(f.id)}
        onUpdate={patch => updateFurniture(f.id, patch)}
      />
    )
  }

  return (
    <div className="absolute top-3 right-3 sm:flex-col sm:items-end flex flex-col gap-1.5 items-end z-10" data-testid="properties-panel">
      <button
        onClick={() => setOpen(o => !o)}
        className="bg-white/95 backdrop-blur-sm px-3.5 py-1.5 rounded-3xl text-xs font-bold text-stone-800 border border-stone-300/40 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
        data-testid="properties-toggle"
      >
        {open ? '✕ Kapat' : '📋 Liste'}
      </button>

      {open && (
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-stone-300/30 p-2.5 w-[min(92vw,22rem)] sm:w-56 max-h-[calc(100vh-100px)] overflow-y-auto">

          {/* ── Plan Özeti ── */}
          {rooms.length > 0 && (
            <PlanSummary
              totalAreaM2={totalAreaM2}
              roomCount={rooms.length}
              furnitureCount={furniture.length}
              livingAreaM2={livingAreaM2}
              serviceAreaM2={serviceAreaM2}
            />
          )}

          {/* Rooms */}
          {rooms.length > 0 && (
            <>
              <div
                className="text-[11.5px] font-bold text-stone-700 mb-1.5 flex items-center gap-1 cursor-pointer select-none"
                onClick={() => setRoomsCollapsed(v => !v)}
              >
                🏠 Odalar ({rooms.length})
                <span className="ml-auto text-stone-400 text-[10px]">{roomsCollapsed ? '▸' : '▾'}</span>
              </div>
              {!roomsCollapsed && rooms.map(r => {
                const isSel = selection.kind === 'room' && selection.id === r.id
                const roomMeta = ROOM_TYPES.find(c => c.type === r.type)
                const roomFurnCount = furniture.filter(f => f.parentRoomId === r.id).length
                const roomOpeningCount = (r.openings ?? []).length
                const areaM2 = (r.widthCm * r.lengthCm / 10000).toFixed(1)
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
                      <div className="flex items-center gap-1 text-xs font-bold text-stone-800 min-w-0">
                        <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: hex(r.color) }} />
                        <span className="truncate">{roomMeta?.icon} {roomMeta?.label ?? r.type}</span>
                        <span className="text-[9px] font-semibold text-amber-700 shrink-0">{areaM2} m²</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        {isSel && (
                          <button
                            onClick={e => { e.stopPropagation(); updateRoom(r.id, { rotation: r.rotation + Math.PI / 2 }) }}
                            className="bg-sky-100/70 border border-sky-300/50 rounded px-1.5 py-0.5 text-sky-700 text-[10px] cursor-pointer hover:bg-sky-200/60"
                            title="90° döndür (R)"
                          >↻</button>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); removeRoom(r.id) }}
                          className="bg-red-100/60 border border-red-300/40 rounded px-1.5 text-red-600 text-[10px] cursor-pointer hover:bg-red-200/60"
                          data-testid={`room-delete-${r.id}`}
                        >✕</button>
                      </div>
                    </div>
                    {/* Meta bilgiler — mobilya + açıklık sayısı */}
                    {!isSel && (roomFurnCount > 0 || roomOpeningCount > 0) && (
                      <div className="flex gap-1.5 text-[9px] text-stone-400 mb-0.5">
                        {roomFurnCount > 0 && <span>🛋 {roomFurnCount} eşya</span>}
                        {roomOpeningCount > 0 && <span>🚪 {roomOpeningCount} açıklık</span>}
                        <span className="ml-auto">{r.widthCm}×{r.lengthCm} cm</span>
                      </div>
                    )}
                    {/* Boyutlar — yalnızca seçiliyken */}
                    {isSel && r.shape !== 'polygon' && (
                      <div className="flex gap-1.5 mb-1">
                        {([['En', 'widthCm'], ['Boy', 'lengthCm']] as const).map(([label, key]) => (
                          <div key={key} className="flex-1">
                            <div className="text-[9px] text-stone-500 mb-0.5">{label}</div>
                            <NumberField
                              value={r[key]}
                              min={MIN_DIM_CM}
                              max={MAX_DIM_CM}
                              step={5}
                              unit="cm"
                              inputClassName="w-12"
                              testId={`room-dim-${r.id}-${key}`}
                              onChange={v => updateRoom(r.id, { [key]: v })}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Polygon: boyut değiştirme desteklenmiyor — salt okunur bilgi */}
                    {isSel && r.shape === 'polygon' && (
                      <div className="text-[9px] text-stone-400 italic mb-1 px-0.5">
                        ⬡ {r.vertices?.length ?? 0} köşe · {r.widthCm}×{r.lengthCm} cm (sınır)
                      </div>
                    )}
                    {/* Wall colors + Floor type */}
                    {isSel && (
                      <div className="mt-1.5">
                        {/* Inner wall color */}
                        <div className="mb-1">
                          <div className="text-[9px] text-stone-500 mb-0.5 flex items-center gap-1">
                            İç Cephe
                            <span className="w-3 h-3 rounded-sm border border-stone-300/60 inline-block" style={{ background: r.wallColor ?? '#e3ddd4' }} />
                            <input type="color" value={r.wallColor ?? '#e3ddd4'}
                              onChange={e => { e.stopPropagation(); updateRoom(r.id, { wallColor: e.target.value }) }}
                              onClick={e => e.stopPropagation()}
                              className="w-4 h-3 rounded border-0 cursor-pointer p-0"
                              title="Özel renk seç"
                            />
                          </div>
                          <div className="flex flex-wrap gap-0.5">
                            {WALL_COLOR_PALETTE.map(c => (
                              <button key={c.value}
                                onClick={e => { e.stopPropagation(); updateRoom(r.id, { wallColor: c.value }) }}
                                className={`w-4 h-4 rounded-sm border cursor-pointer hover:scale-125 transition-transform ${r.wallColor === c.value ? 'border-amber-500 ring-1 ring-amber-400' : 'border-stone-300/50'}`}
                                style={{ background: c.value }}
                                title={c.label}
                                data-testid={`room-wallcolor-swatch-${c.value}`}
                              />
                            ))}
                          </div>
                        </div>
                        {/* Outer wall color */}
                        <div className="mb-1">
                          <div className="text-[9px] text-stone-500 mb-0.5 flex items-center gap-1">
                            Dış Cephe
                            <span className="w-3 h-3 rounded-sm border border-stone-300/60 inline-block" style={{ background: r.wallColorOuter ?? '#c8c0b4' }} />
                            <input type="color" value={r.wallColorOuter ?? '#c8c0b4'}
                              onChange={e => { e.stopPropagation(); updateRoom(r.id, { wallColorOuter: e.target.value }) }}
                              onClick={e => e.stopPropagation()}
                              className="w-4 h-3 rounded border-0 cursor-pointer p-0"
                              title="Özel renk seç"
                            />
                          </div>
                          <div className="flex flex-wrap gap-0.5">
                            {WALL_COLOR_PALETTE.map(c => (
                              <button key={c.value}
                                onClick={e => { e.stopPropagation(); updateRoom(r.id, { wallColorOuter: c.value }) }}
                                className={`w-4 h-4 rounded-sm border cursor-pointer hover:scale-125 transition-transform ${r.wallColorOuter === c.value ? 'border-amber-500 ring-1 ring-amber-400' : 'border-stone-300/50'}`}
                                style={{ background: c.value }}
                                title={c.label}
                                data-testid={`room-wallcolor-outer-swatch-${c.value}`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <div className="flex-1">
                            <div className="text-[9px] text-stone-500 mb-0.5">Zemin</div>
                            <select
                              value={r.floorType ?? 'parke'}
                              onChange={e => { e.stopPropagation(); updateRoom(r.id, { floorType: e.target.value as FloorType }) }}
                              onClick={e => e.stopPropagation()}
                              className="w-full py-0.5 px-1 text-[10px] font-semibold text-stone-800 bg-amber-50/90 border border-stone-300/40 rounded outline-none cursor-pointer"
                              data-testid={`room-floor-${r.id}`}
                            >
                              {FLOOR_TYPES.map(ft => (
                                <option key={ft.type} value={ft.type}>{ft.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Openings (doors/windows) + wall management */}
                    {isSel && (
                      <div className="mt-1.5">
                        {r.shape === 'polygon' && r.vertices ? (
                          /* ── Polygon: indeks tabanlı duvar yönetimi ─────────────────── */
                          <>
                            <div className="text-[9px] font-semibold text-stone-500 mb-1">
                              Duvarlar ({r.vertices.length})
                            </div>
                            {r.vertices.map((_, wallIdx) => {
                              const isWallRemoved = (r.removedWallIndices ?? []).includes(wallIdx)
                              const wallOpenings = (r.openings ?? []).filter(o => o.wallIndex === wallIdx)
                              const wallKey = String(wallIdx)
                              const wallOv = r.wallColors?.[wallKey] ?? {}
                              const curInner = wallOv.inner ?? r.wallColor ?? '#e3ddd4'
                              const curOuter = wallOv.outer ?? r.wallColorOuter ?? '#c8c0b4'
                              return (
                                <div
                                  key={wallIdx}
                                  className={`mb-1 p-1 rounded border transition-colors ${
                                    isWallRemoved
                                      ? 'border-red-200/60 bg-red-50/40'
                                      : 'border-stone-200/40 bg-stone-50/40'
                                  }`}
                                >
                                  <div className="flex items-center gap-1 mb-0.5">
                                    <span className="text-[9px] font-bold text-stone-600">Duvar {wallIdx + 1}</span>
                                    <button
                                      onClick={e => { e.stopPropagation(); togglePolygonWall(r.id, wallIdx) }}
                                      className={`ml-auto text-[8px] py-0.5 px-1.5 rounded cursor-pointer border transition-colors ${
                                        isWallRemoved
                                          ? 'bg-green-100 border-green-300/50 text-green-700 hover:bg-green-200/60'
                                          : 'bg-red-50 border-red-200/50 text-red-600 hover:bg-red-100/60'
                                      }`}
                                      title={isWallRemoved ? 'Duvarı geri getir' : 'Duvarı kaldır'}
                                    >{isWallRemoved ? '+ Geri' : '✕ Kaldır'}</button>
                                  </div>
                                  {/* Per-duvar renk — iç / dış cephe */}
                                  {!isWallRemoved && (
                                    <div className="flex items-center gap-1.5 mb-1" onClick={e => e.stopPropagation()}>
                                      <label className="flex items-center gap-0.5 cursor-pointer" title="İç cephe rengi">
                                        <span className="text-[8px] text-stone-500">İç</span>
                                        <span className="w-4 h-4 rounded border border-stone-300/50" style={{ background: curInner }} />
                                        <input type="color" value={curInner}
                                          onChange={e => setWallColor(r.id, wallKey, 'inner', e.target.value)}
                                          className="sr-only" />
                                      </label>
                                      <label className="flex items-center gap-0.5 cursor-pointer" title="Dış cephe rengi">
                                        <span className="text-[8px] text-stone-500">Dış</span>
                                        <span className="w-4 h-4 rounded border border-stone-300/50" style={{ background: curOuter }} />
                                        <input type="color" value={curOuter}
                                          onChange={e => setWallColor(r.id, wallKey, 'outer', e.target.value)}
                                          className="sr-only" />
                                      </label>
                                      {(wallOv.inner || wallOv.outer) && (
                                        <button
                                          onClick={() => { setWallColor(r.id, wallKey, 'inner', null); setWallColor(r.id, wallKey, 'outer', null) }}
                                          className="text-[8px] text-stone-400 hover:text-amber-600 cursor-pointer"
                                          title="Ana renge döndür"
                                        >↩</button>
                                      )}
                                    </div>
                                  )}
                                  {!isWallRemoved && (
                                    <div className="flex flex-wrap gap-0.5 mb-0.5">
                                      {([
                                        ['door',           '🚪'],
                                        ['double-door',    '🚪🚪'],
                                        ['sliding-door',   '↔🚪'],
                                        ['window',         '🪟'],
                                        ['panoramic',      '🏙'],
                                        ['triple-window',  '🪟🪟🪟'],
                                        ['french-balcony', '🏛'],
                                      ] as const).map(([type, icon]) => (
                                        <button
                                          key={type}
                                          onClick={e => { e.stopPropagation(); addPolygonOpening(r.id, wallIdx, type) }}
                                          className="text-[9px] py-0.5 px-1 bg-stone-100 border border-stone-300/40 rounded cursor-pointer hover:bg-stone-200/60"
                                          title={type}
                                        >{icon}</button>
                                      ))}
                                    </div>
                                  )}
                                  {/* Bu duvardaki açıklıklar */}
                                  {wallOpenings.map(op => {
                                    const typeLabels: Record<string, string> = {
                                      'door': '🚪 Kapı', 'double-door': '🚪🚪 Çift', 'sliding-door': '↔🚪 Sürgülü',
                                      'window': '🪟 Pencere', 'panoramic': '🏙 Panoramik',
                                      'triple-window': '🪟🪟🪟 Üçlü', 'french-balcony': '🏛 Fransız',
                                    }
                                    const isOpSel = selection.kind === 'opening' && selection.id === op.id
                                    return (
                                      <div
                                        key={op.id}
                                        className={`mb-0.5 p-0.5 rounded border cursor-pointer transition-colors ${isOpSel ? 'bg-amber-50 border-amber-400/60' : 'bg-white border-stone-200/30 hover:border-stone-300/50'}`}
                                        onClick={e => { e.stopPropagation(); selectOpening(op.id, r.id) }}
                                      >
                                        <div className="flex justify-between items-center text-[9px] text-stone-600">
                                          <span className={`font-medium ${isOpSel ? 'text-amber-700' : ''}`}>{typeLabels[op.type] ?? op.type}</span>
                                          <button onClick={e => { e.stopPropagation(); removeOpening(r.id, op.id) }}
                                            className="text-red-500 cursor-pointer hover:text-red-700 text-[8px]"
                                          >✕</button>
                                        </div>
                                        {isOpSel && (
                                          <>
                                            <select
                                              value={op.type}
                                              onChange={e => { e.stopPropagation(); updateOpening(r.id, op.id, { type: e.target.value as OpeningType }) }}
                                              onClick={e => e.stopPropagation()}
                                              className="w-full mt-0.5 text-[9px] border border-stone-300/40 rounded bg-white cursor-pointer"
                                            >
                                              <option value="door">🚪 Kapı</option>
                                              <option value="double-door">🚪🚪 Çift Kanatlı</option>
                                              <option value="sliding-door">↔🚪 Sürgülü</option>
                                              <option value="window">🪟 Pencere</option>
                                              <option value="panoramic">🏙 Panoramik</option>
                                              <option value="triple-window">🪟🪟🪟 Üçlü</option>
                                              <option value="french-balcony">🏛 Fransız Balkon</option>
                                            </select>
                                            <div className="flex gap-1 mt-0.5" onClick={e => e.stopPropagation()}>
                                              <div className="flex items-center gap-0.5 flex-1">
                                                <span className="text-[8px] text-stone-400">G</span>
                                                <NumberField value={op.widthCm} min={30} max={500} step={5} unit="cm"
                                                  inputClassName="w-10 text-[9px]"
                                                  onChange={v => updateOpening(r.id, op.id, { widthCm: v })} />
                                              </div>
                                              <div className="flex items-center gap-0.5 flex-1">
                                                <span className="text-[8px] text-stone-400">Y</span>
                                                <NumberField value={op.heightCm} min={50} max={300} step={5} unit="cm"
                                                  inputClassName="w-10 text-[9px]"
                                                  onChange={v => updateOpening(r.id, op.id, { heightCm: v })} />
                                              </div>
                                              <div className="flex items-center gap-0.5 flex-1">
                                                <span className="text-[8px] text-stone-400">Z</span>
                                                <NumberField value={op.bottomCm} min={0} max={200} step={5} unit="cm"
                                                  inputClassName="w-10 text-[9px]"
                                                  onChange={v => updateOpening(r.id, op.id, { bottomCm: v })} />
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-1 mt-0.5">
                                              <span className="text-[8px] text-stone-400">Konum:</span>
                                              <input
                                                type="range" min={0.1} max={0.9} step={0.01}
                                                value={op.positionAlongWall}
                                                onChange={e => { e.stopPropagation(); updateOpening(r.id, op.id, { positionAlongWall: parseFloat(e.target.value) }) }}
                                                onClick={e => e.stopPropagation()}
                                                className="flex-1 h-3 cursor-pointer accent-amber-600"
                                              />
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              )
                            })}
                          </>
                        ) : (
                          /* ── Dikdörtgen: sol/ön/sağ/arka duvar yönetimi ─────────────── */
                          <>
                            <div className="flex gap-1 mb-1">
                              {(['left', 'right', 'front', 'back'] as const).map(wall => {
                                const wallLabel = wall === 'left' ? 'Sol' : wall === 'right' ? 'Sağ' : wall === 'front' ? 'Ön' : 'Arka'
                                const isRemoved = (r.removedWalls ?? []).includes(wall)
                                const [nx, nz] = wallWorldNormal(wall, r.rotation)
                                const cardinal = toCardinal(nx, nz, compassAngle)
                                return (
                                  <div key={wall} className="flex-1 flex flex-col gap-0.5">
                                    <div className="text-[8px] text-stone-400 text-center leading-none">{wallLabel}</div>
                                    <div
                                      className="text-[7px] text-sky-500 font-bold text-center leading-none"
                                      title={`${wallLabel} duvarın pusula yönü — Kuzey (K) / Güney (G) / Doğu (D) / Batı (B). Pusula ayarını alttan değiştirebilirsiniz.`}
                                    >{cardinal}</div>
                                    <button
                                      onClick={e => { e.stopPropagation(); toggleWall(r.id, wall) }}
                                      className={`text-[8px] py-0.5 rounded cursor-pointer border transition-colors ${
                                        isRemoved
                                          ? 'bg-red-100 border-red-300/50 text-red-600'
                                          : 'bg-green-50 border-green-300/40 text-green-700'
                                      }`}
                                      title={isRemoved ? 'Duvarı geri getir' : 'Duvarı kaldır'}
                                      data-testid={`toggle-wall-${wall}-${r.id}`}
                                    >{isRemoved ? '✕' : '▮'}</button>
                                    {!isRemoved && (
                                      <div className="flex flex-wrap gap-0.5">
                                        {([
                                          ['door',           '🚪'],
                                          ['double-door',    '🚪🚪'],
                                          ['sliding-door',   '↔🚪'],
                                          ['window',         '🪟'],
                                          ['panoramic',      '🏙'],
                                          ['triple-window',  '🪟🪟🪟'],
                                          ['french-balcony', '🏛'],
                                        ] as const).map(([type, icon]) => (
                                          <button
                                            key={type}
                                            onClick={e => { e.stopPropagation(); addOpening(r.id, wall, type) }}
                                            className="text-[9px] py-0.5 px-1 bg-stone-100 border border-stone-300/40 rounded cursor-pointer hover:bg-stone-200/60"
                                            title={type}
                                            data-testid={`add-${type}-${wall}-${r.id}`}
                                          >{icon}</button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                            {/* Açıklıklar listesi — sadece dikdörtgen oda */}
                            {(r.openings ?? []).filter(o => o.wallIndex === undefined).map(op => {
                              const wallLabel = op.wall === 'left' ? 'Sol' : op.wall === 'right' ? 'Sağ' : op.wall === 'front' ? 'Ön' : 'Arka'
                              const typeLabels: Record<string, string> = {
                                'door': '🚪 Kapı', 'double-door': '🚪🚪 Çift Kapı', 'sliding-door': '↔🚪 Sürgülü',
                                'window': '🪟 Pencere', 'panoramic': '🏙 Panoramik',
                                'triple-window': '🪟🪟🪟 Üçlü', 'french-balcony': '🏛 Fransız',
                              }
                              const isOpSelected = selection.kind === 'opening' && selection.id === op.id
                              return (
                                <div
                                  key={op.id}
                                  className={`mb-1 p-1 rounded border cursor-pointer transition-colors ${isOpSelected ? 'bg-amber-50 border-amber-400/60' : 'bg-stone-50 border-stone-200/30 hover:border-stone-300/50'}`}
                                  onClick={e => { e.stopPropagation(); selectOpening(op.id, r.id) }}
                                >
                                  <div className="flex justify-between items-center text-[9px] text-stone-600">
                                    <span className={`font-medium ${isOpSelected ? 'text-amber-700' : ''}`}>{typeLabels[op.type] ?? op.type} — {wallLabel}</span>
                                    <button
                                      onClick={e => { e.stopPropagation(); removeOpening(r.id, op.id) }}
                                      className="text-red-500 cursor-pointer hover:text-red-700 text-[8px]"
                                    >✕</button>
                                  </div>
                                  <select
                                    value={op.type}
                                    onChange={e => { e.stopPropagation(); updateOpening(r.id, op.id, { type: e.target.value as OpeningType }) }}
                                    onClick={e => e.stopPropagation()}
                                    className="w-full mt-0.5 text-[9px] border border-stone-300/40 rounded bg-white cursor-pointer"
                                  >
                                    <option value="door">🚪 Kapı</option>
                                    <option value="double-door">🚪🚪 Çift Kanatlı Kapı</option>
                                    <option value="sliding-door">↔🚪 Sürgülü Kapı</option>
                                    <option value="window">🪟 Standart Pencere</option>
                                    <option value="panoramic">🏙 Panoramik</option>
                                    <option value="triple-window">🪟🪟🪟 Üçlü Pencere</option>
                                    <option value="french-balcony">🏛 Fransız Balkon</option>
                                  </select>
                                  <div className="flex gap-1 mt-0.5" onClick={e => e.stopPropagation()}>
                                    <div className="flex items-center gap-0.5 flex-1">
                                      <span className="text-[8px] text-stone-400">G</span>
                                      <NumberField
                                        value={op.widthCm} min={30} max={500} step={5} unit="cm"
                                        inputClassName="w-10 text-[9px]"
                                        onChange={v => updateOpening(r.id, op.id, { widthCm: v })}
                                      />
                                    </div>
                                    <div className="flex items-center gap-0.5 flex-1">
                                      <span className="text-[8px] text-stone-400">Y</span>
                                      <NumberField
                                        value={op.heightCm} min={50} max={300} step={5} unit="cm"
                                        inputClassName="w-10 text-[9px]"
                                        onChange={v => updateOpening(r.id, op.id, { heightCm: v })}
                                      />
                                    </div>
                                    <div className="flex items-center gap-0.5 flex-1">
                                      <span className="text-[8px] text-stone-400">Z</span>
                                      <NumberField
                                        value={op.bottomCm} min={0} max={200} step={5} unit="cm"
                                        inputClassName="w-10 text-[9px]"
                                        onChange={v => updateOpening(r.id, op.id, { bottomCm: v })}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <span className="text-[8px] text-stone-400">Konum:</span>
                                    <input
                                      type="range"
                                      min={0.1} max={0.9} step={0.01}
                                      value={op.positionAlongWall}
                                      onChange={e => { e.stopPropagation(); updateOpening(r.id, op.id, { positionAlongWall: parseFloat(e.target.value) }) }}
                                      onClick={e => e.stopPropagation()}
                                      className="flex-1 h-3 cursor-pointer accent-amber-600"
                                      data-testid={`opening-pos-${op.id}`}
                                    />
                                  </div>
                                </div>
                              )
                            })}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
              <div className="border-t border-stone-200/30 my-1.5" />
            </>
          )}

          {/* Furniture — odaya göre gruplandırılmış */}
          {furniture.length > 0 && (
            <>
              <div
                className="text-[11.5px] font-bold text-stone-700 mb-1.5 flex items-center gap-1 cursor-pointer select-none"
                onClick={() => setFurnCollapsed(v => !v)}
              >
                🛋 Eşyalar ({furniture.length})
                <span className="ml-auto text-stone-400 text-[10px]">{furnCollapsed ? '▸' : '▾'}</span>
              </div>

              {/* Odaya bağlı mobilyalar */}
              {!furnCollapsed && furnitureByRoom.map(({ room, items }) => {
                const roomMeta = ROOM_TYPES.find(c => c.type === room.type)
                return (
                  <div key={room.id} className="mb-1.5">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-stone-600 mb-0.5 px-0.5">
                      <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: hex(room.color) }} />
                      {roomMeta?.icon} {roomMeta?.label ?? room.type}
                      <span className="text-stone-400 font-normal ml-auto">({items.length})</span>
                    </div>
                    <div className="pl-2 border-l-2" style={{ borderColor: hex(room.color) + '60' }}>
                      {items.map(renderFurnItem)}
                    </div>
                  </div>
                )
              })}

              {/* Oda dışı mobilyalar */}
              {!furnCollapsed && furnitureUnpinned.length > 0 && (
                <div className="mb-1.5">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-stone-500 mb-0.5 px-0.5">
                    📦 Oda dışı
                    <span className="text-stone-400 font-normal ml-auto">({furnitureUnpinned.length})</span>
                  </div>
                  <div className="pl-2 border-l-2 border-stone-300/40">
                    {furnitureUnpinned.map(renderFurnItem)}
                  </div>
                </div>
              )}
            </>
          )}

          {rooms.length === 0 && furniture.length === 0 && (
            <div className="text-center py-3 px-1">
              <div className="text-3xl mb-2">🏠</div>
              <div className="text-xs font-semibold text-stone-700 mb-1">
                Başlamak için
              </div>
              <div className="text-[11px] text-stone-500 mb-3 leading-relaxed">
                Hazır bir şablon seçebilir veya bir oda ekleyerek sıfırdan tasarlayabilirsiniz.
              </div>
              {onShowPresets && (
                <button
                  onClick={onShowPresets}
                  className="w-full py-2 mb-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold cursor-pointer hover:bg-amber-600 transition-colors"
                  data-testid="empty-presets"
                >
                  📋 Şablon Seç
                </button>
              )}
              <button
                onClick={() => addRoom('salon')}
                className="w-full py-2 rounded-lg bg-stone-100 border border-stone-300/60 text-stone-700 text-xs font-semibold cursor-pointer hover:bg-stone-200 transition-colors"
                data-testid="empty-add-salon"
              >
                🛋 Salon Ekle
              </button>
              <div className="text-[10px] text-stone-400 mt-2 leading-snug">
                Soldaki panelden de oda/mobilya ekleyebilirsiniz.
              </div>
            </div>
          )}
        </div>
      )}
      <input ref={fileInputRef} type="file" accept=".json" className="hidden" />
    </div>
  )
}
