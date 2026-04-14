import { useEffect } from 'react'
import { useDesignStore } from '../../store/designStore'
import type { ToastItem } from '../../store/designStore'

const TYPE_STYLES: Record<ToastItem['type'], { bg: string; border: string; icon: string; textClr: string }> = {
  success: { bg: 'bg-emerald-50',  border: 'border-emerald-400',  icon: '✓', textClr: 'text-emerald-800' },
  error:   { bg: 'bg-red-50',      border: 'border-red-400',      icon: '✕', textClr: 'text-red-800' },
  info:    { bg: 'bg-sky-50',      border: 'border-sky-400',      icon: 'ℹ', textClr: 'text-sky-800' },
  warning: { bg: 'bg-amber-50',    border: 'border-amber-400',    icon: '⚠', textClr: 'text-amber-800' },
}

function ToastRow({ t, onDismiss }: { t: ToastItem; onDismiss: () => void }) {
  const style = TYPE_STYLES[t.type]
  useEffect(() => {
    if (t.duration === 0) return
    const id = setTimeout(onDismiss, t.duration ?? 4000)
    return () => clearTimeout(id)
  }, [t.id, t.duration, onDismiss])

  return (
    <div
      className={`flex items-start gap-2 ${style.bg} ${style.textClr} border ${style.border} rounded-xl shadow-lg px-3 py-2 pr-2 min-w-[260px] max-w-[90vw] animate-fade-in backdrop-blur-sm`}
      role="status"
      data-testid={`toast-${t.type}`}
    >
      <span className="text-base leading-tight select-none" aria-hidden>{style.icon}</span>
      <span className="text-xs font-medium flex-1 leading-snug break-words pt-0.5">
        {t.message}
      </span>
      <button
        onClick={onDismiss}
        className="text-stone-400 hover:text-stone-700 text-sm leading-none cursor-pointer ml-1 px-1"
        aria-label="Kapat"
      >
        ✕
      </button>
    </div>
  )
}

export default function Toaster() {
  const toasts = useDesignStore(s => s.toasts)
  const dismissToast = useDesignStore(s => s.dismissToast)

  if (!toasts || toasts.length === 0) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-[250] flex flex-col gap-2 pointer-events-none"
      data-testid="toaster"
    >
      {toasts.slice(-3).map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastRow t={t} onDismiss={() => dismissToast(t.id)} />
        </div>
      ))}
    </div>
  )
}
