import * as THREE from 'three'
import type { ReactElement } from 'react'

const frame  = new THREE.MeshLambertMaterial({ color: 0xe8dcc8 })
const rail   = new THREE.MeshLambertMaterial({ color: 0xd4c4ae })
const mat    = new THREE.MeshLambertMaterial({ color: 0xfaf5ea })
const blnkt  = new THREE.MeshLambertMaterial({ color: 0xf0b5c8 })
const pillow = new THREE.MeshLambertMaterial({ color: 0xffffff })

// Modern (sade hatlı) palet
const mFrame = new THREE.MeshLambertMaterial({ color: 0xf2efe9 })  // beyaza yakın çerçeve
const mPanel = new THREE.MeshLambertMaterial({ color: 0xe6e0d6 })  // dolu yan panel
const mWood  = new THREE.MeshLambertMaterial({ color: 0xc8b79a })  // taban (açık ahşap)
const mAccent= new THREE.MeshLambertMaterial({ color: 0x9fb0bf })  // dingin mavi yorgan

/**
 * Beşik — yatak + parmaklıklar; varsayılan 120×60 cm.
 * Variant:
 *   classic — standart yuvarlak parmaklıklı, sıcak ahşap (varsayılan)
 *   modern  — dolu yan paneller + yassı dikey çıtalar, sade/açık tonlar
 */
