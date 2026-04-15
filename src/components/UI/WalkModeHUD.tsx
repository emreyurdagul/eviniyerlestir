/**
 * WalkModeHUD — Walk mode aktifken ekranda gösterilen overlay.
 *
 * - Merkezde küçük beyaz crosshair (nereye bakıyorum?)
 * - Alt-orta yardım satırı: "WASD = Hareket • Shift = Koş • Esc = Çık"
 * - Tüm pointer olaylarını geçirir (`pointer-events-none`) — tıklamalar
 *   3D sahneye ulaşır.
 */

import { useDesignStore } from '../../store/designStore'

export default function WalkModeHUD() {
  const walkMode = useDesignStore(s => s.walkMode)
  if (!walkMode) return null

  return (
    <>
      {/* Merkez crosshair */}
      <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-white/70 ring-1 ring-black/30 shadow" />
      </div>

      {/* Alt-orta yardım satırı */}
      <div className="pointer-events-none fixed bottom-16 left-1/2 -translate-x-1/2 z-30">
        <div className="bg-black/70 backdrop-blur-sm text-white text-xs px-4 py-2 rounded-full shadow-xl border border-white/10 flex items-center gap-3 font-medium">
          <span>⌨ <kbd className="font-mono font-bold">WASD</kbd> Hareket</span>
          <span className="text-white/40">•</span>
          <span><kbd className="font-mono font-bold">Shift</kbd> Koş</span>
          <span className="text-white/40">•</span>
          <span>🖱 Bak</span>
          <span className="text-white/40">•</span>
          <span><kbd className="font-mono font-bold">Esc</kbd> Çık</span>
        </div>
      </div>
    </>
  )
}
