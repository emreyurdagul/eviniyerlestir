import { useMemo, useRef } from 'react'
import { useDesignStore } from '../../store/designStore'
import { FURNITURE_CATALOG } from '../../types'
import type { Room, FurnitureItem } from '../../types'

const SCALE = 1.5 // piksel/cm
const WALL_PX = 4
const PADDING = 60

function roomToScreen(room: Room) {
  const x = room.position[0] * 100 * SCALE
  const y = room.position[1] * 100 * SCALE
  const w = room.widthCm * SCALE
  const h = room.lengthCm * SCALE
  return { x, y, w, h }
}

function furnToScreen(furn: FurnitureItem) {
  const cat = FURNITURE_CATALOG.find(c => c.type === furn.type)
  const x = furn.position[0] * 100 * SCALE
  const y = furn.position[1] * 100 * SCALE
  // Approximate size from dims
  let w = 60 * SCALE, h = 60 * SCALE
  if (furn.dims.length) w = furn.dims.length * SCALE
  if (furn.dims.width) h = furn.dims.width * SCALE
  if (furn.dims.diameter) { w = furn.dims.diameter * SCALE; h = w }
  return { x, y, w, h, label: cat?.label ?? furn.customLabel ?? furn.type, icon: cat?.icon ?? '📦' }
}

