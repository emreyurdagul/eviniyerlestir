import * as THREE from 'three'

const body   = new THREE.MeshLambertMaterial({ color: 0x303030 })
const glow   = new THREE.MeshBasicMaterial({ color: 0xfff3c0 })
const glowOff = new THREE.MeshLambertMaterial({ color: 0x505050 })

interface Props { dims: Record<string, number>; lightIntensity?: number; lightOn?: boolean }

/**
 * Modern duvar aydınlatması — dikey LED çubuk (yukarı/aşağı ışık saçan)
 * yOffset 1.65m, model içinde y=0 duvar orta noktası.
 */
export default function WallSconceModern({ dims, lightIntensity = 0.5, lightOn = true }: Props) {
  const w = (dims.width ?? 25) / 100

  return (
    <group position={[0, 0.175, 0]}>
      {/* Kutu gövde (dikey) */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.08, w, 0.05]} />
        <primitive object={body} attach="material" />
      </mesh>
      {/* Üst ve alt LED şeritleri */}
      <mesh position={[0, w / 2 - 0.002, 0.026]}>
        <boxGeometry args={[0.06, 0.006, 0.006]} />
        <primitive object={lightOn ? glow : glowOff} attach="material" />
      </mesh>
      <mesh position={[0, -(w / 2) + 0.002, 0.026]}>
        <boxGeometry args={[0.06, 0.006, 0.006]} />
        <primitive object={lightOn ? glow : glowOff} attach="material" />
      </mesh>

      {/* Işıklar: iki yönlü */}
      {lightOn && (
        <>
          <pointLight position={[0, w / 2 + 0.05, 0.05]} intensity={lightIntensity * 0.8} color={0xffe8b0} distance={3} decay={2} />
          <pointLight position={[0, -(w / 2) - 0.05, 0.05]} intensity={lightIntensity * 0.8} color={0xffe8b0} distance={3} decay={2} />
        </>
      )}
    </group>
  )
}
