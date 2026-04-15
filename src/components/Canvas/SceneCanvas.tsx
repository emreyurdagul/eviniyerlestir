import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { Environment } from '@react-three/drei'
import { EffectComposer, SSAO } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import CameraControls from './CameraControls'
import Ground from './Ground'
import DrawingOverlay from './DrawingOverlay'
import BlueprintOverlay from './BlueprintOverlay'
import SunLight from './SunLight'
import Compass from './Compass'
import IndirectLighting from './IndirectLighting'
import { useDesignStore } from '../../store/designStore'

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

/**
 * Detaylı ışık toggle'ı açıkken SSAO postprocessing'i devreye alan sarmalayıcı.
 * Kapalıyken EffectComposer mount edilmez → renderer pipeline'ı etkilemez,
 * FPS kaybı sıfır.
 */
function DetailedEffects() {
  const enabled = useDesignStore(s => s.detailedLighting)
  if (!enabled) return null
  return (
    // enableNormalPass: SSAO surface normal buffer ister; olmazsa "Please enable
    // the NormalPass" uyarısı verir ve hiç AO üretmez.
    <EffectComposer enableNormalPass>
      <SSAO
        blendFunction={BlendFunction.MULTIPLY}
        samples={16}                // 30+ daha iyi ama maliyetli; 16 iyi denge
        radius={0.1}                // metrelerde; 10 cm contact-shadow yarıçapı
        intensity={25}              // SSAO katkı gücü
        luminanceInfluence={0.6}    // parlak alanları koruma oranı
        worldDistanceThreshold={0.5}
        worldDistanceFalloff={0.1}
        worldProximityThreshold={0.5}
        worldProximityFalloff={0.1}
      />
    </EffectComposer>
  )
}

/**
 * HDRI ortam haritası — kullanıcı opt-in. Güneş simülasyonu ile uyumlu
 * bir "apartment" preset seçildi; nötr iç mekan ışığını simüle eder.
 * Hidden bg olduğu için sahnenin görünür arka planını etkilemez; sadece
 * yansıma ve ambient katkısı yapar.
 */
function OptionalHDRI() {
  const enabled = useDesignStore(s => s.hdriEnvironment)
  const detailed = useDesignStore(s => s.detailedLighting)
  // Bağımlı toggle: detaylı ışık kapalıysa HDRI de kapalı olmalı
  if (!enabled || !detailed) return null
  return <Environment preset="apartment" background={false} />
}

export default function SceneCanvas({ children }: SceneCanvasProps) {
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
      <OptionalHDRI />
      <CameraControls />
      <Ground />
      <Compass />
      <BlueprintOverlay />
      <DrawingOverlay />
      {children}
      <DetailedEffects />
    </Canvas>
  )
}
