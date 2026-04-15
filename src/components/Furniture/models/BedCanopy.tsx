import * as THREE from 'three'
import type { ReactElement } from 'react'

const wood     = new THREE.MeshLambertMaterial({ color: 0x3a2818 })
const woodDk   = new THREE.MeshLambertMaterial({ color: 0x261a0e })
const head     = new THREE.MeshLambertMaterial({ color: 0x6a4e36 })
const sheet    = new THREE.MeshLambertMaterial({ color: 0xf5efde })
const duvet    = new THREE.MeshLambertMaterial({ color: 0xd8c49a })
const pillow   = new THREE.MeshLambertMaterial({ color: 0xfdf7ea })
const drapeMat = new THREE.MeshLambertMaterial({
  color: 0xf0e8d2,
  transparent: true,
  opacity: 0.72,
  side: THREE.DoubleSide,
})

/**
 * Cibinlikli (canopy) yatak — 4 köşede dikey sütun, üst çerçeve, yan perdeler.
 */
export default function BedCanopy({ dims }: { dims: Record<string, number> }) {
  const len = (dims.length ?? 200) / 100
  const wid = (dims.width  ?? 160) / 100

  const frameH     = 0.28
  const mattH      = 0.22
  const duvetH     = 0.07
  const headboardH = 0.95
  const postH      = 2.20       // cibinlik sütun yüksekliği
  const postR      = 0.035      // sütun yarıçapı
  const canopyY    = postH      // üst çerçeve y

  const halfW = wid / 2
  const halfL = len / 2

  const corners: Array<[number, number]> = [
    [-halfW,  halfL],
    [ halfW,  halfL],
    [-halfW, -halfL],
    [ halfW, -halfL],
  ]

  const posts: ReactElement[] = corners.map(([x, z], i) => (
    <mesh key={`p-${i}`} position={[x, postH / 2, z]} castShadow>
      <cylinderGeometry args={[postR, postR, postH, 10]} />
      <primitive object={wood} attach="material" />
    </mesh>
  ))

  // Sütun üst top (dekoratif küre)
  const finials: ReactElement[] = corners.map(([x, z], i) => (
    <mesh key={`f-${i}`} position={[x, postH + 0.04, z]} castShadow>
      <sphereGeometry args={[0.06, 12, 10]} />
      <primitive object={woodDk} attach="material" />
    </mesh>
  ))

  return (
    <group>
      {/* ─── Çerçeve ─── */}
      <mesh position={[0, frameH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[wid, frameH, len]} />
        <primitive object={wood} attach="material" />
      </mesh>
      <mesh position={[0, frameH + 0.01, 0]} castShadow>
        <boxGeometry args={[wid + 0.02, 0.02, len + 0.02]} />
        <primitive object={woodDk} attach="material" />
      </mesh>

      {/* ─── Sütunlar + finials ─── */}
      {posts}
      {finials}

      {/* ─── Üst cibinlik çerçevesi (4 kiriş) ─── */}
      {/* Ön kiriş */}
      <mesh position={[0, canopyY, halfL]} castShadow>
        <boxGeometry args={[wid + postR * 2, 0.06, 0.06]} />
        <primitive object={wood} attach="material" />
      </mesh>
      {/* Arka kiriş */}
      <mesh position={[0, canopyY, -halfL]} castShadow>
        <boxGeometry args={[wid + postR * 2, 0.06, 0.06]} />
        <primitive object={wood} attach="material" />
      </mesh>
      {/* Sol kiriş */}
      <mesh position={[-halfW, canopyY, 0]} castShadow>
        <boxGeometry args={[0.06, 0.06, len]} />
        <primitive object={wood} attach="material" />
      </mesh>
      {/* Sağ kiriş */}
      <mesh position={[ halfW, canopyY, 0]} castShadow>
        <boxGeometry args={[0.06, 0.06, len]} />
        <primitive object={wood} attach="material" />
      </mesh>

      {/* ─── Başlık ─── */}
      <mesh position={[0, frameH + headboardH / 2, -(halfL - 0.06)]} castShadow>
        <boxGeometry args={[wid - 0.04, headboardH, 0.10]} />
        <primitive object={head} attach="material" />
      </mesh>

      {/* ─── Yatak ─── */}
      <mesh position={[0, frameH + mattH / 2, 0.02]} castShadow>
        <boxGeometry args={[wid - 0.08, mattH, len - 0.12]} />
        <primitive object={sheet} attach="material" />
      </mesh>

      {/* ─── Yorgan ─── */}
      <mesh position={[0, frameH + mattH + duvetH / 2, len * 0.14]} castShadow>
        <boxGeometry args={[wid - 0.04, duvetH, len * 0.60]} />
        <primitive object={duvet} attach="material" />
      </mesh>
      <mesh position={[0, frameH + mattH - 0.04, halfL - 0.04]} castShadow>
        <boxGeometry args={[wid - 0.04, 0.14, 0.04]} />
        <primitive object={duvet} attach="material" />
      </mesh>

      {/* ─── Yastıklar (2 adet) ─── */}
      {[-wid / 4.2, wid / 4.2].map((px, i) => (
        <mesh
          key={`pw-${i}`}
          position={[px, frameH + mattH + 0.08, -(halfL - 0.28)]}
          rotation={[-0.16, 0, 0]}
          castShadow
        >
          <boxGeometry args={[wid * 0.36, 0.12, 0.38]} />
          <primitive object={pillow} attach="material" />
        </mesh>
      ))}

      {/* ─── Perde paneller (4 köşede yarı şeffaf) ─── */}
      {corners.map(([x, z], i) => {
        const towardCenterX = x > 0 ? -1 : 1
        const towardCenterZ = z > 0 ? -1 : 1
        return (
          <group key={`drape-${i}`}>
            {/* Sütunun yan tarafı (uzunluk doğrultusunda) */}
            <mesh
              position={[x + towardCenterX * 0.03, postH * 0.55, z + towardCenterZ * 0.22]}
              castShadow
            >
              <planeGeometry args={[0.42, postH - frameH - 0.10]} />
              <primitive object={drapeMat} attach="material" />
            </mesh>
            {/* Sütunun ön/arka tarafı (genişlik doğrultusunda) */}
            <mesh
              position={[x + towardCenterX * 0.22, postH * 0.55, z + towardCenterZ * 0.03]}
              rotation={[0, Math.PI / 2, 0]}
              castShadow
            >
              <planeGeometry args={[0.42, postH - frameH - 0.10]} />
              <primitive object={drapeMat} attach="material" />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
