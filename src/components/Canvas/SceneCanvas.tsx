import { Canvas } from '@react-three/fiber'
import CameraControls from './CameraControls'
import Ground from './Ground'
import DrawingOverlay from './DrawingOverlay'
import BlueprintOverlay from './BlueprintOverlay'
import SunLight from './SunLight'
import Compass from './Compass'

interface SceneCanvasProps {
  children?: React.ReactNode
}

export default function SceneCanvas({ children }: SceneCanvasProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [6, 8, 10], fov: 50, near: 0.01, far: 120 }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      style={{ width: '100%', height: '100%' }}
      data-testid="scene-canvas"
    >
      <SunLight />
      <directionalLight position={[-4, 6, -4]} intensity={0.15} color={0xd0e8ff} />
      <pointLight position={[0, 3, 0]} intensity={0.25} color={0xfffaf0} distance={20} />
      <CameraControls />
      <Ground />
      <Compass />
      <BlueprintOverlay />
      <DrawingOverlay />
      {children}
    </Canvas>
  )
}
