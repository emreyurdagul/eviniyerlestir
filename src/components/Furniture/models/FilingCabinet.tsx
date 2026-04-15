import * as THREE from 'three'
import type { ReactElement } from 'react'

const body   = new THREE.MeshLambertMaterial({ color: 0x4a4a4a })
const front  = new THREE.MeshLambertMaterial({ color: 0x5a5a5a })
const handle = new THREE.MeshLambertMaterial({ color: 0xbababa })
const top    = new THREE.MeshLambertMaterial({ color: 0x3a3a3a })

/** Dosya dolabı — 3 çekmeceli, metal görünümlü, küçük ofis dolabı */
export default function FilingCabinet({ dims }: { dims: Record<string, number> }) {
  const w = (dims.width ?? 45) / 100
  const h = (dims.height ?? 100) / 100
  const d = (dims.depth ?? 50) / 100

  const drawerCount = h > 1.1 ? 4 : 3
  const drawerH = (h - 0.04) / drawerCount

  // Gövde
  const bodyMesh = (
    <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
      <primitive object={body} attach="material" />
    </mesh>
  )

  // Üst plaka
  const topMesh = (
    <mesh position={[0, h + 0.005, 0]} castShadow>
      <boxGeometry args={[w + 0.02, 0.01, d + 0.02]} />
      <primitive object={top} attach="material" />
    </mesh>
  )

  // Çekmece yüzleri + kulplar
  const drawers: ReactElement[] = []
  for (let i = 0; i < drawerCount; i++) {
    const y = 0.02 + i * drawerH + drawerH / 2
    drawers.push(
      <mesh
        key={`df-${i}`}
        position={[0, y, d / 2 + 0.005]}
        castShadow
      >
        <boxGeometry args={[w - 0.04, drawerH - 0.02, 0.012]} />
        <primitive object={front} attach="material" />
      </mesh>
    )
    // Kulp — uzun bar
    drawers.push(
      <mesh
        key={`dh-${i}`}
        position={[0, y, d / 2 + 0.018]}
        castShadow
      >
        <boxGeometry args={[w * 0.35, 0.022, 0.012]} />
        <primitive object={handle} attach="material" />
      </mesh>
    )
    // Etiket tutucu
    drawers.push(
      <mesh
        key={`dl-${i}`}
        position={[w * 0.3, y + drawerH * 0.28, d / 2 + 0.015]}
      >
        <boxGeometry args={[w * 0.12, 0.035, 0.006]} />
        <primitive object={handle} attach="material" />
      </mesh>
    )
  }

  return (
    <group>
      {bodyMesh}
      {topMesh}
      {drawers}
    </group>
  )
}
