/**
 * Ground — zemin düzlemi + rubber-band (alan) seçim başlatıcısı.
 *
 * Rubber-band:
 *   - Odalar ve mobilyalar onPointerDown'da e.stopPropagation() çağırır.
 *     Dolayısıyla ground'a ulaşan tıklama = boş alana tıklama demektir.
 *   - Pointer down → window pointermove/pointerup dinlemeye başla, rubberBand state'i güncelle.
 *   - Pointer up → sharedCamera ile tüm oda/mobilya dünya konumlarını ekrana
 *     project et, dikdörtgen içine düşenleri multiSelectedIds'e ekle.
 *   - Çok küçük hareket (< 5px) = tıklama → seçimi temizle.
 */
import { useRef } from 'react'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useDesignStore } from '../../store/designStore'
import { sharedCamera } from './cameraRef'

export default function Ground() {
  const { gl } = useThree()
  const setRubberBand    = useDesignStore(s => s.setRubberBand)
  const setStoreDragging = useDesignStore(s => s.setDragging)
  const rubberStart      = useRef<{ x: number; y: number } | null>(null)

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    const ne = e.nativeEvent
    if (ne.button !== 0) return
    if (window.__evPointerCaptured) return

    // Sadece Ctrl (veya Mac Cmd) tutuluyken rubber-band başlat.
    // Ctrl olmadan normal tıklama → OrbitControls kamerayı döndürsün.
    if (!ne.ctrlKey && !ne.metaKey) {
      // Ctrl yok: sade sol tık zeminde → tek seçimi temizle (ama kamerayı bırak)
      useDesignStore.getState().clearMultiSelection()
      useDesignStore.getState().deselect()
      return
    }

    e.stopPropagation()
    window.__evPointerCaptured = true
    // OrbitControls'u devre dışı bırak (isDragging flag'i CameraControls'u dinler)
    setStoreDragging(true)
    rubberStart.current = { x: ne.clientX, y: ne.clientY }

    const onMove = (ev: PointerEvent) => {
      if (!rubberStart.current) return
      setRubberBand({
        x1: rubberStart.current.x,
        y1: rubberStart.current.y,
        x2: ev.clientX,
        y2: ev.clientY,
      })
    }

    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)

      if (!rubberStart.current) return

      const rb = {
        x1: Math.min(rubberStart.current.x, ev.clientX),
        y1: Math.min(rubberStart.current.y, ev.clientY),
        x2: Math.max(rubberStart.current.x, ev.clientX),
        y2: Math.max(rubberStart.current.y, ev.clientY),
      }
      rubberStart.current = null
      setRubberBand(null)
      setStoreDragging(false)
      window.__evPointerCaptured = false

      const state = useDesignStore.getState()

      // Küçük hareket = Ctrl+tık zeminde → seçimi temizle
      if (rb.x2 - rb.x1 < 5 && rb.y2 - rb.y1 < 5) {
        state.clearMultiSelection()
        state.deselect()
        return
      }

      const cam = sharedCamera.current
      if (!cam) return
      const rect = gl.domElement.getBoundingClientRect()

      /** 3D dünya noktasını ekrana projekte et; rubber-band rect içinde mi? */
      const inRect = (wx: number, wz: number): boolean => {
        const vec = new THREE.Vector3(wx, 0, wz).project(cam)
        const sx = (vec.x + 1) / 2 * rect.width  + rect.left
        const sy = (-vec.y + 1) / 2 * rect.height + rect.top
        return sx >= rb.x1 && sx <= rb.x2 && sy >= rb.y1 && sy <= rb.y2
      }

      const selected: string[] = []
      for (const room of state.rooms) {
        if (inRect(room.position[0], room.position[1])) selected.push(room.id)
      }
      for (const furn of state.furniture) {
        if (inRect(furn.position[0], furn.position[1])) selected.push(furn.id)
      }

      if (selected.length > 0) {
        state.setMultiSelected(selected)
      }
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.005, 0]}
      receiveShadow
      onPointerDown={handlePointerDown}
    >
      <planeGeometry args={[200, 200]} />
      <meshLambertMaterial color={0xc8c0b4} />
    </mesh>
  )
}
