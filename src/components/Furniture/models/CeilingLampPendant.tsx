import * as THREE from 'three'

const cord    = new THREE.MeshLambertMaterial({ color: 0x202020 })
const mount   = new THREE.MeshLambertMaterial({ color: 0x3a3a3a })
const globe   = new THREE.MeshLambertMaterial({ color: 0xf8f4e4, side: THREE.DoubleSide })
const globeOn = new THREE.MeshBasicMaterial({ color: 0xfff5c0 })

interface Props { dims: Record<string, number>; lightIntensity?: number; lightOn?: boolean }

/**
 * Tavan sarkıt lambası — tavana monteli, kablo ile sarkan küre/koni globe
 * yOffset 2.10m (registry'de tanımlı), model içinde:
 *  y=0        → tavan plate
 *  y=-0.40    → globe
 */
export default function CeilingLampPendant({ dims, lightIntensity = 0.7, lightOn = true }: Props) {
  const diam = (dims.diameter ?? 55) / 100

  return (
    <group position={[0, 0.55, 0]}>
      {/* Tavan plakası */}
      <mesh position={[0, 0.00, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} />
        <primitive object={mount} attach="material" />
      </mesh>
      {/* Kablo */}
      <mesh position={[0, -0.20, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.40, 6]} />
        <primitive object={cord} attach="material" />
      </mesh>
      {/* Globe — yarım küre formu */}
      <mesh position={[0, -0.42, 0]} castShadow>
        <sphereGeometry args={[diam / 2, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
        <primitive object={lightOn ? globeOn : globe} attach="material" />
      </mesh>
      {/* Globe üst bağlantı */}
      <mesh position={[0, -0.38, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.02, 12]} />
        <primitive object={mount} attach="material" />
      </mesh>

      {/* Işık */}
      {lightOn && (
        <pointLight
          position={[0, -0.42, 0]}
          intensity={lightIntensity * 2.0}
          color={0xfff2c8}
          distance={7}
          decay={2}
          castShadow
        />
      )}
    </group>
  )
}
