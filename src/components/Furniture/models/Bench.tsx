import * as THREE from 'three'

const wood    = new THREE.MeshLambertMaterial({ color: 0x8a5a30 })
const woodDk  = new THREE.MeshLambertMaterial({ color: 0x5a3820 })

/** Bank — sade ahşap, dikdörtgen oturma paneli + 2 yatay ayak */
export default function Bench({ dims }: { dims: Record<string, number> }) {
  const l = (dims.length ?? 120) / 100
  const w = (dims.width ?? 40) / 100
  const seatH = 0.45

  return (
    <group>
      {/* Oturma paneli (2 tahta) */}
      <mesh position={[0, seatH, -w / 4]} castShadow receiveShadow>
        <boxGeometry args={[l, 0.04, w / 2 - 0.01]} />
        <primitive object={wood} attach="material" />
      </mesh>
      <mesh position={[0, seatH,  w / 4]} castShadow receiveShadow>
        <boxGeometry args={[l, 0.04, w / 2 - 0.01]} />
        <primitive object={wood} attach="material" />
      </mesh>

      {/* Yan ayaklar (blok form) */}
      {[-1, 1].map((sign) => (
        <group key={sign}>
          <mesh position={[sign * (l / 2 - 0.08), seatH / 2, 0]} castShadow>
            <boxGeometry args={[0.06, seatH - 0.02, w - 0.04]} />
            <primitive object={woodDk} attach="material" />
          </mesh>
          {/* ayak altı blok (stabilite) */}
          <mesh position={[sign * (l / 2 - 0.08), 0.02, 0]} castShadow>
            <boxGeometry args={[0.10, 0.04, w]} />
            <primitive object={woodDk} attach="material" />
          </mesh>
        </group>
      ))}

      {/* Orta çapraz bağ */}
      <mesh position={[0, 0.14, 0]} castShadow>
        <boxGeometry args={[l - 0.24, 0.04, 0.05]} />
        <primitive object={woodDk} attach="material" />
      </mesh>
    </group>
  )
}
