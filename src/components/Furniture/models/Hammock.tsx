import * as THREE from 'three'

const wood   = new THREE.MeshLambertMaterial({ color: 0x6a4a28 })
const rope   = new THREE.MeshLambertMaterial({ color: 0xc0a878 })
const fabric = new THREE.MeshLambertMaterial({ color: 0xc85040, side: THREE.DoubleSide })
const stripe = new THREE.MeshLambertMaterial({ color: 0xe8d090, side: THREE.DoubleSide })

/** Hamak — iki ahşap ayak + ortada sarkık kumaş */
export default function Hammock({ dims }: { dims: Record<string, number> }) {
  const length = (dims.length ?? 220) / 100
  const postH = 1.20

  // Kumaş sarkıtları — parabolic eğri ortada
  const slats = 14

  return (
    <group>
      {/* Sol ayak — A-frame */}
      <group position={[-length / 2, 0, 0]}>
        <mesh position={[0, postH / 2, 0.18]} rotation={[0, 0, 0.18]} castShadow>
          <cylinderGeometry args={[0.035, 0.045, postH, 10]} />
          <primitive object={wood} attach="material" />
        </mesh>
        <mesh position={[0, postH / 2, -0.18]} rotation={[0, 0, -0.18]} castShadow>
          <cylinderGeometry args={[0.035, 0.045, postH, 10]} />
          <primitive object={wood} attach="material" />
        </mesh>
        {/* Taban çubuğu */}
        <mesh position={[0, 0.02, 0]} castShadow>
          <boxGeometry args={[0.08, 0.04, 0.60]} />
          <primitive object={wood} attach="material" />
        </mesh>
      </group>
      {/* Sağ ayak — A-frame */}
      <group position={[length / 2, 0, 0]}>
        <mesh position={[0, postH / 2, 0.18]} rotation={[0, 0, -0.18]} castShadow>
          <cylinderGeometry args={[0.035, 0.045, postH, 10]} />
          <primitive object={wood} attach="material" />
        </mesh>
        <mesh position={[0, postH / 2, -0.18]} rotation={[0, 0, 0.18]} castShadow>
          <cylinderGeometry args={[0.035, 0.045, postH, 10]} />
          <primitive object={wood} attach="material" />
        </mesh>
        <mesh position={[0, 0.02, 0]} castShadow>
          <boxGeometry args={[0.08, 0.04, 0.60]} />
          <primitive object={wood} attach="material" />
        </mesh>
      </group>

      {/* İp uçları */}
      <mesh position={[-length / 2 + 0.08, postH - 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.008, 0.008, 0.16, 8]} />
        <primitive object={rope} attach="material" />
      </mesh>
      <mesh position={[length / 2 - 0.08, postH - 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.008, 0.008, 0.16, 8]} />
        <primitive object={rope} attach="material" />
      </mesh>

      {/* Kumaş — parabolic çökme (slat'lerle oluştur) */}
      {Array.from({ length: slats }, (_, i) => {
        const t = (i / (slats - 1)) * 2 - 1   // -1..1
        const x = t * (length / 2 - 0.15)
        // Parabolic sarkma
        const y = postH - 0.20 - (1 - t * t) * 0.55
        return (
          <mesh key={`s-${i}`} position={[x, y, 0]} castShadow>
            <boxGeometry args={[0.05, 0.015, 0.60]} />
            <primitive object={i % 3 === 0 ? stripe : fabric} attach="material" />
          </mesh>
        )
      })}
    </group>
  )
}
