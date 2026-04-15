/**
 * FloorTabs — #6 Multi-floor UI.
 *
 * Sol üstte dikey tab bar:
 *   - Aktif kat amber vurgulu
 *   - Kat üzerinde ✎ (yeniden adlandır), ⚙ (kat ayarları = ceiling height),
 *     ✕ (sil) butonları hover ile görünür
 *   - "+ Kat Ekle" butonu
 *
 * ⚙ tıklayınca küçük popover açılır — slider ile 2.0–4.0 m arası
 * kat-özel tavan yüksekliği ayarlanır. "Global'e Dön" butonu özel değeri
 * siler, kat global ayara düşer.
 *
 * Walk mode'da gizlenir (immersive deneyim).
 */

import { useState } from 'react'
import { useDesignStore } from '../../store/designStore'

export default function FloorTabs() {
  const floors = useDesignStore(s => s.floors)
  const activeFloorId = useDesignStore(s => s.activeFloorId)
  const setActiveFloor = useDesignStore(s => s.setActiveFloor)
  const addFloor = useDesignStore(s => s.addFloor)
  const removeFloor = useDesignStore(s => s.removeFloor)
  const renameFloor = useDesignStore(s => s.renameFloor)
  const setFloorCeilingHeight = useDesignStore(s => s.setFloorCeilingHeight)
  const resetFloorCeilingHeight = useDesignStore(s => s.resetFloorCeilingHeight)
  const globalCeiling = useDesignStore(s => s.ceilingHeight)
  const walkMode = useDesignStore(s => s.walkMode)
  // Her kat için oda sayısı (badge)
  const rooms = useDesignStore(s => s.rooms)
  const roomCountByFloor = floors.reduce<Record<string, number>>((acc, f) => {
    acc[f.id] = rooms.filter(r => (r.floorId ?? floors[0].id) === f.id).length
    return acc
  }, {})

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [settingsId, setSettingsId] = useState<string | null>(null)

  if (walkMode) return null

  const onlyOne = floors.length === 1

  const startRename = (id: string, currentLabel: string) => {
    setEditingId(id)
    setEditValue(currentLabel)
    setSettingsId(null)
  }
  const commitRename = () => {
    if (editingId && editValue.trim()) renameFloor(editingId, editValue.trim())
    setEditingId(null)
  }

  const resetCeiling = (id: string) => resetFloorCeilingHeight(id)

  return (
    <div className="absolute top-3 left-[calc(0.75rem+14rem)] sm:left-[calc(0.75rem+14rem)] z-20 flex flex-col gap-1 pointer-events-none">
      {!onlyOne && floors.slice().reverse().map(f => {
        const isActive = f.id === activeFloorId
        const isEditing = editingId === f.id
        const isSettings = settingsId === f.id
        const effectiveCeiling = f.ceilingHeight ?? globalCeiling
        const isCustom = typeof f.ceilingHeight === 'number'

        return (
          <div key={f.id} className="relative pointer-events-auto">
            <div
              className={`group flex items-center gap-1 px-2 py-1 rounded-lg shadow-md border text-[11px] font-bold backdrop-blur-sm transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-400 text-white border-amber-500 shadow-amber-200/60'
                  : 'bg-white/95 text-stone-700 border-stone-300/40 hover:shadow-lg hover:border-stone-400'
              }`}
              onClick={() => !isEditing && !isSettings && setActiveFloor(f.id)}
              title={`${f.label} — Taban ${f.baseY.toFixed(2)} m, Tavan ${effectiveCeiling.toFixed(2)} m${isCustom ? ' (özel)' : ' (global)'}`}
            >
              {isEditing ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitRename()
                    else if (e.key === 'Escape') setEditingId(null)
                  }}
                  className="w-24 bg-white/90 text-stone-800 text-[10px] font-mono px-1 rounded border border-amber-400 focus:outline-none"
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <>
                  <span className="text-[10px]">🏢</span>
                  <span className="whitespace-nowrap">{f.label}</span>
                  {roomCountByFloor[f.id] > 0 && (
                    <span
                      className={`inline-flex items-center justify-center min-w-4 h-4 px-1 text-[9px] font-bold rounded-full ${
                        isActive
                          ? 'bg-white/25 text-white'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                      title={`${roomCountByFloor[f.id]} oda bu katta`}
                    >
                      {roomCountByFloor[f.id]}
                    </span>
                  )}
                  <span className={`text-[9px] font-mono opacity-60 ml-0.5 ${isCustom ? 'italic' : ''}`}>
                    {effectiveCeiling.toFixed(2)}m
                  </span>
                  <span className={`opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5 ml-1 ${isActive ? 'text-white' : 'text-stone-400'}`}>
                    <button
                      onClick={e => { e.stopPropagation(); setSettingsId(isSettings ? null : f.id) }}
                      className={`leading-none ${isSettings ? 'text-amber-600' : 'hover:text-amber-600'}`}
                      title="Tavan yüksekliği ayarla"
                    >
                      ⚙
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); startRename(f.id, f.label) }}
                      className="hover:text-amber-600 leading-none"
                      title="Yeniden adlandır"
                    >
                      ✎
                    </button>
                    {floors.length > 1 && (
                      <button
                        onClick={e => { e.stopPropagation(); if (confirm(`"${f.label}" silinecek. Odaları başka kata taşınır.`)) removeFloor(f.id) }}
                        className="hover:text-red-500 leading-none"
                        title="Kat sil"
                      >
                        ✕
                      </button>
                    )}
                  </span>
                </>
              )}
            </div>

            {/* Kat ayarları popover — tavan yüksekliği slider */}
            {isSettings && (
              <div
                className="absolute left-full ml-1.5 top-0 bg-white/98 backdrop-blur-md rounded-xl shadow-2xl border border-stone-300/50 p-3 w-56 z-30"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-stone-800">
                    🏠 {f.label} Tavan Yüksekliği
                  </span>
                  <button
                    onClick={() => setSettingsId(null)}
                    className="text-stone-400 hover:text-stone-600 text-sm leading-none"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-stone-500">
                    {isCustom ? 'Bu kat özel değer kullanıyor' : 'Global ayar kullanılıyor'}
                  </span>
                  <span className="text-[10px] font-mono text-stone-700 font-bold">
                    {effectiveCeiling.toFixed(2)} m
                  </span>
                </div>
                <input
                  type="range"
                  min={2.0}
                  max={4.0}
                  step={0.05}
                  value={effectiveCeiling}
                  onChange={e => setFloorCeilingHeight(f.id, parseFloat(e.target.value))}
                  className="w-full h-3 accent-amber-500 cursor-pointer"
                />
                <div className="flex gap-1 mt-2">
                  {isCustom && (
                    <button
                      onClick={() => resetCeiling(f.id)}
                      className="flex-1 text-[10px] py-1 rounded border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-600 cursor-pointer"
                      title="Global tavan yüksekliğine dön"
                    >
                      ↺ Global
                    </button>
                  )}
                  <button
                    onClick={() => setSettingsId(null)}
                    className="flex-1 text-[10px] py-1 rounded bg-amber-500 hover:bg-amber-600 text-white font-bold cursor-pointer"
                  >
                    Tamam
                  </button>
                </div>
                <div className="text-[9px] text-stone-400 mt-1 leading-tight">
                  Bu kattaki tüm odalar bu yüksekliği kullanır. Üstteki kat bunun üstüne otururken taban seviyesi otomatik hesaplanır.
                </div>
              </div>
            )}
          </div>
        )
      })}
      <button
        onClick={() => addFloor()}
        className="pointer-events-auto flex items-center gap-1 px-2 py-1 rounded-lg shadow-md border text-[11px] font-bold backdrop-blur-sm bg-white/95 text-stone-500 border-stone-300/40 border-dashed hover:border-amber-400 hover:text-amber-600 transition-all cursor-pointer"
        title="Yeni kat ekle"
      >
        <span>＋</span>
        <span className="whitespace-nowrap">Kat Ekle</span>
      </button>
    </div>
  )
}