export default function FloorPlan2D({ onClose }: { onClose: () => void }) {
  const rooms = useDesignStore(s => s.rooms)
  const furniture = useDesignStore(s => s.furniture)
  const svgRef = useRef<SVGSVGElement>(null)

  // Calculate bounding box
  // React 19'un react-hooks/immutability kuralına uymak için: önce tüm
  // rect'leri hesapla, sonra reduce ile bounding box'ı çıkar. Böylece
  // render sırasında let reassign yapılmamış olur (saf fonksiyonel akış).
  const { viewBox, roomRects, furnRects } = useMemo(() => {
    const roomRects = rooms.map(r => {
      const s = roomToScreen(r)
      return {
        ...s, room: r,
        left: s.x - s.w / 2,
        top: s.y - s.h / 2,
        right: s.x + s.w / 2,
        bottom: s.y + s.h / 2,
      }
    })

    const furnRects = furniture.map(f => {
      const s = furnToScreen(f)
      return {
        ...s, furn: f,
        left: s.x - s.w / 2,
        top: s.y - s.h / 2,
        right: s.x + s.w / 2,
        bottom: s.y + s.h / 2,
      }
    })

    const allRects = [...roomRects, ...furnRects]
    const bounds = allRects.reduce(
      (acc, r) => ({
        minX: Math.min(acc.minX, r.left),
        minY: Math.min(acc.minY, r.top),
        maxX: Math.max(acc.maxX, r.right),
        maxY: Math.max(acc.maxY, r.bottom),
      }),
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
    )

    const { minX, minY, maxX, maxY } = isFinite(bounds.minX)
      ? bounds
      : { minX: 0, minY: 0, maxX: 500, maxY: 500 }

    const vbX = minX - PADDING
    const vbY = minY - PADDING
    const vbW = maxX - minX + PADDING * 2
    const vbH = maxY - minY + PADDING * 2
    return { viewBox: `${vbX} ${vbY} ${vbW} ${vbH}`, roomRects, furnRects }
  }, [rooms, furniture])

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col" data-testid="floor-plan-2d">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-2 border-b border-stone-200 bg-stone-50">
        <h2 className="text-sm font-bold text-stone-800">2D Kat Plani</h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const svg = svgRef.current
              if (!svg) return
              const data = new XMLSerializer().serializeToString(svg)
              const blob = new Blob([data], { type: 'image/svg+xml' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob)
              a.download = 'eviniyerlestir-kat-plani.svg'
              a.click()
              URL.revokeObjectURL(a.href)
            }}
            className="px-3 py-1 text-xs font-semibold bg-amber-100 border border-amber-300 rounded-lg cursor-pointer hover:bg-amber-200"
          >
            SVG Indir
          </button>
          <button
            onClick={() => window.print()}
            className="px-3 py-1 text-xs font-semibold bg-blue-100 border border-blue-300 rounded-lg cursor-pointer hover:bg-blue-200"
          >
            PDF Yazdır
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1 text-xs font-semibold bg-stone-200 border border-stone-300 rounded-lg cursor-pointer hover:bg-stone-300"
          >
            ✕ Kapat
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="flex-1 overflow-auto p-4 bg-white">
        <svg
          ref={svgRef}
          viewBox={viewBox}
          className="w-full h-full"
          style={{ maxHeight: 'calc(100vh - 60px)' }}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Grid */}
          <defs>
            <pattern id="grid" width={100 * SCALE} height={100 * SCALE} patternUnits="userSpaceOnUse">
              <path d={`M ${100 * SCALE} 0 L 0 0 0 ${100 * SCALE}`} fill="none" stroke="#e5e5e5" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect x="-9999" y="-9999" width="19998" height="19998" fill="url(#grid)" />

          {/* Rooms */}
          {roomRects.map(({ room, x, y, w, h }) => {
            const removed = room.removedWalls ?? []
            return (
              <g key={room.id}>
                {/* Floor */}
                <rect x={x - w / 2} y={y - h / 2} width={w} height={h} fill="#f5f0e8" stroke="none" />

                {/* Walls */}
                {!removed.includes('left') && <line x1={x - w / 2} y1={y - h / 2} x2={x - w / 2} y2={y + h / 2} stroke="#333" strokeWidth={WALL_PX} />}
                {!removed.includes('right') && <line x1={x + w / 2} y1={y - h / 2} x2={x + w / 2} y2={y + h / 2} stroke="#333" strokeWidth={WALL_PX} />}
                {!removed.includes('back') && <line x1={x - w / 2} y1={y - h / 2} x2={x + w / 2} y2={y - h / 2} stroke="#333" strokeWidth={WALL_PX} />}
                {!removed.includes('front') && <line x1={x - w / 2} y1={y + h / 2} x2={x + w / 2} y2={y + h / 2} stroke="#333" strokeWidth={WALL_PX} />}

                {/* Openings */}
                {(room.openings ?? []).map(op => {
                  const posNorm = op.positionAlongWall
                  const opW = op.widthCm * SCALE
                  let ox: number, oy: number, ow: number, oh: number
                  const isHoriz = op.wall === 'front' || op.wall === 'back'
                  if (isHoriz) {
                    ox = x - w / 2 + posNorm * w - opW / 2
                    oy = op.wall === 'back' ? y - h / 2 - WALL_PX / 2 : y + h / 2 - WALL_PX / 2
                    ow = opW; oh = WALL_PX
                  } else {
                    oy = y - h / 2 + posNorm * h - opW / 2
                    ox = op.wall === 'left' ? x - w / 2 - WALL_PX / 2 : x + w / 2 - WALL_PX / 2
                    ow = WALL_PX; oh = opW
                  }
                  // Açıklık merkezi (yay çizmek için)
                  const cx2 = ox + ow / 2
                  const cy2 = oy + oh / 2
                  const isGlass = op.type === 'panoramic' || op.type === 'french-balcony'
                  const isTriple = op.type === 'triple-window'

                  return (
                    <g key={op.id}>
                      {/* Açıklık boşluğu: beyaz dolgu */}
                      <rect x={ox} y={oy} width={ow} height={oh} fill="white" />

                      {/* Tek kapı: yay + pervaz çizgisi */}
                      {op.type === 'door' && isHoriz && (
                        <>
                          <line x1={ox} y1={cy2} x2={ox + ow} y2={cy2} stroke="#8b7355" strokeWidth={1} />
                          <path d={`M ${ox} ${cy2} Q ${ox} ${cy2 - opW} ${ox + opW} ${cy2}`}
                            fill="none" stroke="#8b7355" strokeWidth={0.8} strokeDasharray="3,2" />
                        </>
                      )}
                      {op.type === 'door' && !isHoriz && (
                        <>
                          <line x1={cx2} y1={oy} x2={cx2} y2={oy + oh} stroke="#8b7355" strokeWidth={1} />
                          <path d={`M ${cx2} ${oy} Q ${cx2 + opW} ${oy} ${cx2} ${oy + opW}`}
                            fill="none" stroke="#8b7355" strokeWidth={0.8} strokeDasharray="3,2" />
                        </>
                      )}

                      {/* Çift kapı: iki yay */}
                      {op.type === 'double-door' && isHoriz && (
                        <>
                          <line x1={cx2} y1={cy2 - oh / 2} x2={cx2} y2={cy2 + oh / 2} stroke="#8b7355" strokeWidth={0.8} />
                          <path d={`M ${ox} ${cy2} Q ${ox} ${cy2 - opW / 2} ${cx2} ${cy2}`} fill="none" stroke="#8b7355" strokeWidth={0.8} strokeDasharray="2,2" />
                          <path d={`M ${ox + ow} ${cy2} Q ${ox + ow} ${cy2 - opW / 2} ${cx2} ${cy2}`} fill="none" stroke="#8b7355" strokeWidth={0.8} strokeDasharray="2,2" />
                        </>
                      )}
                      {op.type === 'double-door' && !isHoriz && (
                        <>
                          <line x1={cx2 - ow / 2} y1={cy2} x2={cx2 + ow / 2} y2={cy2} stroke="#8b7355" strokeWidth={0.8} />
                          <path d={`M ${cx2} ${oy} Q ${cx2 + opW / 2} ${oy} ${cx2} ${cy2}`} fill="none" stroke="#8b7355" strokeWidth={0.8} strokeDasharray="2,2" />
                          <path d={`M ${cx2} ${oy + oh} Q ${cx2 + opW / 2} ${oy + oh} ${cx2} ${cy2}`} fill="none" stroke="#8b7355" strokeWidth={0.8} strokeDasharray="2,2" />
                        </>
                      )}

                      {/* Sürgülü kapı: iki çakışan dikdörtgen */}
                      {op.type === 'sliding-door' && (
                        <>
                          <rect x={ox + 1} y={oy + 1} width={ow * 0.55} height={oh - 2} fill="none" stroke="#8b7355" strokeWidth={0.8} />
                          <rect x={ox + ow * 0.45 - 1} y={oy + 1} width={ow * 0.55} height={oh - 2} fill="none" stroke="#8b7355" strokeWidth={0.8} strokeDasharray="2,1" />
                        </>
                      )}

                      {/* Standart pencere: çift çizgi */}
                      {op.type === 'window' && isHoriz && (
                        <>
                          <line x1={ox} y1={cy2 - 1} x2={ox + ow} y2={cy2 - 1} stroke="#4a90d9" strokeWidth={0.8} />
                          <line x1={ox} y1={cy2 + 1} x2={ox + ow} y2={cy2 + 1} stroke="#4a90d9" strokeWidth={0.8} />
                        </>
                      )}
                      {op.type === 'window' && !isHoriz && (
                        <>
                          <line x1={cx2 - 1} y1={oy} x2={cx2 - 1} y2={oy + oh} stroke="#4a90d9" strokeWidth={0.8} />
                          <line x1={cx2 + 1} y1={oy} x2={cx2 + 1} y2={oy + oh} stroke="#4a90d9" strokeWidth={0.8} />
                        </>
                      )}

                      {/* Panoramik / Fransız balkon: mavi ince doldurma */}
                      {isGlass && (
                        <rect x={ox + 1} y={oy + 1} width={ow - 2} height={oh - 2}
                          fill="rgba(74,144,217,0.18)" stroke="#4a90d9" strokeWidth={0.8} />
                      )}

                      {/* Üçlü pencere: 3 bölüm */}
                      {isTriple && isHoriz && (
                        <>
                          <line x1={ox + ow / 3} y1={oy} x2={ox + ow / 3} y2={oy + oh} stroke="#4a90d9" strokeWidth={0.6} />
                          <line x1={ox + ow * 2 / 3} y1={oy} x2={ox + ow * 2 / 3} y2={oy + oh} stroke="#4a90d9" strokeWidth={0.6} />
                          <line x1={ox} y1={cy2} x2={ox + ow} y2={cy2} stroke="#4a90d9" strokeWidth={0.8} />
                        </>
                      )}
                      {isTriple && !isHoriz && (
                        <>
                          <line x1={ox} y1={oy + oh / 3} x2={ox + ow} y2={oy + oh / 3} stroke="#4a90d9" strokeWidth={0.6} />
                          <line x1={ox} y1={oy + oh * 2 / 3} x2={ox + ow} y2={oy + oh * 2 / 3} stroke="#4a90d9" strokeWidth={0.6} />
                          <line x1={cx2} y1={oy} x2={cx2} y2={oy + oh} stroke="#4a90d9" strokeWidth={0.8} />
                        </>
                      )}
                    </g>
                  )
                })}

                {/* Room label */}
                <text x={x} y={y - 6} textAnchor="middle" fontSize={11} fontWeight="bold" fill="#555">
                  {room.type.charAt(0).toUpperCase() + room.type.slice(1)}
                </text>

                {/* Dimension labels */}
                <text x={x} y={y + h / 2 + 16} textAnchor="middle" fontSize={9} fill="#888">
                  {room.widthCm} cm
                </text>
                <text x={x + w / 2 + 8} y={y} textAnchor="start" fontSize={9} fill="#888"
                  transform={`rotate(90, ${x + w / 2 + 8}, ${y})`}>
                  {room.lengthCm} cm
                </text>
              </g>
            )
          })}

          {/* Furniture */}
          {furnRects.map(({ furn, x, y, w, h, icon }) => (
            <g key={furn.id}>
              <rect x={x - w / 2} y={y - h / 2} width={w} height={h}
                fill="rgba(200,180,140,0.3)" stroke="#b0a080" strokeWidth={1}
                rx={3}
                transform={`rotate(${(furn.rotation * 180) / Math.PI}, ${x}, ${y})`}
              />
              <text x={x} y={y + 3} textAnchor="middle" fontSize={8} fill="#666"
                transform={`rotate(${(furn.rotation * 180) / Math.PI}, ${x}, ${y})`}>
                {icon}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  )
}
