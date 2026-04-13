import { useRef, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useDesignStore } from '../../store/designStore'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

export default function CameraControls() {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const isTopView = useDesignStore(s => s.isTopView)
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
