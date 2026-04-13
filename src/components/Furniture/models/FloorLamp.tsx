import * as THREE from 'three'

const metal = new THREE.MeshLambertMaterial({ color: 0x404040 })
const shade = new THREE.MeshLambertMaterial({ color: 0xf0e8d0, side: THREE.DoubleSide })
const base = new THREE.MeshLambertMaterial({ color: 0x2a2a2a })

export default function FloorLamp({ dims: _dims }: { dims: Record<string, number> }) {
  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.015, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.16, 0.03, 16]} /><primitive object={base} attach="material" />
      </mesh>
      {/* Pole */}
      <mesh position={[0, 0.78, 0]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 1.52, 8]} /><primitive object={metal} attach="material" />
      </mesh>
      {/* Shade */}
      <mesh position={[0, 1.58, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.18, 0.24, 12, 1, true]} /><primitive object={shade} attach="material" />
      </mesh>
      {/* Bulb glow */}
      <pointLight position={[0, 1.52, 0]} intensity={0.3} color={0xfff5e0} distance={3} />
    </group>
  )
}
