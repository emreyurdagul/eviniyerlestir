import { useEffect, useState, useLayoutEffect } from 'react'

interface TourStep {
  selector: string          // elementin CSS selector'ı (data-testid vs)
  title: string
  body: string
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

const STEPS: TourStep[] = [
  {
    selector: '[data-testid=toolbar]',
    title: '1. Oda ve Mobilya Ekle',
    body: 'Buradan odanızı (🏠 Oda) veya eşyalarınızı (🛋 Mobilya) seçip ekleyin. Arama kutusundan hızlı bulun, ▾ ile varyantlara bakın.',
    placement: 'right',
  },
  {
    selector: '[data-testid=scene-canvas]',
    title: '2. 3D Sahne',
    body: 'Odaları ve eşyaları sürükleyerek taşıyın. Üzerlerine sağ tıklayınca bağlam menüsü açılır. Duvara sağ tıklayıp kapı/pencere ekleyin.',
    placement: 'center',
  },
  {
    selector: '[data-testid=properties-panel]',
    title: '3. Sağ Panel — Ayrıntılar',
    body: 'Odaların ölçülerini, duvar renklerini, kapı/pencerelerini buradan düzenleyin. Seçili lambanın ışık şiddeti de burada.',
    placement: 'left',
  },
  {
    selector: '[data-testid=bottom-area]',
    title: '4. Alt Bar — Araçlar',
    body: 'Araçlar (Taşı/Boyutlandır, Çizim, Döndür), Görünüm (3D/Üst, Pusula), Dosya (Kaydet, Şablon, Yükle) ve Ayarlar menüleri burada.',
    placement: 'top',
  },
  {
    selector: '[data-testid=btn-help]',
    title: '5. Yardım Her Zaman Burada',
    body: 'Takılırsanız ? butonuyla tüm klavye kısayolları, dokunmatik hareketler ve AI özelliklerini görebilirsiniz. Hadi tasarlamaya başlayalım! 🎉',
    placement: 'bottom',
  },
]

interface TourProps {
  open: boolean
  onClose: () => void
}

export default function Tour({ open, onClose }: TourProps) {
  const [idx, setIdx] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)

  // Adım değiştiğinde hedef elementin pozisyonunu ölç
  useLayoutEffect(() => {
    if (!open) return
    const step = STEPS[idx]
    const measure = () => {
      const el = document.querySelector(step.selector) as HTMLElement | null
      if (el) {
        setRect(el.getBoundingClientRect())
        // Eleman scroll ile görünüre getir (gerekirse)
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      } else {
        setRect(null)
      }
    }
    measure()
    const ro = new ResizeObserver(measure)
    const target = document.querySelector(step.selector)
    if (target) ro.observe(target)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [idx, open])

  useEffect(() => {
    if (!open) setIdx(0)
  }, [open])

  if (!open) return null
  const step = STEPS[idx]
  const last = idx === STEPS.length - 1

  // Tooltip konumlandırma
  const tooltipStyle: React.CSSProperties = {}
  const TOOLTIP_W = 320
  const MARGIN = 14
  if (rect && step.placement !== 'center') {
    switch (step.placement) {
      case 'right':
        tooltipStyle.left = rect.right + MARGIN
        tooltipStyle.top = Math.max(MARGIN, rect.top + rect.height / 2 - 80)
        break
      case 'left':
        tooltipStyle.right = window.innerWidth - rect.left + MARGIN
        tooltipStyle.top = Math.max(MARGIN, rect.top + rect.height / 2 - 80)
        break
      case 'top':
        tooltipStyle.left = Math.max(MARGIN, rect.left + rect.width / 2 - TOOLTIP_W / 2)
        tooltipStyle.bottom = window.innerHeight - rect.top + MARGIN
        break
      case 'bottom':
        tooltipStyle.left = Math.max(MARGIN, rect.left + rect.width / 2 - TOOLTIP_W / 2)
        tooltipStyle.top = rect.bottom + MARGIN
        break
    }
  } else {
    // center fallback
    tooltipStyle.left = '50%'
    tooltipStyle.top = '50%'
    tooltipStyle.transform = 'translate(-50%, -50%)'
  }

  return (
    <div className="fixed inset-0 z-[310]" data-testid="tour">
      {/* Dim overlay with spotlight cut */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={Math.max(0, rect.left - 6)}
                y={Math.max(0, rect.top - 6)}
                width={rect.width + 12}
                height={rect.height + 12}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="black" fillOpacity="0.55" mask="url(#tour-mask)" />
        {/* Vurgu çerçevesi */}
        {rect && (
          <rect
            x={Math.max(0, rect.left - 6)}
            y={Math.max(0, rect.top - 6)}
            width={rect.width + 12}
            height={rect.height + 12}
            rx="12"
            fill="none"
            stroke="rgb(245, 158, 11)"
            strokeWidth="3"
            strokeDasharray="8 4"
          >
            <animate attributeName="stroke-dashoffset" from="0" to="12" dur="0.8s" repeatCount="indefinite" />
          </rect>
        )}
      </svg>

      {/* Tooltip */}
      <div
        className="fixed bg-white rounded-xl shadow-2xl border border-amber-300 p-4 pointer-events-auto"
        style={{ width: TOOLTIP_W, ...tooltipStyle }}
      >
        <div className="text-[11px] font-mono text-amber-700 mb-1">
          Adım {idx + 1} / {STEPS.length}
        </div>
        <div className="text-sm font-bold text-stone-800 mb-1.5">{step.title}</div>
        <div className="text-[12px] text-stone-600 leading-relaxed mb-3">{step.body}</div>
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="text-[11px] text-stone-500 hover:text-stone-700 cursor-pointer underline"
            data-testid="tour-skip"
          >
            Atla
          </button>
          <div className="flex gap-1.5">
            {idx > 0 && (
              <button
                onClick={() => setIdx(i => i - 1)}
                className="px-3 py-1.5 rounded-lg border border-stone-300 text-[11px] font-bold text-stone-700 cursor-pointer hover:bg-stone-50"
                data-testid="tour-prev"
              >
                Önceki
              </button>
            )}
            <button
              onClick={() => {
                if (last) onClose()
                else setIdx(i => i + 1)
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-[11px] font-bold cursor-pointer hover:bg-amber-600"
              data-testid={last ? 'tour-finish' : 'tour-next'}
            >
              {last ? 'Tamamla 🎉' : 'Sonraki →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
