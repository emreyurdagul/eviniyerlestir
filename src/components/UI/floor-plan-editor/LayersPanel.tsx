/**
 * LayersPanel — editör objelerinin ağaç görünümü.
 *
 * Figma layers panelinin basit versiyonu:
 *   - Collapsible kategoriler: Rect Odalar / Polygon Odalar / Serbest Duvarlar
 *   - Her satırda 👁 visibility toggle + label + metrik (m²/cm)
 *   - Click → select; Shift+click → multi-select extend; dbl-click → rename
 *
 * Visibility (hiddenIds) editör-local — 3D'ye export etkilenmez, sadece
 * render pass'te filtre görevi görür.
 */

import { useState } from 'react'

interface RectRoomItem { id: string; label: string; wCm: number; hCm: number; locked?: boolean }
interface PolyRoomItem { id: string; label: string; vertexCount: number }
interface WallItem { id: string; length: number }

interface Props {
  rectRooms: RectRoomItem[]
  polyRooms: PolyRoomItem[]
  walls: WallItem[]
  selectedIds: { rect?: string | null; poly?: string | null; wall?: string | null; multi?: Set<string> }
  hiddenIds: Set<string>
  onSelectRect: (id: string, shift?: boolean) => void
  onSelectPoly: (id: string) => void
  onSelectWall: (id: string) => void
  onToggleHidden: (id: string) => void
  onRename?: (id: string, newLabel: string) => void
}

export default function LayersPanel(p: Props) {
  const [open, setOpen] = useState({ rect: true, poly: true, walls: false })
  const [renameId, setRenameId] = useState<string | null>(null)

  const Row = ({ id, icon, label, metric, selected, locked, onClick, onDbl }: {
    id: string; icon: string; label: string; metric: string
    selected?: boolean; locked?: boolean
    onClick: (e: React.MouseEvent) => void; onDbl?: () => void
  }) => {
    const isHidden = p.hiddenIds.has(id)
    const isRenaming = renameId === id
    return (
      <div
        onClick={onClick}
        onDoubleClick={onDbl}
        className={`group flex items-center gap-1.5 px-2 py-1 cursor-pointer text-xs transition-colors
          ${selected ? 'bg-blue-100 text-blue-800 font-medium' : 'hover:bg-stone-100 text-stone-700'}
          ${isHidden ? 'opacity-50' : ''}`}
      >
        <button
          onClick={e => { e.stopPropagation(); p.onToggleHidden(id) }}
          className="w-4 flex-shrink-0 text-stone-400 hover:text-stone-700"
          title={isHidden ? 'Görünür yap' : 'Gizle'}
        >{isHidden ? '◌' : '👁'}</button>
        <span className="w-4 flex-shrink-0 text-center">{icon}</span>
        {isRenaming && p.onRename ? (
          <input
            autoFocus defaultValue={label}
            onFocus={e => e.currentTarget.select()}
            onBlur={e => { p.onRename?.(id, e.currentTarget.value.trim()); setRenameId(null) }}
            onKeyDown={e => {
              if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur()
              if (e.key === 'Escape') setRenameId(null)
            }}
            onClick={e => e.stopPropagation()}
            className="flex-1 px-1 py-0 bg-white border border-blue-500 rounded text-xs outline-none"
          />
        ) : (
          <span className="flex-1 truncate">{label}</span>
        )}
        {locked && <span className="text-[10px]" title="Kilitli">🔒</span>}
        <span className="text-[10px] text-stone-400 ml-auto whitespace-nowrap">{metric}</span>
      </div>
    )
  }

  const handleDblRect = (id: string) => setRenameId(id)

  const SectionHeader = ({ id, label, count }: { id: keyof typeof open; label: string; count: number }) => (
    <button
      onClick={() => setOpen(o => ({ ...o, [id]: !o[id] }))}
      className="w-full flex items-center gap-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-stone-500 hover:bg-stone-100"
    >
      <span>{open[id] ? '▼' : '▶'}</span>
      <span>{label}</span>
      <span className="ml-auto text-stone-400">({count})</span>
    </button>
  )

  return (
    <div className="flex flex-col text-xs border-b border-stone-200">
      <div className="px-3 pt-2 pb-1 text-[10px] text-stone-400 font-semibold uppercase tracking-wide">
        📋 Katmanlar
      </div>

      <SectionHeader id="rect" label="Dikdörtgen Odalar" count={p.rectRooms.length} />
      {open.rect && p.rectRooms.map(r => (
        <Row
          key={r.id} id={r.id} icon="▭"
          label={r.label}
          metric={`${((r.wCm/100)*(r.hCm/100)).toFixed(1)} m²`}
          selected={p.selectedIds.rect === r.id || p.selectedIds.multi?.has(r.id)}
          locked={r.locked}
          onClick={e => p.onSelectRect(r.id, e.shiftKey)}
          onDbl={() => handleDblRect(r.id)}
        />
      ))}

      {p.polyRooms.length > 0 && (<>
        <SectionHeader id="poly" label="Polygon Odalar" count={p.polyRooms.length} />
        {open.poly && p.polyRooms.map(r => (
          <Row
            key={r.id} id={r.id} icon="⬟"
            label={r.label}
            metric={`${r.vertexCount} köşe`}
            selected={p.selectedIds.poly === r.id}
            onClick={() => p.onSelectPoly(r.id)}
          />
        ))}
      </>)}

      {p.walls.length > 0 && (<>
        <SectionHeader id="walls" label="Serbest Duvarlar" count={p.walls.length} />
        {open.walls && p.walls.map(w => (
          <Row
            key={w.id} id={w.id} icon="─"
            label={`Duvar ${w.id.slice(0, 6)}`}
            metric={`${Math.round(w.length)} cm`}
            selected={p.selectedIds.wall === w.id}
            onClick={() => p.onSelectWall(w.id)}
          />
        ))}
      </>)}
    </div>
  )
}
