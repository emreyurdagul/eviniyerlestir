import * as THREE from 'three'
import type { ReactElement } from 'react'

const mesh      = new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
const meshLite  = new THREE.MeshLambertMaterial({ color: 0x3a3a3a })
const metal     = new THREE.MeshLambertMaterial({ color: 0x9a9a9a })
const wheel     = new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
const fabric    = new THREE.MeshLambertMaterial({ color: 0x55585c }) // basic — açık gri kumaş
const fabricDk  = new THREE.MeshLambertMaterial({ color: 0x44474a })
const leather   = new THREE.MeshLambertMaterial({ color: 0x3a2519 }) // executive — koyu deri
const leatherLt = new THREE.MeshLambertMaterial({ color: 0x4d3322 })
const chrome    = new THREE.MeshLambertMaterial({ color: 0xc6c8cc }) // executive — krom baz

/**
 * Ofis sandalyesi. Variant'a göre farklı geometri üretir:
 *  - ergonomic : ince file sırt + bel desteği + T kolluklar (varsayılan)
 *  - basic     : sade, kısa yastıklı sırt, kolluksuz
 *  - executive : geniş yüksek deri sırt + baş desteği + kalın kolluklar + krom baz
 */
export default function OfficeChair({
  dims,
  variant = 'ergonomic',
}: {
  dims: Record<string, number>
  variant?: string
}) {
  // office-chair dimDefs boş — registry sabit kutu (0.66×1.14×0.66) döndürür.
  // dims yine de okunur; anahtar olmadığından varsayılanlar uygulanır ve
  // önceki davranış birebir korunur.
  const sitH  = (dims.height ?? 50) / 100 // oturma yüksekliği (cm→m)
  const seatW = (dims.width  ?? 50) / 100
  const seatD = (dims.depth  ?? 48) / 100

  // ── Ortak 5'li tekerlek baz + merkez piston ──
  const baseMetal = variant === 'executive' ? chrome : metal
  const baseArms: ReactElement[] = []
  const baseWheels: ReactElement[] = []
  for (let i = 0; i < 5; i++) {
    const ang = (i / 5) * Math.PI * 2
    const rx = Math.cos(ang) * 0.30
    const rz = Math.sin(ang) * 0.30
    baseArms.push(
      <mesh key={`arm-${i}`} position={[rx / 2, 0.07, rz / 2]} rotation={[0, -ang, 0]} castShadow>
        <boxGeometry args={[0.30, 0.04, 0.05]} />
        <primitive object={baseMetal} attach="material" />
      </mesh>
    )
    baseWheels.push(
      <mesh key={`w-${i}`} position={[rx, 0.035, rz]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.04, 14]} />
        <primitive object={wheel} attach="material" />
      </mesh>
    )
  }
  const piston = (
    <>
      <mesh position={[0, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.04, 0.14, 12]} />
        <primitive object={baseMetal} attach="material" />
      </mesh>
      <mesh position={[0, 0.32, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.030, 0.18, 12]} />
        <primitive object={baseMetal} attach="material" />
      </mesh>
    </>
  )
  const base = (
    <>
      {baseArms}
      {baseWheels}
      {piston}
    </>
  )

  // ── BASIC — sade yastıklı, kısa sırt, kolluksuz ──
  if (variant === 'basic') {
    const backH = 0.40
    return (
      <group>
        {base}
        {/* Yastıklı oturma (kalın taban + üst minder) */}
        <mesh position={[0, sitH - 0.05, 0]} castShadow receiveShadow>
          <boxGeometry args={[seatW, 0.10, seatD]} />
          <primitive object={fabric} attach="material" />
        </mesh>
        <mesh position={[0, sitH + 0.01, 0]} castShadow>
          <boxGeometry args={[seatW - 0.06, 0.04, seatD - 0.06]} />
          <primitive object={fabricDk} attach="material" />
        </mesh>
        {/* Sade kısa sırt — dik, kolluksuz */}
        <group position={[0, sitH + backH / 2, -seatD / 2 + 0.05]} rotation={[-0.10, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[seatW - 0.04, backH, 0.07]} />
            <primitive object={fabric} attach="material" />
          </mesh>
          {/* Dikey orta dikiş */}
          <mesh position={[0, 0, 0.04]} castShadow>
            <boxGeometry args={[0.015, backH - 0.06, 0.015]} />
            <primitive object={fabricDk} attach="material" />
          </mesh>
        </group>
      </group>
    )
  }

  // ── EXECUTIVE — geniş yüksek deri sırt + baş desteği + kalın kolluklar ──
  if (variant === 'executive') {
    const backH = 0.58
    const backW = seatW + 0.06

    // Yatay dikiş/segman şeritleri (tafted görünüm)
    const tufts: ReactElement[] = []
    for (let i = 0; i < 3; i++) {
      const ly = -0.16 + i * 0.16
      tufts.push(
        <mesh key={`tuft-${i}`} position={[0, ly, 0.052]} castShadow>
          <boxGeometry args={[backW - 0.08, 0.025, 0.02]} />
          <primitive object={leatherLt} attach="material" />
        </mesh>
      )
    }

    // Kalın yastıklı kolluklar
    const arms: ReactElement[] = []
    for (const sx of [-1, 1] as const) {
      arms.push(
        <mesh key={`apost-${sx}`} position={[sx * 0.28, sitH + 0.06, 0]} castShadow>
          <boxGeometry args={[0.04, 0.22, 0.05]} />
          <primitive object={chrome} attach="material" />
        </mesh>
      )
      arms.push(
        <mesh key={`apad-${sx}`} position={[sx * 0.28, sitH + 0.19, 0.02]} castShadow>
          <boxGeometry args={[0.08, 0.06, 0.28]} />
          <primitive object={leather} attach="material" />
        </mesh>
      )
    }

    return (
      <group>
        {base}
        {/* Kalın deri oturma */}
        <mesh position={[0, sitH - 0.04, 0]} castShadow receiveShadow>
          <boxGeometry args={[seatW + 0.02, 0.12, seatD]} />
          <primitive object={leather} attach="material" />
        </mesh>
        <mesh position={[0, sitH + 0.03, 0]} castShadow>
          <boxGeometry args={[seatW - 0.04, 0.05, seatD - 0.06]} />
          <primitive object={leatherLt} attach="material" />
        </mesh>
        {/* Geniş yüksek sırt + baş desteği */}
        <group position={[0, sitH + backH / 2 - 0.02, -seatD / 2 + 0.05]} rotation={[-0.12, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[backW, backH, 0.10]} />
            <primitive object={leather} attach="material" />
          </mesh>
          {tufts}
          {/* Baş desteği yastığı */}
          <mesh position={[0, backH / 2 - 0.02, 0.03]} castShadow>
            <boxGeometry args={[backW - 0.10, 0.14, 0.10]} />
            <primitive object={leatherLt} attach="material" />
          </mesh>
        </group>
        {arms}
      </group>
    )
  }

  // ── ERGONOMIC (varsayılan) — file sırt + bel desteği + T kolluklar ──
  const backH = 0.56
  const armrests: ReactElement[] = []
  for (const sx of [-1, 1] as const) {
    armrests.push(
      <mesh key={`armpost-${sx}`} position={[sx * (seatW / 2 + 0.02), sitH + 0.10, -0.05]} castShadow>
        <boxGeometry args={[0.03, 0.22, 0.04]} />
        <primitive object={metal} attach="material" />
      </mesh>
    )
    armrests.push(
      <mesh key={`armpad-${sx}`} position={[sx * (seatW / 2 + 0.02), sitH + 0.22, -0.02]} castShadow>
        <boxGeometry args={[0.06, 0.03, 0.22]} />
        <primitive object={mesh} attach="material" />
      </mesh>
    )
  }

  return (
    <group>
      {base}
      {/* Oturma minderi */}
      <mesh position={[0, sitH - 0.04, 0]} castShadow receiveShadow>
        <boxGeometry args={[seatW, 0.08, seatD]} />
        <primitive object={mesh} attach="material" />
      </mesh>
      {/* File sırtlık — hafif eğik + bel desteği şeridi */}
      <group position={[0, sitH + backH / 2 - 0.02, -seatD / 2 + 0.04]} rotation={[-0.08, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[seatW - 0.02, backH, 0.06]} />
          <primitive object={mesh} attach="material" />
        </mesh>
        <mesh position={[0, -backH * 0.25, 0.035]} castShadow>
          <boxGeometry args={[seatW - 0.10, 0.08, 0.02]} />
          <primitive object={meshLite} attach="material" />
        </mesh>
      </group>
      {armrests}
    </group>
  )
}
