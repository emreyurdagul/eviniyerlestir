/**
 * FloorTabs — #6 Multi-floor foundation UI.
 *
 * Tek kat varsa hiç görünmez (bu temel aşama — UI sadelik).
 * Birden fazla kat tanımlanınca sol üstte dikey tab bar belirir:
 *   - Aktif kat amber vurgulu
 *   - "+ Kat Ekle" butonu
 *   - Her katın üzerine gelince silme (X) + yeniden adlandırma (✎) kontrolleri
 *
 * Bu aşamada 3D sahne katları henüz Y-ofsetli RENDER ETMİYOR; store temeli
 * hazır, activeFloorId filtreleme mantığı sonraki iterasyonda eklenecek.
 * Şu an için kullanıcı kat ekleyip odaları farklı katlara bağlayabilir,
 * veri modeli bunu destekler.
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
  const walkMode = useDesignStore(s => s.walkMode)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  // Walk mode aktifken UI'ı gizle — immersive deneyim bozulmasın
  if (walkMode) return null

  // Tek kat varsa sadece "+" butonu göster (minimal UI)
  const onlyOne = floors.length === 1

  const startRename = (id: string, currentLabel: string) => {
    setEditingId(id)
    setEditValue(currentLabel)
  }
  const commitRename = () => {
    if (editingId && editValue.trim()) renameFloor(editingId, editValue.trim())
    setEditingId(null)
  }

  return (
    <div className="absolute top-3 left-[calc(0.75rem+14rem)] sm:left-[calc(0.75rem+14rem)] z-20 flex flex-col gap-1 pointer-events-none">
      {!onlyOne && floors.slice().reverse().map(f => {
        const isActive = f.id === activeFloorId
        const isEditing = editingId === f.id
        return (
          <div
            key={f.id}
            className={`pointer-events-auto group flex items-center gap-1 px-2 py-1 rounded-lg shadow-md border text-[11px] font-bold backdrop-blur-sm transition-all cursor-pointer ${
              isActive
                ? 'bg-amber-400 text-white border-amber-500 shadow-amber-200/60'
                : 'bg-white/95 text-stone-700 border-stone-300/40 hover:shadow-lg hover:border-stone-400'
            }`}
            onClick={() => !isEditing && setActiveFloor(f.id)}
            title={`${f.label} — Sırala: ${f.order} (taban ${f.baseY.toFixed(2)} m)`}
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
                <span className={`opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5 ml-1 ${isActive ? 'text-white' : 'text-stone-400'}`}>
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
