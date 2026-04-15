import * as THREE from 'three'

const frame    = new THREE.MeshLambertMaterial({ color: 0x2f2f2f })
const frameTop = new THREE.MeshLambertMaterial({ color: 0x4a4a4a })
const head     = new THREE.MeshLambertMaterial({ color: 0x5a5048 })
const sheet    = new THREE.MeshLambertMaterial({ color: 0xf0ece2 })
const duvet    = new THREE.MeshLambertMaterial({ color: 0x8a7a68 })
const pillow   = new THREE.MeshLambertMaterial({ color: 0xfaf5ec })

/**
 * King size yatak — 200×200, en geniş, kalın yastıklı mattress, alçak başlık.
 */
export default function BedKing({ dims }: { dims: Record<string, number> }) {
  const len = (dims.length ?? 200) / 100
  const wid = (dims.width  ?? 200) / 100

  const frameH = 0.24
  const mattH  = 0.30      // kalın yatak
  const duvetH = 0.10
  const headboardH = 0.42  // alçak başlık

  return (
    <group>
      {/* ─── Geniş platform ─── */}
      <mesh position={[0, frameH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[wid + 0.12, frameH, len + 0.12]} />
        <primitive object={frame} attach="material" />
      </mesh>
      {/* Platform üst şerit */}
      <mesh position={[0, frameH + 0.005, 0]}>
        <boxGeometry args={[wid + 0.13, 0.01, len + 0.13]} />
        <primitive object={frameTop} attach="material" />
      </mesh>

      {/* ─── Alçak geniş başlık — düz panel ─── */}
      <mesh position={[0, frameH + headboardH / 2, -(len / 2 + 0.02)]} castShadow>
        <boxGeometry args={[wid + 0.12, headboardH, 0.10]} />
        <primitive object={head} attach="material" />
      </mesh>
      {/* Başlık yatay bölüm (3 panel simülasyonu — 2 ince dikey çizgi) */}
      {[-wid / 3, wid / 3].map((x, i) => (
        <mesh key={i} position={[x, frameH + headboardH / 2, -(len / 2 + 0.02) + 0.051]}>
          <boxGeometry args={[0.01, headboardH - 0.04, 0.01]} />
          <primitive object={frame} attach="material" />
        </mesh>
      ))}

      {/* ─── Kalın yatak (çift katlı görünüm) ─── */}
      {/* Alt kalın kısım */}
      <mesh position={[0, frameH + mattH * 0.38, 0.02]} castShadow>
        <boxGeometry args={[wid - 0.04, mattH * 0.55, len - 0.10]} />
        <primitive object={sheet} attach="material" />
      </mesh>
      {/* Üst pillow-top kısmı (daha yumuşak görünüm) */}
      <mesh position={[0, frameH + mattH * 0.82, 0.02]} castShadow>
        <boxGeometry args={[wid - 0.05, mattH * 0.35, len - 0.12]} />
        <primitive object={sheet} attach="material" />
      </mesh>

      {/* ─── Yorgan (geniş, aşağı sarkan) ─── */}
      <mesh position={[0, frameH + mattH + duvetH / 2, len * 0.12]} castShadow>
        <boxGeometry args={[wid, duvetH, len * 0.70]} />
        <primitive object={duvet} attach="material" />
      </mesh>
      {/* Yorgan yanlara sarkma */}
      {[-1, 1].map((s, i) => (
        <mesh
          key={i}
          position={[s * (wid / 2), frameH + mattH - 0.06, len * 0.12]}
          castShadow
        >
          <boxGeometry args={[0.04, 0.18, len * 0.70]} />
          <primitive object={duvet} attach="material" />
        </mesh>
      ))}
      {/* Yorgan ön sarkma */}
      <mesh position={[0, frameH + mattH - 0.06, len / 2 - 0.02]} castShadow>
        <boxGeometry args={[wid, 0.18, 0.04]} />
        <primitive object={duvet} attach="material" />
      </mesh>

      {/* ─── 4 büyük yastık (king standardı) ─── */}
      {[-wid * 0.30, -wid * 0.10, wid * 0.10, wid * 0.30].map((px, i) => (
        <mesh
          key={i}
          position={[px, frameH + mattH + 0.09, -(len / 2 - 0.30)]}
          rotation={[-0.14, 0, 0]}
          castShadow
        >
          <boxGeometry args={[wid * 0.18, 0.14, 0.42]} />
          <primitive object={pillow} attach="material" />
        </mesh>
      ))}
    </group>
  )
}
