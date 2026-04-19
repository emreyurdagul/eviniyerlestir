import { lazy, Suspense, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import CameraControls from './CameraControls'
import WalkControls from './WalkControls'
import Ground from './Ground'
import DrawingOverlay from './DrawingOverlay'
import BlueprintOverlay from './BlueprintOverlay'
import SunLight from './SunLight'
import Compass from './Compass'
import IndirectLighting from './IndirectLighting'
import { useDesignStore } from '../../store/designStore'
import { sharedCamera } from './cameraRef'

/** R3F kamerasını canvas dışından erişilebilir sharedCamera ref'ine yazar. */
function CameraCapture() {
  const { camera } = useThree()
  useEffect(() => { sharedCamera.current = camera }, [camera])
  return null
}

// ── Lazy-loaded heavy effects ──────────────────────────────────────────────
// #4 Bundle: postprocessing (~70 KB gzipped) ve drei Environment (~5 KB +
// HDRI texture) yalnızca kullanıcı "Detaylı Işık Analizi" / "HDRI" toggle'ını
// açtığında indirilsin. Kapalı varsayılanda ilk yükleme bundle'ından düşer.
const LazyDetailedEffects = lazy(() => import('./DetailedEffects'))
const LazyOptionalHDRI    = lazy(() => import('./OptionalHDRI'))

interface SceneCanvasProps {
  children?: React.ReactNode
}

function AdjustableAmbient() {
  const intensity = useDesignStore(s => s.ambientIntensity)
  const detailed = useDesignStore(s => s.detailedLighting)
  // Detaylı modda bounce lights ambient'ı kısmen karşılar — ana ambient'ı
  // %60'a indir; yoksa toplam sahne fazla "yıkanmış" görünür
  const scaled = detailed ? intensity * 0.6 : intensity
  return <ambientLight intensity={scaled} color={0xfffaf0} />
}

export default function SceneCanvas({ children }: SceneCanvasProps) {
  const detailedLighting = useDesignStore(s => s.detailedLighting)
  const hdriEnvironment  = useDesignStore(s => s.hdriEnvironment)
  const walkMode         = useDesignStore(s => s.walkMode)

  return (
    <Canvas
      shadows={{ type: THREE.PCFShadowMap }}
      dpr={[1, 2]}
      camera={{ position: [6, 8, 10], fov: 50, near: 0.01, far: 120 }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      style={{ width: '100%', height: '100%' }}
      data-testid="scene-canvas"
    >
      <AdjustableAmbient />
      <SunLight />
      <directionalLight position={[-4, 6, -4]} intensity={0.15} color={0xd0e8ff} />
      <IndirectLighting />
      {hdriEnvironment && detailedLighting && (
        <Suspense fallback={null}>
          <LazyOptionalHDRI />
        </Suspense>
      )}
      <CameraCapture />
      {/* Walk mode aktifken OrbitControls devre dışı, PointerLock aktif */}
      {walkMode ? <WalkControls /> : <CameraControls />}
      <Ground />
      <Compass />
      <BlueprintOverlay />
      <DrawingOverlay />
      {children}
      {detailedLighting && (
        <Suspense fallback={null}>
          <LazyDetailedEffects />
        </Suspense>
      )}
    </Canvas>
  )
}
