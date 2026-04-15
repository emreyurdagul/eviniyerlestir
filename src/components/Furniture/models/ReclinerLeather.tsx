import * as THREE from 'three'

const leather  = new THREE.MeshLambertMaterial({ color: 0x4a2820 })
const leatherL = new THREE.MeshLambertMaterial({ color: 0x5a352a })
const baseMat  = new THREE.MeshLambertMaterial({ color: 0x202018 })

/** Rahatlık Koltuğu — deri, modern, ayak desteği ayrılmış */
export default function ReclinerLeather({ dims }: { dims: Record<string, number> }) {
  const w = (dims.width ?? 100) / 100
  const d = (dims.depth ?? 105) / 100
  const sitH = 0.44
  const backH = 0.84

  return (
    <group>
      {/* Metal baz */}
      <mesh position={[0, 0.04, 0]} castShadow receiveShadow>
        <boxGeometry args={[w - 0.10, 0.08, d - 0.20]} />
        <primitive object={baseMat} attach="material" />
      </mesh>

      {/* Oturma */}
      <mesh position={[0, sitH - 0.06, 0.02]} castShadow>
        <boxGeometry args={[w - 0.08, 0.18, d - 0.22]} />
        <primitive object={leather} attach="material" />
      </mesh>
      <mesh position={[0, sitH + 0.04, 0.02]} castShadow>
        <boxGeometry args={[w - 0.12, 0.05, d - 0.26]} />
        <primitive object={leatherL} attach="material" />
      </mesh>

      {/* Kollar — düşük profil */}
      {[-1, 1].map((sign) => (
        <mesh key={sign} position={[sign * (w / 2 - 0.06), sitH - 0.02, 0.02]} castShadow>
          <boxGeometry args={[0.10, 0.34, d - 0.22]} />
          <primitive object={leather} attach="material" />
        </mesh>
      ))}

      {/* Yüksek sırt — segmanlı (üç panel) */}
      {[-1, 0, 1].map((seg) => (
        <mesh
          key={seg}
          position={[seg * (w / 4 - 0.04), sitH + backH / 2, -d / 2 + 0.20]}
          rotation={[-0.16, 0, 0]}
          castShadow
        >
          <boxGeometry args={[w / 3 - 0.04, backH, 0.16]} />
          <primitive object={leather} attach="material" />
        </mesh>
      ))}
      {/* Sırt üst yastık */}
      <mesh position={[0, sitH + backH - 0.10, -d / 2 + 0.30]} rotation={[-0.20, 0, 0]} castShadow>
        <boxGeometry args={[w - 0.24, 0.22, 0.14]} />
        <primitive object={leatherL} attach="material" />
      </mesh>

      {/* Ayak desteği (ayrı tabure gibi önde) */}
      <mesh position={[0, 0.22, d / 2 - 0.02]} castShadow>
        <boxGeometry args={[w - 0.22, 0.18, 0.32]} />
        <primitive object={leather} attach="material" />
      </mesh>
      <mesh position={[0, 0.12, d / 2 - 0.02]} castShadow>
        <boxGeometry args={[w - 0.30, 0.04, 0.26]} />
        <primitive object={baseMat} attach="material" />
      </mesh>
    </group>
  )
}
