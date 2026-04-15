import * as THREE from 'three'
import type { ReactElement } from 'react'

const trunk   = new THREE.MeshLambertMaterial({ color: 0x6a4628 })
const trunkDk = new THREE.MeshLambertMaterial({ color: 0x4c3020 })
const leaf    = new THREE.MeshLambertMaterial({ color: 0x2e7a2e })
const leafLt  = new THREE.MeshLambertMaterial({ color: 0x4a9a44 })
const leafDk  = new THREE.MeshLambertMaterial({ color: 0x1e5e1e })
const pine    = new THREE.MeshLambertMaterial({ color: 0x2a6838 })
const pineDk  = new THREE.MeshLambertMaterial({ color: 0x1d4a26 })

/** Ağaç — gövde + yapraklı taç. Variant: round (geniş küresel) / pine (sivri konik). */
export default function Tree({
  dims,
  variant = 'round',
}: {
  dims: Record<string, number>
  variant?: string
}) {
  const height = (dims.height ?? 400) / 100
  const diameter = (dims.diameter ?? 200) / 100

  const trunkH = height * 0.35
  const trunkR = diameter * 0.05

  // Deterministik seed
  const seed = (i: number) =>
    Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1

  if (variant === 'pine') {
    // Konik (çam) — üst üste 3 konik katman
    const layers: ReactElement[] = []
    const canopyH = height - trunkH
    const layerCount = 3
    for (let i = 0; i < layerCount; i++) {
      const t = i / (layerCount - 1)           // 0..1 (alt..üst)
      const r = diameter / 2 * (1 - t * 0.55)
      const lh = canopyH * 0.45
      const y = trunkH + canopyH * 0.25 + t * (canopyH * 0.55)
      layers.push(
        <mesh key={`c-${i}`} position={[0, y, 0]} castShadow>
          <coneGeometry args={[r, lh, 14]} />
          <primitive object={i % 2 === 0 ? pine : pineDk} attach="material" />
        </mesh>
      )
    }
    return (
      <group>
        {/* Gövde */}
        <mesh position={[0, trunkH / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[trunkR * 0.8, trunkR, trunkH, 12]} />
          <primitive object={trunk} attach="material" />
        </mesh>
        {layers}
      </group>
    )
  }

  // Round (geniş küresel taç)
  const canopyR = diameter / 2
  const canopyY = trunkH + canopyR * 0.75

  // Ana küreler + 4 küçük yan küme (hacim hissi)
  const bumps: ReactElement[] = []
  const bumpCount = 5
  for (let i = 0; i < bumpCount; i++) {
    const theta = (i / bumpCount) * Math.PI * 2
    const r = canopyR * (0.45 + seed(i) * 0.15)
    const bx = Math.cos(theta) * canopyR * 0.55
    const bz = Math.sin(theta) * canopyR * 0.55
    const by = canopyY + (seed(i * 7) - 0.5) * canopyR * 0.4
    bumps.push(
      <mesh key={`b-${i}`} position={[bx, by, bz]} castShadow>
        <sphereGeometry args={[r, 12, 10]} />
        <primitive object={i % 2 === 0 ? leafLt : leafDk} attach="material" />
      </mesh>
    )
  }

  return (
    <group>
      {/* Gövde */}
      <mesh position={[0, trunkH / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[trunkR * 0.85, trunkR, trunkH, 12]} />
        <primitive object={trunk} attach="material" />
      </mesh>
      {/* Alt gövde bombesi (kök hissi) */}
      <mesh position={[0, 0.04, 0]} castShadow>
        <cylinderGeometry args={[trunkR * 1.25, trunkR * 1.4, 0.08, 12]} />
        <primitive object={trunkDk} attach="material" />
      </mesh>

      {/* Ana taç küresi */}
      <mesh position={[0, canopyY, 0]} castShadow>
        <sphereGeometry args={[canopyR, 16, 12]} />
        <primitive object={leaf} attach="material" />
      </mesh>

      {/* Yan hacim yumruları */}
      {bumps}
    </group>
  )
}
