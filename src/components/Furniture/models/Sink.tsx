import * as THREE from 'three'

const ceramic   = new THREE.MeshLambertMaterial({ color: 0xf5f5f0 })
const ceramicSh = new THREE.MeshLambertMaterial({ color: 0xdcdcd4 })
const chrome    = new THREE.MeshLambertMaterial({ color: 0xb4b4b8 })
const pedestal  = new THREE.MeshLambertMaterial({ color: 0xeeeee8 })

/** Lavabo — ayaklı klasik seramik, yuvarlak çanak */
export default function Sink({ dims }: { dims: Record<string, number> }) {
  const w = (dims.width ?? 60) / 100
  const d = 0.48
  const h = 0.85  // tezgah yüksekliği

  return (
    <group>
      {/* Ayak (pedestal) */}
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.09, 0.13, 0.70, 14]} />
        <primitive object={pedestal} attach="material" />
      </mesh>
      {/* Ayak taban */}
      <mesh position={[0, 0.015, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.03, 16]} />
        <primitive object={pedestal} attach="material" />
      </mesh>

      {/* Üst tabla (oval) */}
      <mesh position={[0, h, 0]} castShadow>
        <boxGeometry args={[w, 0.08, d]} />
        <primitive object={ceramic} attach="material" />
      </mesh>

      {/* Çanak çukuru (gömülü) — simule: daha alçak küçük kutu */}
      <mesh position={[0, h + 0.04, 0.02]}>
        <boxGeometry args={[w - 0.12, 0.005, d - 0.14]} />
        <primitive object={ceramicSh} attach="material" />
      </mesh>
      <mesh position={[0, h + 0.02, 0.02]}>
        <boxGeometry args={[w - 0.20, 0.04, d - 0.22]} />
        <primitive object={ceramicSh} attach="material" />
      </mesh>

      {/* Arka sırt (splash guard) */}
      <mesh position={[0, h + 0.08, -d / 2 + 0.03]} castShadow>
        <boxGeometry args={[w, 0.10, 0.04]} />
        <primitive object={ceramic} attach="material" />
      </mesh>

      {/* Musluk gövdesi */}
      <mesh position={[0, h + 0.18, -d / 2 + 0.08]} castShadow>
        <cylinderGeometry args={[0.018, 0.024, 0.20, 10]} />
        <primitive object={chrome} attach="material" />
      </mesh>
      {/* Musluk burnu */}
      <mesh position={[0, h + 0.26, -d / 2 + 0.16]} rotation={[Math.PI / 2.2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.014, 0.014, 0.14, 10]} />
        <primitive object={chrome} attach="material" />
      </mesh>
      {/* Musluk kolu */}
      <mesh position={[0, h + 0.30, -d / 2 + 0.07]} castShadow>
        <boxGeometry args={[0.08, 0.02, 0.03]} />
        <primitive object={chrome} attach="material" />
      </mesh>
    </group>
  )
}
