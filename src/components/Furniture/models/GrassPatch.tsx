import * as THREE from 'three'
import type { ReactElement } from 'react'

const grass   = new THREE.MeshLambertMaterial({ color: 0x4e9c3e })
const grassLt = new THREE.MeshLambertMaterial({ color: 0x6ab856 })
const grassDk = new THREE.MeshLambertMaterial({ color: 0x386a2a })
const edge    = new THREE.MeshLambertMaterial({ color: 0x2e5622 })

/** Çim alan — çok ince yeşil plaka + deterministik çim tutamları */
export default function GrassPatch({ dims }: { dims: Record<string, number> }) {
  const l = (dims.length ?? 400) / 100
  const w = (dims.width ?? 300) / 100

  // Deterministik küçük çim tutamları — görsel zenginlik
  const tufts: ReactElement[] = []
  const cols = Math.max(3, Math.round(l / 0.55))
  const rows = Math.max(3, Math.round(w / 0.55))
  const seeded = (i: number, j: number) =>
    Math.abs(Math.sin((i * 31 + j * 17) * 12.9898) * 43758.5453) % 1

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const s = seeded(i, j)
      if (s < 0.35) continue   // bazı hücreler boş
      const cx = -l / 2 + (i + 0.5) * (l / cols) + (s - 0.5) * 0.08
      const cz = -w / 2 + (j + 0.5) * (w / rows) + (seeded(j, i) - 0.5) * 0.08
      const th = 0.05 + s * 0.05
      const mat = s > 0.7 ? grassLt : grassDk
      tufts.push(
        <mesh key={`t-${i}-${j}`} position={[cx, th / 2 + 0.02, cz]}>
          <boxGeometry args={[0.06, th, 0.06]} />
          <primitive object={mat} attach="material" />
        </mesh>
      )
    }
  }

  return (
    <group>
      {/* Ana plaka — çok ince */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[l, 0.04, w]} />
        <primitive object={grass} attach="material" />
      </mesh>

      {/* Kenar hattı (biraz koyu çerçeve) */}
      <mesh position={[0, 0.021, w / 2 - 0.02]}>
        <boxGeometry args={[l, 0.042, 0.04]} />
        <primitive object={edge} attach="material" />
      </mesh>
      <mesh position={[0, 0.021, -w / 2 + 0.02]}>
        <boxGeometry args={[l, 0.042, 0.04]} />
        <primitive object={edge} attach="material" />
      </mesh>
      <mesh position={[-l / 2 + 0.02, 0.021, 0]}>
        <boxGeometry args={[0.04, 0.042, w]} />
        <primitive object={edge} attach="material" />
      </mesh>
      <mesh position={[l / 2 - 0.02, 0.021, 0]}>
        <boxGeometry args={[0.04, 0.042, w]} />
        <primitive object={edge} attach="material" />
      </mesh>

      {/* Deterministik tutamlar */}
      {tufts}
    </group>
  )
}
