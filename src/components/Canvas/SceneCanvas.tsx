import { Canvas } from '@react-three/fiber'
import CameraControls from './CameraControls'
import Ground from './Ground'
import DrawingOverlay from './DrawingOverlay'

interface SceneCanvasProps {
  children?: React.ReactNode
}

export default function SceneCanvas({ children }: SceneCanvasProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [6, 8, 10], fov: 50, near: 0.01, far: 120 }}
      gl={{ antialias: true }}
      style={{ width: '100%', height: '100%' }}
      data-testid="scene-canvas"
    >
      <ambientLight intensity={0.7} color={0xfff8ee} />
      <directionalLight
        position={[4, 10, 6]}
        intensity={0.88}
        color={0xfffdf5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-camera-near={0.1}
        shadow-camera-far={40}
        shadow-bias={-0.0008}
      />
      <directionalLight position={[-4, 6, -4]} intensity={0.2} color={0xd0e8ff} />
      <pointLight position={[0, 3, 0]} intensity={0.45} color={0xfffaf0} distance={20} />
      <CameraControls />
      <Ground />
      <DrawingOverlay />
      {children}
    </Canvas>
  )
}
