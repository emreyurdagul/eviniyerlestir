import { useEffect, useRef, useState } from 'react'

interface NumberFieldProps {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
  className?: string
  inputClassName?: string
  testId?: string
  disabled?: boolean
  /** +/- buton üzerinde dikey fare sürükleme ile değer değiştirme hassasiyeti (px/step) */
  dragPxPerStep?: number
}

/**
 * Tüm sayı girdileri için ortak bileşen:
 * - Local state (tip ederken değer yazı olarak korunur)
 * - Commit on blur/Enter — store güncellenmeden önce input yeniden mount olmaz
 * - Özel +/- butonları: tek tık = +step, basılı tutunca hızlanarak tekrar,
 *   yukarı/aşağı sürükleyince değer değişir
 * - Ok tuşları (↑/↓) ile artır/azalt, Shift ile 10×
 */
export default function NumberField({
  value,
  onChange,
  min = 0,
  max = 99999,
  step = 1,
  unit,
  className = '',
  inputClassName = '',
  testId,
  disabled = false,
  dragPxPerStep = 3,
}: NumberFieldProps) {
  const [draft, setDraft] = useState<string>(String(value))
  const inputRef = useRef<HTMLInputElement>(null)
  const focusedRef = useRef(false)

  // Dışarıdan değer değişirse ve input odaklı DEĞİLSE draft'ı senkronla.
  // Kullanıcı yazarken asla ezmeyiz.
  useEffect(() => {
    if (!focusedRef.current) setDraft(String(value))
  }, [value])

  const clamp = (v: number) => Math.min(max, Math.max(min, v))

  const commit = (raw: string) => {
    const parsed = parseInt(raw, 10)
    if (!isNaN(parsed)) {
      const next = clamp(parsed)
      if (next !== value) onChange(next)
      setDraft(String(next))
    } else {
      setDraft(String(value)) // geçersizse geri çevir
    }
  }

  const bump = (delta: number) => {
    const next = clamp(value + delta)
    if (next !== value) onChange(next)
    setDraft(String(next))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit(draft)
      inputRef.current?.blur()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setDraft(String(value))
      inputRef.current?.blur()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      bump(step * (e.shiftKey ? 10 : 1))
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      bump(-step * (e.shiftKey ? 10 : 1))
    }
  }

  // ── +/- butonları: Mod ayrımlı hold-to-repeat VE drag-to-scrub ──
  // Kural: başlangıçta 'idle'. 6px'den fazla hareket → 'drag' moduna kilit.
  // Aksi halde 320ms sonra 'repeat' moduna geç. İki mod aynı anda çalışmaz.
  const pressState = useRef<{
    dir: 1 | -1
    startY: number
    lastBumpY: number
    timer: number | null
    accelStart: number
    mode: 'idle' | 'drag' | 'repeat'
  } | null>(null)

  const DRAG_THRESHOLD = 6  // px — bundan fazla hareket edilirse drag moduna geç

  const startSpin = (dir: 1 | -1) => (e: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled) return
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    const state: NonNullable<typeof pressState.current> = {
      dir,
      startY: e.clientY,
      lastBumpY: e.clientY,
      timer: null,
      accelStart: performance.now(),
      mode: 'idle',
    }
    pressState.current = state

    // 320ms sonra — henüz drag moduna geçmediyse repeat moduna gir
    state.timer = window.setTimeout(function repeat() {
      const st = pressState.current
      if (!st || st.mode === 'drag') return
      st.mode = 'repeat'
      const elapsed = performance.now() - st.accelStart
      const factor = elapsed > 1500 ? 10 : elapsed > 700 ? 3 : 1
      bump(step * st.dir * factor)
      st.timer = window.setTimeout(repeat, 80)
    }, 320)
  }

  const onSpinMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const st = pressState.current
    if (!st) return

    const totalDy = st.startY - e.clientY

    // Drag moduna geçiş: threshold'u aşar aşmaz repeat timer'ı iptal et
    if (st.mode === 'idle' && Math.abs(totalDy) >= DRAG_THRESHOLD) {
      if (st.timer) { window.clearTimeout(st.timer); st.timer = null }
      st.mode = 'drag'
      st.lastBumpY = e.clientY  // drag başlangıç noktasını sıfırla
    }

    // Sadece drag modunda scrub yap
    if (st.mode === 'drag') {
      const dy = st.lastBumpY - e.clientY
      const stepsMoved = Math.trunc(dy / dragPxPerStep)
      if (stepsMoved !== 0) {
        st.lastBumpY -= stepsMoved * dragPxPerStep
        bump(step * stepsMoved)
      }
    }
  }

  const endSpin = (e: React.PointerEvent<HTMLButtonElement>) => {
    const st = pressState.current
    if (!st) return
    if (st.timer) { window.clearTimeout(st.timer); st.timer = null }
    const mode = st.mode
    pressState.current = null
    ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)

    // idle modundayken bırakıldıysa tek tık → 1 step
    if (mode === 'idle') {
      bump(step * st.dir)
    }
  }

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={draft}
        disabled={disabled}
        onFocus={() => { focusedRef.current = true; inputRef.current?.select() }}
        onBlur={() => { focusedRef.current = false; commit(draft) }}
        onChange={e => setDraft(e.target.value.replace(/[^\d-]/g, ''))}
        onKeyDown={handleKeyDown}
        onClick={e => e.stopPropagation()}
        onWheel={e => {
          if (focusedRef.current) {
            e.preventDefault()
            bump(step * (e.deltaY < 0 ? 1 : -1) * (e.shiftKey ? 10 : 1))
          }
        }}
        className={`py-0.5 px-1 text-[11px] font-bold text-stone-800 bg-amber-50/90 border border-stone-300/40 rounded text-right outline-none focus:border-amber-400 disabled:opacity-50 ${inputClassName}`}
        data-testid={testId}
      />
      {unit && <span className="text-[9px] text-stone-500 mr-0.5">{unit}</span>}
      <div className="flex flex-col select-none">
        <button
          type="button"
          disabled={disabled}
          onPointerDown={startSpin(1)}
          onPointerMove={onSpinMove}
          onPointerUp={endSpin}
          onPointerCancel={endSpin}
          onClick={e => e.stopPropagation()}
          onContextMenu={e => e.preventDefault()}
          className="w-7 h-6 sm:w-3.5 sm:h-3 flex items-center justify-center text-[11px] sm:text-[9px] leading-none text-stone-600 bg-stone-100 hover:bg-amber-100 active:bg-amber-200 rounded-t border border-stone-300/40 cursor-ns-resize disabled:opacity-40 touch-none"
          title="Artır (basılı tut veya yukarı sürükle)"
          data-testid={testId ? `${testId}-up` : undefined}
        >▲</button>
        <button
          type="button"
          disabled={disabled}
          onPointerDown={startSpin(-1)}
          onPointerMove={onSpinMove}
          onPointerUp={endSpin}
          onPointerCancel={endSpin}
          onClick={e => e.stopPropagation()}
          onContextMenu={e => e.preventDefault()}
          className="w-7 h-6 sm:w-3.5 sm:h-3 flex items-center justify-center text-[11px] sm:text-[9px] leading-none text-stone-600 bg-stone-100 hover:bg-amber-100 active:bg-amber-200 rounded-b border border-t-0 border-stone-300/40 cursor-ns-resize disabled:opacity-40 touch-none"
          title="Azalt (basılı tut veya aşağı sürükle)"
          data-testid={testId ? `${testId}-down` : undefined}
        >▼</button>
      </div>
    </div>
  )
}
