import { useEffect, useRef } from 'react'
import { useDesignStore } from '../store/designStore'
import { MIN_DIM_CM, MAX_DIM_CM } from '../types'

/**
 * Mobil dokunmatik hareketler:
 * - 2 parmak pinch (açma/kapama) → seçili mobilyayı ölçeklendir
 * - 2 parmak döndürme             → seçili mobilyayı döndür
 * - Uzun basış (600ms)            → bağlam menüsünü aç
 */
export function useTouchGestures(containerRef: React.RefObject<HTMLDivElement>) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const touches = new Map<number, { x: number; y: number }>()
    let gestureActive = false
    let initDist = 0
    let initAngle = 0
    let initDims: Record<string, number> = {}
    let initRotation = 0
    let furnitureId: string | null = null

    function getDist() {
      const pts = Array.from(touches.values())
      if (pts.length < 2) return 1
      return Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y)
    }

    function getAngle() {
      const pts = Array.from(touches.values())
      if (pts.length < 2) return 0
      return Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x)
    }

    function getMidpoint() {
      const pts = Array.from(touches.values())
      if (pts.length < 2) return pts[0] ?? { x: 0, y: 0 }
      return { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 }
    }

    function onTouchStart(e: TouchEvent) {
      for (const t of Array.from(e.changedTouches)) {
        touches.set(t.identifier, { x: t.clientX, y: t.clientY })
      }

      if (touches.size === 1) {
        // Uzun basış: 600ms sonra bağlam menüsü
        const t = Array.from(touches.values())[0]
        longPressTimer.current = setTimeout(() => {
          const state = useDesignStore.getState()
          if (state.selection.id) {
            state.setContextMenuPos({ x: t.x, y: t.y })
          }
        }, 600)
      }

      if (touches.size === 2) {
        // Pinch/rotate başladı
        if (longPressTimer.current) clearTimeout(longPressTimer.current)

        const state = useDesignStore.getState()
        const sel = state.selection
        if (sel.kind !== 'furniture' || !sel.id) return

        const item = state.furniture.find(f => f.id === sel.id)
        if (!item) return

        furnitureId = item.id
        initDist = getDist()
        initAngle = getAngle()
        initDims = { ...item.dims }
        initRotation = item.rotation
        gestureActive = true
        e.preventDefault()
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }

      for (const t of Array.from(e.changedTouches)) {
        if (touches.has(t.identifier)) {
          touches.set(t.identifier, { x: t.clientX, y: t.clientY })
        }
      }

      if (!gestureActive || touches.size < 2 || !furnitureId) return

      const scale = Math.max(0.1, getDist() / initDist)
      const dAngle = getAngle() - initAngle

      const newDims = Object.fromEntries(
        Object.entries(initDims).map(([k, v]) => [
          k,
          Math.round(Math.max(MIN_DIM_CM, Math.min(MAX_DIM_CM, v * scale))),
        ])
      )

      useDesignStore.getState().updateFurniture(furnitureId, {
        dims: newDims,
        rotation: initRotation + dAngle,
      })

      e.preventDefault()
    }

    function onTouchEnd(e: TouchEvent) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
      for (const t of Array.from(e.changedTouches)) {
        touches.delete(t.identifier)
      }
      if (touches.size < 2) {
        gestureActive = false
        furnitureId = null
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('touchcancel', onTouchEnd)

    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [containerRef])
}
