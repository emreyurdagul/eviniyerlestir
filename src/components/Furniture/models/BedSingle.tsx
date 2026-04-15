import * as THREE from 'three'

const frame   = new THREE.MeshLambertMaterial({ color: 0xb89060 })
const frameDk = new THREE.MeshLambertMaterial({ color: 0x8a6640 })
const head    = new THREE.MeshLambertMaterial({ color: 0xd4b896 })
const sheet   = new THREE.MeshLambertMaterial({ color: 0xf2efe5 })
const duvet   = new THREE.MeshLambertMaterial({ color: 0xb8d4e8 })
const pillow  = new THREE.MeshLambertMaterial({ color: 0xfaf4ea })

/**
 * Tek kişilik yatak — dar (90×190), yuvarlak başlık, çocuk/misafir odası.
 */
export default function BedSingle({ dims }: { dims: Record<string, number> }) {
  // Single sabit oranlar — input 90×190 civarında
  const len = Math.min((dims.length ?? 190) / 100, 2.0)
  const wid = Math.min((dims.width  ?? 90)  / 100, 1.10)

  const frameH = 0.26
  const mattH  = 0.18
  const duvetH = 0.06
  const headboardH = 0.68

  return (
    <group>
      {/* ─── Çerçeve ─── */}
      <mesh position={[0, frameH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[wid, frameH, len]} />
        <primitive object={frame} attach="material" />
      </mesh>
      {/* Çerçeve alt üst kenar şeridi */}
      <mesh position={[0, frameH + 0.01, 0]} castShadow>
        <boxGeometry args={[wid + 0.02, 0.02, len + 0.02]} />
        <primitive object={frameDk} attach="material" />
      </mesh>

      {/* ─── Başlık (dikdörtgen ana gövde) ─── */}
      <mesh position={[0, frameH + headboardH * 0.42, -(len / 2 - 0.05)]} castShadow>
        <boxGeometry args={[wid + 0.04, headboardH * 0.85, 0.10]} />
        <primitive object={head} attach="material" />
      </mesh>
      {/* Yuvarlak başlık üst kısmı — silindir yatay */}
      <mesh
        position={[0, frameH + headboardH * 0.85, -(len / 2 - 0.05)]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[headboardH * 0.28, headboardH * 0.28, wid + 0.04, 24, 1, false, 0, Math.PI]} />
        <primitive object={head} attach="material" />
      </mesh>

      {/* ─── Ayaklar (4 adet, köşelerde kısa) ─── */}
      {[
        [-wid / 2 + 0.05, -len / 2 + 0.05],
        [ wid / 2 - 0.05, -len / 2 + 0.05],
        [-wid / 2 + 0.05,  len / 2 - 0.05],
        [ wid / 2 - 0.05,  len / 2 - 0.05],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.04, z]} castShadow>
          <boxGeometry args={[0.06, 0.08, 0.06]} />
          <primitive object={frameDk} attach="material" />
        </mesh>
      ))}

      {/* ─── Yatak ─── */}
      <mesh position={[0, frameH + mattH / 2, 0.02]} castShadow>
        <boxGeometry args={[wid - 0.04, mattH, len - 0.10]} />
        <primitive object={sheet} attach="material" />
      </mesh>

      {/* ─── Yorgan (renkli, çocuk için) ─── */}
      <mesh position={[0, frameH + mattH + duvetH / 2, len * 0.16]} castShadow>
        <boxGeometry args={[wid - 0.02, duvetH, len * 0.55]} />
        <primitive object={duvet} attach="material" />
      </mesh>
      {/* Yorgan ön sarkma */}
      <mesh position={[0, frameH + mattH - 0.03, len / 2 - 0.02]} castShadow>
        <boxGeometry args={[wid - 0.02, 0.12, 0.04]} />
        <primitive object={duvet} attach="material" />
      </mesh>

      {/* ─── Tek yastık ─── */}
      <mesh
        position={[0, frameH + mattH + 0.06, -(len / 2 - 0.25)]}
        rotation={[-0.14, 0, 0]}
        castShadow
      >
        <boxGeometry args={[wid * 0.75, 0.10, 0.32]} />
        <primitive object={pillow} attach="material" />
      </mesh>
    </group>
  )
}
