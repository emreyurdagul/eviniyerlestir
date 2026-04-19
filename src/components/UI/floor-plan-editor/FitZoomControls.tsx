/**
 * FitZoomControls — toolbar yakın zoom butonları + kısayol ipuçları.
 *
 * Shortcut table:
 *   F  veya  0  → Fit all (tüm içeriği ekrana sığdır)
 *   1            → %100 zoom
 *   2            → Seçime zoom (seçim varsa)
 */

interface Props {
  onFitAll: () => void
  onZoom100: () => void
  onZoomSelection: () => void
  hasSelection: boolean
}

export default function FitZoomControls({ onFitAll, onZoom100, onZoomSelection, hasSelection }: Props) {
  const btn = (label: string, icon: string, shortcut: string, title: string, onClick: () => void, disabled = false) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={`${title} · ${shortcut}`}
      className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs transition-all
        ${disabled
          ? 'bg-white/5 text-stone-500 cursor-not-allowed'
          : 'bg-white/10 hover:bg-white/20 text-stone-200 cursor-pointer'}`}
    >
      <span>{icon}</span>
      <span className="hidden md:inline">{label}</span>
      <kbd className="hidden lg:inline text-[9px] font-mono bg-white/10 rounded px-1 py-0">{shortcut}</kbd>
    </button>
  )

  return (
    <div className="flex gap-1">
      {btn('Fit', '⊞', 'F', 'Tüm içeriği ekrana sığdır', onFitAll)}
      {btn('100%', '⌖', '1', '%100 zoom', onZoom100)}
      {btn('Seçim', '⛶', '2', 'Seçime zoom', onZoomSelection, !hasSelection)}
    </div>
  )
}
