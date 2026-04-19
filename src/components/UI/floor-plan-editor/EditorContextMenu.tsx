/**
 * EditorContextMenu — editör içi sağ-tık menüsü.
 *
 * Ana app'teki ContextMenu (store-bağlı) ile karıştırılmamak için ayrı.
 * Seçim tipine göre farklı aksiyonlar gösterir:
 *   - Tek rect / multi rect: Çoğalt, Döndür 90°, Hizala, Dağıt, Sil
 *   - Serbest duvar: Kapı / Pencere ekle, Sil
 *   - Polygon oda: Tip değiştir, Sil
 *   - Opening: Swing çevir, Normal çevir, Sil
 */

import { useEffect } from 'react'

export interface MenuAction {
  id: string
  label: string
  icon?: string
  shortcut?: string
  danger?: boolean
  disabled?: boolean
  onClick: () => void
}

interface Props {
  x: number; y: number
  actions: MenuAction[]
  onClose: () => void
}

export default function EditorContextMenu({ x, y, actions, onClose }: Props) {
  // Dışarı tıklama ve Escape ile kapat
  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      const el = (e.target as HTMLElement).closest('[data-editor-context-menu]')
      if (!el) onClose()
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    // Bir sonraki tick'e ertele ki aynı pointerdown'ı yakalamasın
    const t = setTimeout(() => {
      window.addEventListener('pointerdown', onPointer)
      window.addEventListener('keydown', onKey)
    }, 0)
    return () => {
      clearTimeout(t)
      window.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  // Ekran dışına taşmayı engelle — basit clamp
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1920
  const vh = typeof window !== 'undefined' ? window.innerHeight : 1080
  const left = Math.min(x, vw - 220)
  const top = Math.min(y, vh - actions.length * 30 - 10)

  return (
    <div
      data-editor-context-menu
      className="fixed z-[260] min-w-[200px] bg-stone-900 text-white rounded-lg shadow-2xl py-1 border border-stone-700"
      style={{ left, top }}
      onContextMenu={e => e.preventDefault()}
    >
      {actions.map((a, i) => (
        a.id === 'separator' ? (
          <div key={`sep${i}`} className="my-1 border-t border-stone-700" />
        ) : (
          <button
            key={a.id}
            onClick={() => { if (!a.disabled) { a.onClick(); onClose() } }}
            disabled={a.disabled}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors
              ${a.disabled ? 'opacity-40 cursor-not-allowed' :
                a.danger ? 'hover:bg-red-600 cursor-pointer' : 'hover:bg-stone-700 cursor-pointer'}`}
          >
            <span className="w-4 flex-shrink-0 text-center">{a.icon ?? ''}</span>
            <span className="flex-1">{a.label}</span>
            {a.shortcut && (
              <kbd className="text-[9px] font-mono text-stone-400 bg-stone-800 rounded px-1 py-0">
                {a.shortcut}
              </kbd>
            )}
          </button>
        )
      ))}
    </div>
  )
}
