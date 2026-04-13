import * as THREE from 'three'

const pot = new THREE.MeshLambertMaterial({ color: 0xb07040 })
const soil = new THREE.MeshLambertMaterial({ color: 0x4a3520 })
const leaf = new THREE.MeshLambertMaterial({ color: 0x4a8838, side: THREE.DoubleSide })

export default function Plant({ dims }: { dims: Record<string, number> }) {
  const scale = (dims.diameter ?? 40) / 40

  return (
    <group scale={[scale, scale, scale]}>
      {/* Pot */}
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.09, 0.24, 12]} /><primitive object={pot} attach="material" />
      </mesh>
      {/* Soil */}
      <mesh position={[0, 0.245, 0]}>
        <cylinderGeometry args={[0.11, 0.11, 0.02, 12]} /><primitive object={soil} attach="material" />
      </mesh>
      {/* Leaves */}
      {[0, 1, 2, 3, 4].map(i => {
        const a = (i / 5) * Math.PI * 2
        const tilt = 0.3 + Math.random() * 0.3
        return (
          <mesh key={i} position={[Math.sin(a) * 0.06, 0.40, Math.cos(a) * 0.06]}
            rotation={[tilt * Math.cos(a), a, tilt * Math.sin(a)]} castShadow>
            <sphereGeometry args={[0.12, 8, 6]} />
            <primitive object={leaf} attach="material" />
            <group scale={[1, 0.5, 0.7]} />
          </mesh>
        )
      })}
      {/* Central stem */}
      <mesh position={[0, 0.38, 0]} castShadow>
        <sphereGeometry args={[0.14, 10, 8]} /><primitive object={leaf} attach="material" />
      </mesh>
    </group>
  )
}
