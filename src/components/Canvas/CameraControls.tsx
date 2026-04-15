import { useRef, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useDesignStore } from '../../store/designStore'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'

export default function CameraControls() {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const isTopView = useDesignStore(s => s.isTopView)
  const isDragging = useDesignStore(s => s.isDragging)
  const isDrawing = useDesignStore(s => s.isDrawing)
  const { camera } = useThree()

  useEffect(() => {
    if (!controlsRef.current) return
    if (isTopView) {
      camera.position.set(0, 22, 0.001)
      camera.lookAt(0, 0, 0)
      controlsRef.current.enableRotate = false
    } else {
      camera.position.set(6, 8, 10)
      camera.lookAt(0, 0.5, 0)
      controlsRef.current.enableRotate = true
    }
    controlsRef.current.update()
  }, [isTopView, camera])

  // Disable orbit controls while dragging/resizing objects or drawing
  useEffect(() => {
    if (!controlsRef.current) return
    controlsRef.current.enabled = !isDragging && !isDrawing
  }, [isDragging, isDrawing])

  // Zoom butonları için window event dinle
  useEffect(() => {
    const handler = (e: Event) => {
      if (!controlsRef.current) return
      const ce = e as CustomEvent<'in' | 'out' | 'reset'>
      const controls = controlsRef.current
      const target = controls.target.clone()
      const dir = new THREE.Vector3().subVectors(camera.position, target)
      const dist = dir.length()
      if (ce.detail === 'in') {
        const newDist = Math.max(3, dist * 0.72)
        dir.setLength(newDist)
        camera.position.copy(target).add(dir)
      } else if (ce.detail === 'out') {
        const newDist = Math.min(30, dist * 1.38)
        dir.setLength(newDist)
        camera.position.copy(target).add(dir)
      } else if (ce.detail === 'reset') {
        if (isTopView) {
          camera.position.set(0, 22, 0.001)
          camera.lookAt(0, 0, 0)
        } else {
          camera.position.set(6, 8, 10)
          camera.lookAt(0, 0.5, 0)
        }
      }
      controls.update()
    }
    window.addEventListener('camera-zoom', handler)
    return () => window.removeEventListener('camera-zoom', handler)
  }, [camera, isTopView])

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      minDistance={3}
      maxDistance={30}
      minPolarAngle={0.08}
      maxPolarAngle={Math.PI / 2 - 0.04}
      target={[0, 0.5, 0]}
      enableDamping
      dampingFactor={0.1}
    />
  )
}
