import * as THREE from 'three'
import type { ReactElement } from 'react'

const body   = new THREE.MeshLambertMaterial({ color: 0x8c6a48 })
const top    = new THREE.MeshLambertMaterial({ color: 0x66482c })
const drawer = new THREE.MeshLambertMaterial({ color: 0x9e7c58 })
const handle = new THREE.MeshLambertMaterial({ color: 0x33291e })
const leg    = new THREE.MeshLambertMaterial({ color: 0x4a382a })

interface Props {
  dims: Record<string, number>
  /** Çekmece sayısı — varyantlar: 3 / 4 / 6 */
  drawerCount?: number
}

/**
 * Şifonyer (dresser) — geniş alçak çok çekmeceli depolama.
 * Varsayılan: 4 çekmece (2 sıra × 2 sütun). 3 ve 6 drawer için ayrı varyant dosyaları.
 */
export default function Dresser({ dims, drawerCount = 4 }: Props) {
  const w = (dims.width  ?? 140) / 100
  const h = (dims.height ?? 85)  / 100
  const d = 0.50

  const legH    = 0.10
  const topT    = 0.035
  const bodyInH = h - legH - topT

  // Çekmece grid hesabı
  // 3 -> 3 satır × 1 sütun
  // 4 -> 2 satır × 2 sütun
  // 6 -> 3 satır × 2 sütun
  let rows = 2
  let cols = 2
  if (drawerCount === 3) { rows = 3; cols = 1 }
  else if (drawerCount === 6) { rows = 3; cols = 2 }
  else { rows = 2; cols = 2 }

  const gap = 0.015
  const drawerH = (bodyInH - gap * (rows + 1)) / rows
  const drawerW = (w - gap * (cols + 1)) / cols

  const drawers: ReactElement[] = []
  for (let r = 0; r < rows; r++) {
    const dy = legH + gap + drawerH / 2 + r * (drawerH + gap)
    for (let c = 0; c < cols; c++) {
      const dx = -w / 2 + gap + drawerW / 2 + c * (drawerW + gap)
      drawers.push(
        <group key={`dr-${r}-${c}`}>
          {/* Çekmece yüzü */}
          <mesh position={[dx, dy, d / 2 + 0.002]} castShadow>
            <boxGeometry args={[drawerW, drawerH, 0.012]} />
            <primitive object={drawer} attach="material" />
          </mesh>
          {/* Kulp */}
          <mesh position={[dx, dy, d / 2 + 0.020]} castShadow>
            <boxGeometry args={[drawerW * 0.40, 0.022, 0.022]} />
            <primitive object={handle} attach="material" />
          </mesh>
        </group>
      )
    }
  }

  return (
    <group>
      {/* Ayaklar (4 köşe) */}
      {[
        [-w / 2 + 0.04, -d / 2 + 0.04],
        [ w / 2 - 0.04, -d / 2 + 0.04],
        [-w / 2 + 0.04,  d / 2 - 0.04],
        [ w / 2 - 0.04,  d / 2 - 0.04],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, legH / 2, z]} castShadow>
          <boxGeometry args={[0.06, legH, 0.06]} />
          <primitive object={leg} attach="material" />
        </mesh>
      ))}

      {/* Gövde */}
      <mesh position={[0, legH + bodyInH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, bodyInH, d]} />
        <primitive object={body} attach="material" />
      </mesh>

      {/* Üst tabla */}
      <mesh position={[0, legH + bodyInH + topT / 2, 0]} castShadow>
        <boxGeometry args={[w + 0.03, topT, d + 0.03]} />
        <primitive object={top} attach="material" />
      </mesh>

      {drawers}
    </group>
  )
}
