import { useState } from 'react'
import { useDesignStore } from '../../store/designStore'

interface WelcomeProps {
  onStartEmpty: () => void
  onChoosePreset: () => void
  onStartTour: () => void
}

export default function Welcome({ onStartEmpty, onChoosePreset, onStartTour }: WelcomeProps) {
  const setHasSeenWelcome = useDesignStore(s => s.setHasSeenWelcome)
  const [dontShow, setDontShow] = useState(true)  // varsayılan: bir daha gösterme

  const dismiss = (next: () => void) => {
    if (dontShow) setHasSeenWelcome(true)
    next()
  }

  return (
    <div
      className="fixed inset-0 z-[320] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      data-testid="welcome"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-300/50 w-full max-w-lg overflow-hidden">
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-amber-100 via-amber-50 to-sky-50 px-6 py-5 border-b border-stone-200/50">
          <div className="text-2xl font-bold text-stone-800 flex items-center gap-2">
            🏠 EviniYerleştir'e Hoş Geldiniz!
          </div>
          <div className="text-[12px] text-stone-600 mt-1 leading-relaxed">
            3D ev planlayıcı — odaları tasarlayın, mobilyaları yerleştirin, AI ile yerleşim önerileri alın.
          </div>
        </div>

        {/* CTA'lar */}
        <div className="p-4 space-y-2">
          <button
            onClick={() => dismiss(onChoosePreset)}
            className="w-full text-left p-3 rounded-xl bg-amber-50 border-2 border-amber-300 hover:bg-amber-100 hover:border-amber-400 transition-all cursor-pointer group"
            data-testid="welcome-presets"
          >
            <div className="flex items-center gap-3">
              <div className="text-3xl">📋</div>
              <div className="flex-1">
                <div className="text-sm font-bold text-stone-800 group-hover:text-amber-800">
                  Hazır Şablondan Başla <span className="text-[10px] font-normal text-amber-700 ml-1">ÖNERİLEN</span>
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                  Stüdyo, 1+1, 2+1, 3+1 daire veya açık plan — tek tıkla kullanıma hazır
                </div>
              </div>
              <div className="text-stone-400 group-hover:text-amber-600">→</div>
            </div>
          </button>

          <button
            onClick={() => dismiss(onStartTour)}
            className="w-full text-left p-3 rounded-xl bg-sky-50 border border-sky-200 hover:bg-sky-100 hover:border-sky-300 transition-all cursor-pointer group"
            data-testid="welcome-tour"
          >
            <div className="flex items-center gap-3">
              <div className="text-3xl">👋</div>
              <div className="flex-1">
                <div className="text-sm font-bold text-stone-800 group-hover:text-sky-800">
                  Kısa Tura Başla
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                  5 adımda uygulamayı keşfedin — toolbar, canvas, AI özellikleri
                </div>
              </div>
              <div className="text-stone-400 group-hover:text-sky-600">→</div>
            </div>
          </button>

          <button
            onClick={() => dismiss(onStartEmpty)}
            className="w-full text-left p-3 rounded-xl bg-stone-50 border border-stone-200 hover:bg-stone-100 hover:border-stone-300 transition-all cursor-pointer group"
            data-testid="welcome-empty"
          >
            <div className="flex items-center gap-3">
              <div className="text-3xl">✏️</div>
              <div className="flex-1">
                <div className="text-sm font-bold text-stone-800">
                  Boş Başla
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                  Soldaki panelden oda ve mobilya ekleyerek sıfırdan tasarla
                </div>
              </div>
              <div className="text-stone-400 group-hover:text-stone-600">→</div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-stone-50/60 border-t border-stone-200/50 flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-[11px] text-stone-500 cursor-pointer">
            <input
              type="checkbox"
              checked={dontShow}
              onChange={e => setDontShow(e.target.checked)}
              className="accent-amber-500 cursor-pointer"
              data-testid="welcome-dontshow"
            />
            <span>Bir daha gösterme</span>
          </label>
          <div className="text-[10px] text-stone-400">
            Yardımı her zaman sağ üstteki <b className="text-stone-600">?</b> butonundan açabilirsiniz
          </div>
        </div>
      </div>
    </div>
  )
}
