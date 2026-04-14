import * as THREE from 'three'

const wood    = new THREE.MeshLambertMaterial({ color: 0x5a3a1a })
const metal   = new THREE.MeshLambertMaterial({ color: 0x707070 })
const shade   = new THREE.MeshLambertMaterial({ color: 0xf0e8d0, side: THREE.DoubleSide })
const shadeOn = new THREE.MeshBasicMaterial({ color: 0xfff6d8 })

interface Props { dims: Record<string, number>; lightIntensity?: number; lightOn?: boolean }

/** Tripod floor lamp — üç ahşap ayak, abajur */
export default function FloorLampTripod({ lightIntensity = 0.6, lightOn = true }: Props) {
  const legLen = 1.55
  const legAngleOuter = 0.22  // dışa eğim
  return (
    <group>
      {/* Üç ayak — 120° aralıklarla */}
      {[0, 1, 2].map(i => {
        const theta = (i / 3) * Math.PI * 2
        const x = Math.cos(theta) * Math.sin(legAngleOuter) * legLen / 2
        const z = Math.sin(theta) * Math.sin(legAngleOuter) * legLen / 2
        return (
          <mesh
            key={i}
            position={[x, legLen / 2 * Math.cos(legAngleOuter), z]}
            rotation={[Math.cos(theta) * legAngleOuter, 0, -Math.sin(theta) * legAngleOuter]}
            castShadow
          >
            <cylinderGeometry args={[0.018, 0.025, legLen, 10]} />
            <primitive object={wood} attach="material" />
          </mesh>
        )
      })}

      {/* Ayak uçlarında küçük metal topuk */}
      {[0, 1, 2].map(i => {
        const theta = (i / 3) * Math.PI * 2
        const x = Math.cos(theta) * Math.sin(legAngleOuter) * legLen
        const z = Math.sin(theta) * Math.sin(legAngleOuter) * legLen
        return (
          <mesh key={`t-${i}`} position={[x, 0.015, z]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.02, 8]} />
            <primitive object={metal} attach="material" />
          </mesh>
        )
      })}

      {/* Tripod birleşim noktası — metal halka */}
      <mesh position={[0, legLen * Math.cos(legAngleOuter) * 0.95, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.05, 12]} />
        <primitive object={metal} attach="material" />
      </mesh>

      {/* Kısa üst direk → abajur */}
      <mesh position={[0, legLen * Math.cos(legAngleOuter) + 0.15, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.25, 8]} />
        <primitive object={metal} attach="material" />
      </mesh>

      {/* Abajur — koni */}
      <mesh position={[0, legLen * Math.cos(legAngleOuter) + 0.40, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.22, 0.28, 20, 1, true]} />
        <primitive object={lightOn ? shadeOn : shade} attach="material" />
      </mesh>

      {/* Işık */}
      {lightOn && (
        <pointLight
          position={[0, legLen * Math.cos(legAngleOuter) + 0.35, 0]}
          intensity={lightIntensity * 1.5}
          color={0xffe8b0}
          distance={5.5}
          decay={2}
          castShadow
        />
      )}
    </group>
  )
}