export default function Crib({
  dims,
  variant = 'classic',
}: {
  dims: Record<string, number>
  variant?: string
}) {
  const len = (dims.length ?? 120) / 100
  const wid = (dims.width ?? 60) / 100

  // ─────────────────────────────────────────────────────────────
  //  MODERN — sade hatlı: dolu kısa paneller, yassı dikey çıtalar
  // ─────────────────────────────────────────────────────────────
  if (variant === 'modern') {
    const endThick = 0.05
    const railTop = 0.84
    const mattTop = 0.30
    const slatBottom = 0.18
    const baseSlabH = 0.06
    const slatH = railTop - slatBottom

    // Dolu yan paneller (kısa kenarlar) — yere kadar inen sade panel
    const panels: ReactElement[] = []
    for (const sx of [-1, 1] as const) {
      panels.push(
        <mesh
          key={`mp-${sx}`}
          position={[sx * (len / 2 - endThick / 2), railTop / 2, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[endThick, railTop, wid]} />
          <primitive object={mPanel} attach="material" />
        </mesh>
      )
    }

    // Yatak desteği (taban tablası)
    const baseSlab = (
      <mesh position={[0, mattTop - baseSlabH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[len - 0.10, baseSlabH, wid - 0.06]} />
        <primitive object={mWood} attach="material" />
      </mesh>
    )

    // Üst uzun kenar rayları
    const topRails: ReactElement[] = []
    for (const sz of [-1, 1] as const) {
      topRails.push(
        <mesh
          key={`mtr-${sz}`}
          position={[0, railTop - 0.025, sz * (wid / 2 - 0.025)]}
          castShadow
        >
          <boxGeometry args={[len - 0.10, 0.05, 0.05]} />
          <primitive object={mFrame} attach="material" />
        </mesh>
      )
    }

    // Yassı dikey çıtalar (yalnız uzun kenarlar) — yuvarlak değil, sade
    const slats: ReactElement[] = []
    const slatCount = Math.max(6, Math.round(len / 0.11))
    for (let i = 0; i < slatCount; i++) {
      const t = (i + 0.5) / slatCount
      const bx = -len / 2 + 0.06 + t * (len - 0.12)
      for (const sz of [-1, 1] as const) {
        slats.push(
          <mesh
            key={`ms-${i}-${sz}`}
            position={[bx, slatBottom + slatH / 2, sz * (wid / 2 - 0.02)]}
            castShadow
          >
            <boxGeometry args={[0.04, slatH, 0.018]} />
            <primitive object={mFrame} attach="material" />
          </mesh>
        )
      }
    }

    return (
      <group>
        {panels}
        {baseSlab}
        {topRails}
        {slats}
        {/* Yatak */}
        <mesh position={[0, mattTop + 0.035, 0]} castShadow>
          <boxGeometry args={[len - 0.14, 0.07, wid - 0.10]} />
          <primitive object={mat} attach="material" />
        </mesh>
        {/* Düz, modern yorgan (ayak ucu) */}
        <mesh position={[len * 0.12, mattTop + 0.085, 0]} castShadow>
          <boxGeometry args={[len * 0.6, 0.02, wid - 0.14]} />
          <primitive object={mAccent} attach="material" />
        </mesh>
        {/* Tek yassı yastık (baş ucu) */}
        <mesh position={[-(len / 2 - 0.20), mattTop + 0.075, 0]} castShadow>
          <boxGeometry args={[0.14, 0.05, wid * 0.5]} />
          <primitive object={pillow} attach="material" />
        </mesh>
      </group>
    )
  }

  // ─────────────────────────────────────────────────────────────
  //  CLASSIC (varsayılan) — standart yuvarlak parmaklıklı beşik
  // ─────────────────────────────────────────────────────────────
  const legH = 0.10
  const baseY = legH
  const baseH = 0.08
  const railH = 0.70
  const sideBarCount = Math.max(8, Math.round(len / 0.08))
  const endBarCount  = Math.max(5, Math.round(wid / 0.08))

  // 4 ayak
  const legs: ReactElement[] = []
  const lx = len / 2 - 0.04
  const lz = wid / 2 - 0.04
  const legPos: [number, number][] = [[-lx,-lz],[lx,-lz],[-lx,lz],[lx,lz]]
  legPos.forEach(([px, pz], i) => {
    legs.push(
      <mesh key={`lg-${i}`} position={[px, legH / 2, pz]} castShadow>
        <boxGeometry args={[0.06, legH, 0.06]} />
        <primitive object={frame} attach="material" />
      </mesh>
    )
  })

  // Taban
  const base = (
    <mesh position={[0, baseY + baseH / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[len - 0.04, baseH, wid - 0.04]} />
      <primitive object={frame} attach="material" />
    </mesh>
  )

  // Üst çerçeveler (uzun ve kısa kenar)
  const topFrameY = baseY + baseH + railH
  const topRails: ReactElement[] = []
  topRails.push(
    <mesh key="tr-fb-1" position={[0, topFrameY, -wid / 2 + 0.02]} castShadow>
      <boxGeometry args={[len, 0.04, 0.04]} />
      <primitive object={rail} attach="material" />
    </mesh>
  )
  topRails.push(
    <mesh key="tr-fb-2" position={[0, topFrameY, wid / 2 - 0.02]} castShadow>
      <boxGeometry args={[len, 0.04, 0.04]} />
      <primitive object={rail} attach="material" />
    </mesh>
  )
  topRails.push(
    <mesh key="tr-lr-1" position={[-len / 2 + 0.02, topFrameY, 0]} castShadow>
      <boxGeometry args={[0.04, 0.04, wid]} />
      <primitive object={rail} attach="material" />
    </mesh>
  )
  topRails.push(
    <mesh key="tr-lr-2" position={[len / 2 - 0.02, topFrameY, 0]} castShadow>
      <boxGeometry args={[0.04, 0.04, wid]} />
      <primitive object={rail} attach="material" />
    </mesh>
  )

  // Parmaklıklar — 2 uzun kenar
  const bars: ReactElement[] = []
  for (let i = 0; i < sideBarCount; i++) {
    const t = (i + 0.5) / sideBarCount
    const bx = -len / 2 + 0.04 + t * (len - 0.08)
    for (const sz of [-1, 1] as const) {
      bars.push(
        <mesh
          key={`bar-s-${i}-${sz}`}
          position={[bx, baseY + baseH + railH / 2, sz * (wid / 2 - 0.02)]}
          castShadow
        >
          <cylinderGeometry args={[0.012, 0.012, railH, 8]} />
          <primitive object={rail} attach="material" />
        </mesh>
      )
    }
  }
  // 2 kısa kenar
  for (let i = 0; i < endBarCount; i++) {
    const t = (i + 0.5) / endBarCount
    const bz = -wid / 2 + 0.04 + t * (wid - 0.08)
    for (const sx of [-1, 1] as const) {
      bars.push(
        <mesh
          key={`bar-e-${i}-${sx}`}
          position={[sx * (len / 2 - 0.02), baseY + baseH + railH / 2, bz]}
          castShadow
        >
          <cylinderGeometry args={[0.012, 0.012, railH, 8]} />
          <primitive object={rail} attach="material" />
        </mesh>
      )
    }
  }

  // Yatak + örtü + yastık
  const mattY = baseY + baseH
  const mattress = (
    <mesh position={[0, mattY + 0.04, 0]} castShadow>
      <boxGeometry args={[len - 0.10, 0.08, wid - 0.10]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
  const blanket = (
    <mesh position={[0, mattY + 0.09, len * 0.12]} castShadow>
      <boxGeometry args={[len - 0.14, 0.02, wid * 0.55]} />
      <primitive object={blnkt} attach="material" />
    </mesh>
  )
  const pillowM = (
    <mesh position={[0, mattY + 0.11, -(wid / 2 - 0.16)]} castShadow>
      <boxGeometry args={[len * 0.3, 0.05, 0.14]} />
      <primitive object={pillow} attach="material" />
    </mesh>
  )

  return (
    <group>
      {legs}
      {base}
      {topRails}
      {bars}
      {mattress}
      {blanket}
      {pillowM}
    </group>
  )
}
