import * as THREE from 'three'

const top = new THREE.MeshLambertMaterial({ color: 0xccc0a0 })
const leg = new THREE.MeshLambertMaterial({ color: 0x907858 })

export default function CoffeeTable({ dims }: { dims: Record<string, number> }) {
  const r = (dims.diameter ?? 100) / 200

  return (
    <group>
      <mesh position={[0, 0.41, 0]} castShadow>
        <cylinderGeometry args={[r, r, 0.038, 20]} /><primitive object={top} attach="material" />
      </mesh>
      {[0, 1, 2, 3].map(i => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4
        return (
          <mesh key={i} position={[Math.sin(a) * (r - 0.10), 0.205, Math.cos(a) * (r - 0.10)]} castShadow>
            <cylinderGeometry args={[0.022, 0.016, 0.41, 8]} /><primitive object={leg} attach="material" />
          </mesh>
        )
      })}
    </group>
  )
}
