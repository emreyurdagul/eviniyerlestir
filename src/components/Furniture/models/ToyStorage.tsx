import * as THREE from 'three'
import type { ReactElement } from 'react'

const body   = new THREE.MeshLambertMaterial({ color: 0xf2f0e8 })
const binR   = new THREE.MeshLambertMaterial({ color: 0xe05050 })
const binB   = new THREE.MeshLambertMaterial({ color: 0x4a90d0 })
const binY   = new THREE.MeshLambertMaterial({ color: 0xf0c040 })
const binG   = new THREE.MeshLambertMaterial({ color: 0x60b070 })
const toyA   = new THREE.MeshLambertMaterial({ color: 0xe8a040 })
const toyB   = new THREE.MeshLambertMaterial({ color: 0xd04080 })

/** Oyuncak kutusu — düşük, bölmeli raf + renkli kutular */
export default function ToyStorage({ dims }: { dims: Record<string, number> }) {
  const w = (dims.width ?? 90) / 100
  const h = (dims.height ?? 70) / 100
  const d = 0.36

  const rows = 2
  const cols = 3
  const cellW = (w - 0.04) / cols
  const cellH = (h - 0.06) / rows

  // Gövde — arkalı raf
  const back = (
    <mesh position={[0, h / 2, -d / 2 + 0.01]}>
      <boxGeometry args={[w, h, 0.02]} />
      <primitive object={body} attach="material" />
    </mesh>
  )

  // Dikey ve yatay bölücüler
  const divs: ReactElement[] = []
  for (let c = 0; c <= cols; c++) {
    const x = -w / 2 + 0.02 + c * cellW
    divs.push(
      <mesh key={`v-${c}`} position={[x, h / 2, 0]} castShadow>
        <boxGeometry args={[0.025, h, d]} />
        <primitive object={body} attach="material" />
      </mesh>
    )
  }
  for (let r = 0; r <= rows; r++) {
    const y = 0.03 + r * cellH
    divs.push(
      <mesh key={`h-${r}`} position={[0, y, 0]} castShadow>
        <boxGeometry args={[w, 0.025, d]} />
        <primitive object={body} attach="material" />
      </mesh>
    )
  }

  // Renkli kutular (bazı hücrelerde)
  const binColors = [binR, binB, binY, binG, binR, binB]
  const bins: ReactElement[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const seed = (r * 31 + c * 17) % 4
      if (seed === 3) continue  // bazı hücreler boş — oyuncak görünecek
      const cx = -w / 2 + 0.02 + cellW * (c + 0.5)
      const cy = 0.03 + cellH * (r + 0.5)
      const idx = (r * cols + c) % binColors.length
      bins.push(
        <mesh
          key={`bin-${r}-${c}`}
          position={[cx, cy - cellH * 0.08, 0.02]}
          castShadow
        >
          <boxGeometry args={[cellW * 0.82, cellH * 0.70, d * 0.70]} />
          <primitive object={binColors[idx]} attach="material" />
        </mesh>
      )
    }
  }

  // Üst yüzeyde oyuncaklar (top + küp)
  const toys: ReactElement[] = []
  toys.push(
    <mesh
      key="toy-ball"
      position={[-w / 4, h + 0.06, 0]}
      castShadow
    >
      <sphereGeometry args={[0.06, 12, 10]} />
      <primitive object={toyA} attach="material" />
    </mesh>
  )
  toys.push(
    <mesh
      key="toy-cube"
      position={[w / 4, h + 0.05, 0]}
      rotation={[0, 0.4, 0]}
      castShadow
    >
      <boxGeometry args={[0.10, 0.10, 0.10]} />
      <primitive object={toyB} attach="material" />
    </mesh>
  )

  // Alt ayaklar
  const feet: ReactElement[] = []
  for (const sx of [-1, 1] as const) {
    for (const sz of [-1, 1] as const) {
      feet.push(
        <mesh
          key={`f-${sx}-${sz}`}
          position={[sx * (w / 2 - 0.04), 0.015, sz * (d / 2 - 0.04)]}
          castShadow
        >
          <boxGeometry args={[0.04, 0.03, 0.04]} />
          <primitive object={body} attach="material" />
        </mesh>
      )
    }
  }

  return (
    <group>
      {feet}
      {back}
      {divs}
      {bins}
      {toys}
    </group>
  )
}
