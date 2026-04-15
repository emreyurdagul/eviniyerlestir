import * as THREE from 'three'

const frame   = new THREE.MeshLambertMaterial({ color: 0x4a4a4a })
const frameLt = new THREE.MeshLambertMaterial({ color: 0x6a6a6a })
const head    = new THREE.MeshLambertMaterial({ color: 0xa89c88 })
const stitch  = new THREE.MeshLambertMaterial({ color: 0x8a7e6a })
const sheet   = new THREE.MeshLambertMaterial({ color: 0xf4f1eb })
const duvet   = new THREE.MeshLambertMaterial({ color: 0xb8a890 })
const pillow  = new THREE.MeshLambertMaterial({ color: 0xfaf5ec })

/**
 * Queen size yatak — 160×200, modern kenar dikiş detayı, geniş panel başlık.
 */
export default function BedQueen({ dims }: { dims: Record<string, number> }) {
  const len = (dims.length ?? 200) / 100
  const wid = (dims.width  ?? 160) / 100

  const frameH = 0.22
  const mattH  = 0.24
  const duvetH = 0.08
  const headboardH = 0.78

  return (
    <group>
      {/* ─── Platform çerçeve (alçak) ─── */}
      <mesh position={[0, frameH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[wid, frameH, len]} />
        <primitive object={frame} attach="material" />
      </mesh>
      {/* Platform üst şerit (kenar dikiş simülasyonu) */}
      <mesh position={[0, frameH + 0.005, 0]}>
        <boxGeometry args={[wid + 0.01, 0.01, len + 0.01]} />
        <primitive object={frameLt} attach="material" />
      </mesh>

      {/* ─── Panel başlık (geniş, yumuşak) ─── */}
      <mesh position={[0, frameH + headboardH / 2, -(len / 2 - 0.05)]} castShadow>
        <boxGeometry args={[wid + 0.06, headboardH, 0.14]} />
        <primitive object={head} attach="material" />
      </mesh>
      {/* Başlık kenar dikiş çerçevesi (ince çerçeve) */}
      {/* Sol dikey */}
      <mesh position={[-(wid / 2 - 0.02), frameH + headboardH / 2, -(len / 2 - 0.05) + 0.071]}>
        <boxGeometry args={[0.008, headboardH - 0.08, 0.008]} />
        <primitive object={stitch} attach="material" />
      </mesh>
      {/* Sağ dikey */}
      <mesh position={[ (wid / 2 - 0.02), frameH + headboardH / 2, -(len / 2 - 0.05) + 0.071]}>
        <boxGeometry args={[0.008, headboardH - 0.08, 0.008]} />
        <primitive object={stitch} attach="material" />
      </mesh>
      {/* Üst yatay */}
      <mesh position={[0, frameH + headboardH - 0.04, -(len / 2 - 0.05) + 0.071]}>
        <boxGeometry args={[wid - 0.04, 0.008, 0.008]} />
        <primitive object={stitch} attach="material" />
      </mesh>
      {/* Alt yatay */}
      <mesh position={[0, frameH + 0.04, -(len / 2 - 0.05) + 0.071]}>
        <boxGeometry args={[wid - 0.04, 0.008, 0.008]} />
        <primitive object={stitch} attach="material" />
      </mesh>

      {/* ─── Yatak ─── */}
      <mesh position={[0, frameH + mattH / 2, 0.02]} castShadow>
        <boxGeometry args={[wid - 0.04, mattH, len - 0.10]} />
        <primitive object={sheet} attach="material" />
      </mesh>

      {/* Yatak kenar dikiş (uzun kenarlar) */}
      {[-1, 1].map((s, i) => (
        <mesh key={i} position={[s * (wid / 2 - 0.025), frameH + mattH / 2, 0.02]}>
          <boxGeometry args={[0.006, mattH - 0.04, len - 0.14]} />
          <primitive object={stitch} attach="material" />
        </mesh>
      ))}

      {/* ─── Yorgan — düz, modern ─── */}
      <mesh position={[0, frameH + mattH + duvetH / 2, len * 0.13]} castShadow>
        <boxGeometry args={[wid - 0.02, duvetH, len * 0.62]} />
        <primitive object={duvet} attach="material" />
      </mesh>
      {/* Yorgan sarkma */}
      <mesh position={[0, frameH + mattH - 0.04, len / 2 - 0.02]} castShadow>
        <boxGeometry args={[wid - 0.02, 0.14, 0.04]} />
        <primitive object={duvet} attach="material" />
      </mesh>

      {/* ─── Yastıklar (2 adet, modern düz) ─── */}
      {[-wid / 4, wid / 4].map((px, i) => (
        <mesh
          key={i}
          position={[px, frameH + mattH + 0.07, -(len / 2 - 0.28)]}
          rotation={[-0.12, 0, 0]}
          castShadow
        >
          <boxGeometry args={[wid * 0.40, 0.10, 0.38]} />
          <primitive object={pillow} attach="material" />
        </mesh>
      ))}
    </group>
  )
}
