import * as THREE from 'three'

const ceramic   = new THREE.MeshLambertMaterial({ color: 0xf6f6f2 })
const ceramicSh = new THREE.MeshLambertMaterial({ color: 0xdcdcd4 })
const chrome    = new THREE.MeshLambertMaterial({ color: 0xb4b4b8 })
const wood      = new THREE.MeshLambertMaterial({ color: 0xa87040 })

/** Lavabo — köşeli tezgah üstü modern (ahşap alt dolaplı) */
export default function SinkSquare({ dims }: { dims: Record<string, number> }) {
  const w = (dims.width ?? 70) / 100
  const d = 0.48
  const cabH = 0.75

  return (
    <group>
      {/* Alt ahşap dolap */}
      <mesh position={[0, cabH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, cabH, d]} />
        <primitive object={wood} attach="material" />
      </mesh>
      {/* Dolap kapı çizgisi */}
      <mesh position={[0, cabH / 2, d / 2 + 0.005]}>
        <boxGeometry args={[w - 0.04, cabH - 0.06, 0.005]} />
        <primitive object={ceramicSh} attach="material" />
      </mesh>
      {/* Kulp */}
      <mesh position={[0, cabH - 0.10, d / 2 + 0.015]}>
        <boxGeometry args={[0.12, 0.015, 0.015]} />
        <primitive object={chrome} attach="material" />
      </mesh>

      {/* Tezgah */}
      <mesh position={[0, cabH + 0.02, 0]} castShadow>
        <boxGeometry args={[w + 0.04, 0.04, d + 0.02]} />
        <primitive object={ceramicSh} attach="material" />
      </mesh>

      {/* Köşeli çanak (tezgah üstü) */}
      <mesh position={[0, cabH + 0.10, 0]} castShadow>
        <boxGeometry args={[w - 0.20, 0.14, d - 0.12]} />
        <primitive object={ceramic} attach="material" />
      </mesh>
      {/* Çanak iç çukur */}
      <mesh position={[0, cabH + 0.12, 0]}>
        <boxGeometry args={[w - 0.26, 0.10, d - 0.18]} />
        <primitive object={ceramicSh} attach="material" />
      </mesh>

      {/* Musluk */}
      <mesh position={[0, cabH + 0.24, -d / 2 + 0.10]} castShadow>
        <cylinderGeometry args={[0.018, 0.022, 0.26, 10]} />
        <primitive object={chrome} attach="material" />
      </mesh>
      <mesh position={[0, cabH + 0.36, -d / 2 + 0.18]} rotation={[Math.PI / 2.2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.014, 0.014, 0.14, 10]} />
        <primitive object={chrome} attach="material" />
      </mesh>
    </group>
  )
}
