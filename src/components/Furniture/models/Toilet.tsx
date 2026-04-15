import * as THREE from 'three'

const ceramic   = new THREE.MeshLambertMaterial({ color: 0xf4f4f0 })
const ceramicSh = new THREE.MeshLambertMaterial({ color: 0xe2e2dc })
const seatMat   = new THREE.MeshLambertMaterial({ color: 0xf8f8f4 })
const chrome    = new THREE.MeshLambertMaterial({ color: 0xbcbcc0 })

/** Klozet — zemine oturan klasik, rezervuar arkada */
export default function Toilet({ dims }: { dims: Record<string, number> }) {
  const d = (dims.depth ?? 70) / 100
  const w = 0.40

  // Ana gövde (kase)
  return (
    <group>
      {/* Taban kaide */}
      <mesh position={[0, 0.05, d / 2 - 0.30]} castShadow receiveShadow>
        <boxGeometry args={[w - 0.06, 0.10, 0.34]} />
        <primitive object={ceramicSh} attach="material" />
      </mesh>

      {/* Kase (oval form — ön) */}
      <mesh position={[0, 0.28, d / 2 - 0.28]} castShadow>
        <cylinderGeometry args={[w / 2 - 0.02, w / 2 - 0.04, 0.30, 20]} />
        <primitive object={ceramic} attach="material" />
      </mesh>

      {/* Kase içi boşluk efekti — koyu halka */}
      <mesh position={[0, 0.42, d / 2 - 0.28]}>
        <cylinderGeometry args={[w / 2 - 0.06, w / 2 - 0.08, 0.02, 20]} />
        <primitive object={ceramicSh} attach="material" />
      </mesh>

      {/* Oturak (seat) */}
      <mesh position={[0, 0.44, d / 2 - 0.28]} castShadow>
        <cylinderGeometry args={[w / 2 - 0.01, w / 2 - 0.01, 0.03, 20]} />
        <primitive object={seatMat} attach="material" />
      </mesh>

      {/* Oturak kapağı arkası (kalkık) */}
      <mesh position={[0, 0.48, d / 2 - 0.02]} rotation={[0.2, 0, 0]} castShadow>
        <boxGeometry args={[w - 0.04, 0.03, 0.30]} />
        <primitive object={seatMat} attach="material" />
      </mesh>

      {/* Rezervuar (sırt deposu) */}
      <mesh position={[0, 0.72, -d / 2 + 0.10]} castShadow>
        <boxGeometry args={[w - 0.02, 0.40, 0.20]} />
        <primitive object={ceramic} attach="material" />
      </mesh>

      {/* Rezervuar kapağı */}
      <mesh position={[0, 0.93, -d / 2 + 0.10]} castShadow>
        <boxGeometry args={[w, 0.03, 0.22]} />
        <primitive object={ceramicSh} attach="material" />
      </mesh>

      {/* Sifon butonu */}
      <mesh position={[0, 0.95, -d / 2 + 0.10]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.01, 12]} />
        <primitive object={chrome} attach="material" />
      </mesh>
    </group>
  )
}
