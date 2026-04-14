import * as THREE from 'three'
import type { ReactElement } from 'react'

const wood   = new THREE.MeshLambertMaterial({ color: 0xc9b896 })
const woodDk = new THREE.MeshLambertMaterial({ color: 0x9a8060 })
const filler1 = new THREE.MeshLambertMaterial({ color: 0x7a4a3a })
const filler2 = new THREE.MeshLambertMaterial({ color: 0x3a5a7a })

/** Küp kitaplık — kareye benzer eşit bölmeler grid'i */
export default function ShelfCube({ dims }: { dims: Record<string, number> }) {
  const w = (dims.width ?? 80) / 100
  const h = (dims.height ?? 180) / 100
  const d = 0.32

  // Kolon ve sıra sayısı (genişlik/yükseklik oranına göre)
  const cols = Math.max(2, Math.round(w / 0.35))
  const rows = Math.max(3, Math.round(h / 0.35))
  const cellW = (w - 0.02) / cols
  const cellH = (h - 0.02) / rows

  // Dikey bölücüler
  const vDivs: ReactElement[] = []
  for (let c = 0; c <= cols; c++) {
    const x = -w / 2 + 0.01 + c * cellW
    vDivs.push(
      <mesh key={`v-${c}`} position={[x, h / 2, 0]} castShadow>
        <boxGeometry args={[0.025, h, d]} />
        <primitive object={woodDk} attach="material" />
      </mesh>
    )
  }
  // Yatay bölücüler
  const hDivs: ReactElement[] = []
  for (let r = 0; r <= rows; r++) {
    const y = 0.01 + r * cellH
    hDivs.push(
      <mesh key={`h-${r}`} position={[0, y, 0]} castShadow>
        <boxGeometry args={[w, 0.02, d]} />
        <primitive object={wood} attach="material" />
      </mesh>
    )
  }

  // Arka panel
  const back = (
    <mesh position={[0, h / 2, -d / 2 + 0.003]}>
      <boxGeometry args={[w - 0.01, h - 0.02, 0.006]} />
      <primitive object={wood} attach="material" />
    </mesh>
  )

  // Rastgele dolgular — bazı bölmelerde kitap veya vazo şekli
  const fillers: ReactElement[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Deterministik seçim
      const seed = (r * 31 + c * 17) % 7
      if (seed < 3) continue  // bazı hücreler boş
      const cx = -w / 2 + 0.01 + cellW * (c + 0.5)
      const cy = 0.01 + cellH * (r + 0.5)
      if (seed === 3 || seed === 4) {
        // Kitap sırası
        fillers.push(
          <mesh
            key={`f-${r}-${c}`}
            position={[cx, cy - cellH * 0.1, d * 0.1]}
            castShadow
          >
            <boxGeometry args={[cellW * 0.6, cellH * 0.55, d * 0.5]} />
            <primitive object={filler1} attach="material" />
          </mesh>
        )
      } else {
        // Dekoratif dikdörtgen (kutu)
        fillers.push(
          <mesh
            key={`f-${r}-${c}`}
            position={[cx, cy - cellH * 0.2, 0]}
            castShadow
          >
            <boxGeometry args={[cellW * 0.4, cellH * 0.4, d * 0.6]} />
            <primitive object={filler2} attach="material" />
          </mesh>
        )
      }
    }
  }

  return (
    <group>
      {back}
      {hDivs}
      {vDivs}
      {fillers}
    </group>
  )
}
