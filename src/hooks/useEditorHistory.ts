/**
 * useEditorHistory — editör için local undo/redo yığını.
 *
 * Ana app'teki `zundo` (temporal middleware) store-level geçmiş tutar;
 * AdvancedFloorPlanEditor kendi local state'inde çalıştığı için ayrı bir
 * history'e ihtiyaç duyar. Aynı 300ms debounce + 50 snapshot limitini
 * mirror'lar.
 *
 * Kullanım:
 *   const history = useEditorHistory(initial)
 *   useEffect(() => history.push({rooms, openings, ...}), [rooms, openings, ...])
 *   // Ctrl+Z → const prev = history.undo(); if (prev) applySnapshot(prev)
 */

import { useCallback, useRef, useState } from 'react'

export interface UseEditorHistory<T> {
  push: (snap: T) => void
  undo: () => T | null
  redo: () => T | null
  canUndo: boolean
  canRedo: boolean
  reset: (snap: T) => void
  clear: () => void
}

export function useEditorHistory<T>(initial: T, max = 50, debounceMs = 300): UseEditorHistory<T> {
  // past: [oldest, ..., newest applied state]
  // future: [next redoable, ..., newest redoable]
  // Son snapshot past'in tepesindedir. Yeni push → past'e ekler, future'ı temizler.
  const pastRef = useRef<T[]>([initial])
  const futureRef = useRef<T[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef<T | null>(null)

  // canUndo/canRedo için render tetikleyici
  const [, setTick] = useState(0)
  const bump = useCallback(() => setTick(v => v + 1), [])

  const flushPending = useCallback(() => {
    if (pendingRef.current === null) return
    const snap = pendingRef.current
    pendingRef.current = null
    // Aynı snapshot'ı iki kere üst üste pushlama (referans eşitliği)
    const last = pastRef.current[pastRef.current.length - 1]
    if (last === snap) return
    pastRef.current.push(snap)
    if (pastRef.current.length > max) pastRef.current.shift()
    futureRef.current = []
    bump()
  }, [max, bump])

  const push = useCallback((snap: T) => {
    // Debounce: sürekli değişikliklerde son state'i biriktir, 300ms sessizlikten sonra ekle
    pendingRef.current = snap
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(flushPending, debounceMs)
  }, [flushPending, debounceMs])

  const undo = useCallback((): T | null => {
    // Bekleyen debounce varsa önce onu flush et (kullanıcının en son yaptığını kaydet)
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    flushPending()
    if (pastRef.current.length < 2) return null
    const current = pastRef.current.pop()!
    futureRef.current.push(current)
    const prev = pastRef.current[pastRef.current.length - 1]
    bump()
    return prev
  }, [flushPending, bump])

  const redo = useCallback((): T | null => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    if (futureRef.current.length === 0) return null
    const next = futureRef.current.pop()!
    pastRef.current.push(next)
    bump()
    return next
  }, [bump])

  const reset = useCallback((snap: T) => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    pendingRef.current = null
    pastRef.current = [snap]
    futureRef.current = []
    bump()
  }, [bump])

  const clear = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    pendingRef.current = null
    pastRef.current = pastRef.current.length > 0
      ? [pastRef.current[pastRef.current.length - 1]]
      : []
    futureRef.current = []
    bump()
  }, [bump])

  return {
    push, undo, redo, reset, clear,
    canUndo: pastRef.current.length > 1,
    canRedo: futureRef.current.length > 0,
  }
}
