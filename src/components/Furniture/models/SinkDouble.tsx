import * as THREE from 'three'

const ceramic   = new THREE.MeshLambertMaterial({ color: 0xf5f5f0 })
const ceramicSh = new THREE.MeshLambertMaterial({ color: 0xdcdcd4 })
const chrome    = new THREE.MeshLambertMaterial({ color: 0xb4b4b8 })
const wood      = new THREE.MeshLambertMaterial({ color: 0x8a6040 })

/** İkiz Lavabo — iki çanak yan yana, geniş tezgah */
export default function SinkDouble({ dims }: { dims: Record<string, number> }) {
  const w = Math.max((dims.width ?? 120) / 100, 1.0)
  const d = 0.50
  const cabH = 0.75

  return (
    <group>
      {/* Alt ahşap dolap */}
      <mesh position={[0, cabH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, cabH, d]} />
        <primitive object={wood} attach="material" />
      </mesh>
      {/* İki kapı */}
      <mesh position={[-w / 4, cabH / 2, d / 2 + 0.005]}>
        <boxGeometry args={[w / 2 - 0.04, cabH - 0.06, 0.005]} />
        <primitive object={ceramicSh} attach="material" />
      </mesh>
      <mesh position={[w / 4, cabH / 2, d / 2 + 0.005]}>
        <boxGeometry args={[w / 2 - 0.04, cabH - 0.06, 0.005]} />
        <primitive object={ceramicSh} attach="material" />
      </mesh>

      {/* Tezgah (üst) */}
      <mesh position={[0, cabH + 0.02, 0]} castShadow>
        <boxGeometry args={[w + 0.04, 0.04, d + 0.02]} />
        <primitive object={ceramicSh} attach="material" />
      </mesh>

      {/* İki çanak + iki musluk */}
      {[-w / 4, w / 4].map((cx, i) => (
        <group key={i} position={[cx, 0, 0]}>
          {/* çanak */}
          <mesh position={[0, cabH + 0.10, 0.02]} castShadow>
            <cylinderGeometry args={[0.18, 0.14, 0.12, 20]} />
            <primitive object={ceramic} attach="material" />
          </mesh>
          <mesh position={[0, cabH + 0.12, 0.02]}>
            <cylinderGeometry args={[0.14, 0.11, 0.08, 20]} />
            <primitive object={ceramicSh} attach="material" />
          </mesh>
          {/* musluk */}
          <mesh position={[0, cabH + 0.22, -d / 2 + 0.08]} castShadow>
            <cylinderGeometry args={[0.017, 0.020, 0.22, 10]} />
            <primitive object={chrome} attach="material" />
          </mesh>
          <mesh position={[0, cabH + 0.32, -d / 2 + 0.14]} rotation={[Math.PI / 2.2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.013, 0.013, 0.12, 10]} />
            <primitive object={chrome} attach="material" />
          </mesh>
        </group>
      ))}
    </group>
  )
}
