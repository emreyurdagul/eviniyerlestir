import * as THREE from 'three'

const ceramic   = new THREE.MeshLambertMaterial({ color: 0xf6f6f2 })
const ceramicSh = new THREE.MeshLambertMaterial({ color: 0xe0e0d8 })
const seatMat   = new THREE.MeshLambertMaterial({ color: 0xf8f8f4 })
const chrome    = new THREE.MeshLambertMaterial({ color: 0xbcbcc0 })

/** Asılı Klozet — duvara monte, rezervuar gizli (ince duvar paneli) */
export default function ToiletWall({ dims }: { dims: Record<string, number> }) {
  const d = (dims.depth ?? 60) / 100
  const w = 0.38

  return (
    <group>
      {/* Arka duvar gizli rezervuar paneli */}
      <mesh position={[0, 0.55, -d / 2 + 0.05]} castShadow>
        <boxGeometry args={[w + 0.10, 1.10, 0.10]} />
        <primitive object={ceramicSh} attach="material" />
      </mesh>

      {/* Sifon butonu paneli (üstte) */}
      <mesh position={[0, 1.00, -d / 2 + 0.11]}>
        <boxGeometry args={[0.20, 0.14, 0.01]} />
        <primitive object={chrome} attach="material" />
      </mesh>

      {/* Asılı kase — zeminden 40 cm yukarda */}
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[w, 0.32, d - 0.10]} />
        <primitive object={ceramic} attach="material" />
      </mesh>

      {/* Kase alt yuvarlatması */}
      <mesh position={[0, 0.28, 0.03]} castShadow>
        <boxGeometry args={[w - 0.06, 0.14, d - 0.18]} />
        <primitive object={ceramic} attach="material" />
      </mesh>

      {/* Oturak */}
      <mesh position={[0, 0.595, 0.02]} castShadow>
        <boxGeometry args={[w - 0.01, 0.03, d - 0.12]} />
        <primitive object={seatMat} attach="material" />
      </mesh>

      {/* Oturak içi açıklık */}
      <mesh position={[0, 0.58, 0.03]}>
        <boxGeometry args={[w - 0.12, 0.01, d - 0.22]} />
        <primitive object={ceramicSh} attach="material" />
      </mesh>
    </group>
  )
}
