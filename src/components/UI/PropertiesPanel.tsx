import { useState, useRef } from 'react'
import { useDesignStore } from '../../store/designStore'
import { FURNITURE_CATALOG, FLOOR_TYPES, WALL_COLOR_PALETTE, MIN_DIM_CM, MAX_DIM_CM, ROOM_TYPES } from '../../types'
import type { WallSide } from '../../types'
import NumberField from './NumberField'

// ── Pusula yardımcıları ──

function wallWorldNormal(wall: WallSide, rotation: number): [number, number] {
  const normals: Record<WallSide, [number, number]> = {
    left:  [-1,  0],
    right: [ 1,  0],
    front: [ 0,  1],
    back:  [ 0, -1],
  }
  const [lx, lz] = normals[wall]
  const c = Math.cos(rotation)
  const s = Math.sin(rotation)
  return [lx * c - lz * s, lx * s + lz * c]
}

function toCardinal(wx: number, wz: number, compassAngle: number): string {
  const c = Math.cos(-compassAngle)
  const s = Math.sin(-compassAngle)
  const cx = wx * c - wz * s
  const cz = wx * s + wz * c
  const deg = (Math.atan2(cx, -cz) * 180 / Math.PI + 360) % 360
  if (deg < 22.5 || deg >= 337.5) return 'K'
  if (deg < 67.5)  return 'KD'
  if (deg < 112.5) return 'D'
  if (deg < 157.5) return 'GD'
  if (deg < 202.5) return 'G'
  if (deg < 247.5) return 'GB'
  if (deg < 292.5) return 'B'
  return 'KB'
}

export default function PropertiesPanel() {
  const [open, setOpen] = useState(true)
  const rooms = useDesignStore(s => s.rooms)
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

  const LIGHT_TYPES = new Set(['floorlamp', 'ceilinglamp', 'wallsconce'])

  // Reusable furniture row JSX
  const renderFurnItem = (f: typeof furniture[0]) => {
    const cat = FURNITURE_CATALOG.find(c => c.type === f.type)
    const isSel = selection.kind === 'furniture' && selection.id === f.id
    const isLight = LIGHT_TYPES.has(f.type)
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
            {f.type === 'custom' ? `📦 ${f.customLabel ?? 'Model'}` : `${cat?.icon} ${cat?.label}`}
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
            <NumberField
              value={f.dims[def.key] ?? def.def}
              min={def.min}
              max={def.max}
              step={1}
              unit={def.unit}
              inputClassName="w-12"
              testId={`furn-dim-${f.id}-${def.key}`}
              onChange={v => updateFurniture(f.id, { dims: { ...f.dims, [def.key]: v } })}
            />
          </div>
        ))}

        {/* Aydınlatma kontrolleri */}
        {isLight && isSel && (
          <div className="mt-1.5 pt-1.5 border-t border-stone-200/40" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold text-stone-600 flex items-center gap-1">
                💡 Işık
              </span>
              <button
                onClick={() => updateFurniture(f.id, { lightOn: !(f.lightOn ?? true) })}
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-colors ${
                  (f.lightOn ?? true)
                    ? 'bg-amber-400 text-white'
                    : 'bg-stone-200 text-stone-500'
                }`}
                data-testid={`light-toggle-${f.id}`}
              >
                {(f.lightOn ?? true) ? 'Açık' : 'Kapalı'}
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-stone-500">Şiddet</span>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={Math.round((f.lightIntensity ?? 0.6) * 100)}
                onChange={e => updateFurniture(f.id, { lightIntensity: parseInt(e.target.value) / 100 })}
                className="flex-1 h-3 accent-amber-500 cursor-pointer"
                data-testid={`light-intensity-${f.id}`}
              />
              <span className="text-[9px] text-stone-600 w-7 text-right font-mono">
                {Math.round((f.lightIntensity ?? 0.6) * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }

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
                const roomMeta = ROOM_TYPES.find(c => c.type === r.type)
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
                        {roomMeta?.icon} {roomMeta?.label ?? r.type}
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
                              onChange={e => { e.stopPropagation(); updateRoom(r.id, { floorType: e.target.value as any }) }}
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
                    {/* Openings (doors/windows) */}
                    {isSel && (
                      <div className="mt-1.5">
                        {/* Wall toggles + opening buttons */}
                        <div className="flex gap-1 mb-1">
                          {(['left', 'right', 'front', 'back'] as const).map(wall => {
                            const wallLabel = wall === 'left' ? 'Sol' : wall === 'right' ? 'Sağ' : wall === 'front' ? 'Ön' : 'Arka'
                            const isRemoved = (r.removedWalls ?? []).includes(wall)
                            const [nx, nz] = wallWorldNormal(wall, r.rotation)
                            const cardinal = toCardinal(nx, nz, compassAngle)
                            return (
                              <div key={wall} className="flex-1 flex flex-col gap-0.5">
                                <div className="text-[8px] text-stone-400 text-center leading-none">{wallLabel}</div>
                                <div className="text-[7px] text-sky-500 font-bold text-center leading-none">{cardinal}</div>
                                {/* Wall toggle */}
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
                                {/* Add opening buttons (only if wall exists) */}
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
                        {/* List openings */}
                        {(r.openings ?? []).map(op => {
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
                              {/* Type selector */}
                              <select
                                value={op.type}
                                onChange={e => { e.stopPropagation(); updateOpening(r.id, op.id, { type: e.target.value as any }) }}
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
                              {/* Dimensions */}
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
                              {/* Position slider */}
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
              <div className="text-[11.5px] font-bold text-stone-700 mb-1.5">🛋 Eşyalar ({furniture.length})</div>

              {/* Odaya bağlı mobilyalar */}
              {furnitureByRoom.map(({ room, items }) => {
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
              {furnitureUnpinned.length > 0 && (
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
