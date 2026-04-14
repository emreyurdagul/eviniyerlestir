import * as THREE from 'three'
import type { ReactElement } from 'react'

const frame  = new THREE.MeshLambertMaterial({ color: 0x8a6a4a })
const headUp = new THREE.MeshLambertMaterial({ color: 0xc8a888 })
const button = new THREE.MeshLambertMaterial({ color: 0xb89860 })
const sheet  = new THREE.MeshLambertMaterial({ color: 0xf4eee5 })
const duvet  = new THREE.MeshLambertMaterial({ color: 0xd4c4a8 })
const pillow = new THREE.MeshLambertMaterial({ color: 0xf8f2e8 })

/** Tufted yatak — düğmeli yastıklı başlık (chesterfield benzeri) */
export default function BedTufted({ dims }: { dims: Record<string, number> }) {
  const len = (dims.length ?? 200) / 100
  const wid = (dims.width  ?? 160) / 100

  const frameH = 0.26
  const mattH = 0.22
  const duvetH = 0.07
  const headboardH = 1.00

  return (
    <group>
      {/* Çerçeve */}
      <mesh position={[0, frameH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[wid, frameH, len]} />
        <primitive object={frame} attach="material" />
      </mesh>

      {/* Tufted başlık (büyük, geniş, yastıklı) */}
      <mesh position={[0, frameH + headboardH / 2, -(len / 2 - 0.04)]} castShadow>
        <boxGeometry args={[wid + 0.10, headboardH, 0.20]} />
        <primitive object={headUp} attach="material" />
      </mesh>

      {/* Düğme (tufting) ızgara - diamond pattern */}
      {(() => {
        const rows = 4
        const cols = Math.max(5, Math.round(wid / 0.25))
        const btns: ReactElement[] = []
        for (let r = 0; r < rows; r++) {
          const offsetX = (r % 2) * (wid / cols) * 0.5
          for (let c = 0; c < cols; c++) {
            const bx = -wid / 2 + (wid / cols) * (c + 0.5) + offsetX
            if (Math.abs(bx) > wid / 2 - 0.04) continue
            const by = frameH + headboardH * (0.18 + r * 0.20)
            btns.push(
              <mesh key={`b-${r}-${c}`} position={[bx, by, -(len / 2 - 0.04) + 0.103]} castShadow>
                <sphereGeometry args={[0.022, 8, 6]} />
                <primitive object={button} attach="material" />
              </mesh>
            )
          }
        }
        return btns
      })()}

      {/* Yatak */}
      <mesh position={[0, frameH + mattH / 2, 0.02]} castShadow>
        <boxGeometry args={[wid - 0.04, mattH, len - 0.10]} />
        <primitive object={sheet} attach="material" />
      </mesh>

      {/* Yorgan */}
      <mesh position={[0, frameH + mattH + duvetH / 2, len * 0.14]} castShadow>
        <boxGeometry args={[wid - 0.02, duvetH, len * 0.58]} />
        <primitive object={duvet} attach="material" />
      </mesh>

      {/* Yastıklar (kat, dekoratif) */}
      {[-wid / 4, wid / 4].map((px, i) => (
        <group key={i}>
          <mesh
            position={[px, frameH + mattH + 0.07, -(len / 2 - 0.25)]}
            rotation={[-0.18, 0, 0]}
            castShadow
          >
            <boxGeometry args={[wid * 0.36, 0.10, 0.36]} />
            <primitive object={pillow} attach="material" />
          </mesh>
          <mesh
            position={[px, frameH + mattH + 0.16, -(len / 2 - 0.35)]}
            rotation={[-0.20, 0, 0]}
            castShadow
          >
            <boxGeometry args={[wid * 0.26, 0.08, 0.26]} />
            <primitive object={duvet} attach="material" />
          </mesh>
        </group>
      ))}
    </group>
  )
}
