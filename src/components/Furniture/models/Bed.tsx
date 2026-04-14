import * as THREE from 'three'

const frame    = new THREE.MeshLambertMaterial({ color: 0x8a6a4a })
const frameTop = new THREE.MeshLambertMaterial({ color: 0x6a4a2a })
const head     = new THREE.MeshLambertMaterial({ color: 0xb8a27a })
const headCap  = new THREE.MeshLambertMaterial({ color: 0xd4bf95 })
const sheet    = new THREE.MeshLambertMaterial({ color: 0xf4eee5 })
const duvet    = new THREE.MeshLambertMaterial({ color: 0xe0d4b8 })
const pillow   = new THREE.MeshLambertMaterial({ color: 0xf8f2e8 })

/**
 * Çift kişilik yatak — ahşap çerçeve, yastıklı başlık, yorgan, 2 yastık.
 */
export default function Bed({ dims }: { dims: Record<string, number> }) {
  const len = (dims.length ?? 200) / 100
  const wid = (dims.width  ?? 160) / 100

  const frameH = 0.28
  const mattH  = 0.22
  const duvetH = 0.07
  const headboardH = 0.85

  return (
    <group>
      {/* ─── Çerçeve ─── */}
      <mesh position={[0, frameH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[wid, frameH, len]} />
        <primitive object={frame} attach="material" />
      </mesh>
      {/* Çerçeve üst kenar şeridi */}
      <mesh position={[0, frameH + 0.01, 0]} castShadow>
        <boxGeometry args={[wid + 0.02, 0.02, len + 0.02]} />
        <primitive object={frameTop} attach="material" />
      </mesh>

      {/* ─── Başlık (headboard) ─── */}
      <mesh position={[0, frameH + headboardH / 2, -(len / 2 - 0.06)]} castShadow>
        <boxGeometry args={[wid + 0.08, headboardH, 0.12]} />
        <primitive object={head} attach="material" />
      </mesh>
      {/* Başlık tepe şeridi */}
      <mesh position={[0, frameH + headboardH + 0.02, -(len / 2 - 0.06)]} castShadow>
        <boxGeometry args={[wid + 0.12, 0.04, 0.16]} />
        <primitive object={headCap} attach="material" />
      </mesh>
      {/* Başlık dikiş çizgileri (2 dikey) */}
      {[-wid / 4, wid / 4].map((x, i) => (
        <mesh key={i} position={[x, frameH + headboardH / 2, -(len / 2 - 0.005)]}>
          <boxGeometry args={[0.01, headboardH - 0.08, 0.01]} />
          <primitive object={frameTop} attach="material" />
        </mesh>
      ))}

      {/* ─── Yatak (mattress) ─── */}
      <mesh position={[0, frameH + mattH / 2, 0.02]} castShadow>
        <boxGeometry args={[wid - 0.04, mattH, len - 0.12]} />
        <primitive object={sheet} attach="material" />
      </mesh>

      {/* ─── Yorgan (ön tarafa daha fazla düşer) ─── */}
      <mesh
        position={[0, frameH + mattH + duvetH / 2, len * 0.15]}
        castShadow
      >
        <boxGeometry args={[wid - 0.02, duvetH, len * 0.58]} />
        <primitive object={duvet} attach="material" />
      </mesh>
      {/* Yorgan kenarı (yatağın ön ucundan sarkar) */}
      <mesh
        position={[0, frameH + mattH - 0.04, len / 2 - 0.02]}
        castShadow
      >
        <boxGeometry args={[wid - 0.02, 0.14, 0.04]} />
        <primitive object={duvet} attach="material" />
      </mesh>

      {/* ─── Yastıklar (2 adet) ─── */}
      {[-wid / 4.2, wid / 4.2].map((px, i) => (
        <group key={i}>
          <mesh
            position={[px, frameH + mattH + 0.08, -(len / 2 - 0.30)]}
            rotation={[-0.15, 0, 0]}
            castShadow
          >
            <boxGeometry args={[wid * 0.38, 0.12, 0.38]} />
            <primitive object={pillow} attach="material" />
          </mesh>
        </group>
      ))}
    </group>
  )
}
