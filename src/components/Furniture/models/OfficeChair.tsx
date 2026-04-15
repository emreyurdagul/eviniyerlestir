import * as THREE from 'three'
import type { ReactElement } from 'react'

const mesh     = new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
const meshLite = new THREE.MeshLambertMaterial({ color: 0x3a3a3a })
const metal    = new THREE.MeshLambertMaterial({ color: 0x9a9a9a })
const wheel    = new THREE.MeshLambertMaterial({ color: 0x1a1a1a })

/** Ofis sandalyesi — beşli tekerlek, piston, ergonomik sırt + kolluklar */
export default function OfficeChair() {
  const sitH = 0.50   // oturma yüksekliği
  const seatW = 0.50
  const seatD = 0.48
  const backH = 0.56

  // 5 tekerlek ayağı
  const wheels: ReactElement[] = []
  const arms: ReactElement[] = []
  for (let i = 0; i < 5; i++) {
    const ang = (i / 5) * Math.PI * 2
    const rx = Math.cos(ang) * 0.30
    const rz = Math.sin(ang) * 0.30

    // Ayak kolu
    arms.push(
      <mesh
        key={`arm-${i}`}
        position={[rx / 2, 0.07, rz / 2]}
        rotation={[0, -ang, 0]}
        castShadow
      >
        <boxGeometry args={[0.30, 0.04, 0.05]} />
        <primitive object={metal} attach="material" />
      </mesh>
    )
    // Tekerlek
    wheels.push(
      <mesh
        key={`w-${i}`}
        position={[rx, 0.035, rz]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <cylinderGeometry args={[0.035, 0.035, 0.04, 14]} />
        <primitive object={wheel} attach="material" />
      </mesh>
    )
  }

  // Merkez piston
  const piston = (
    <>
      <mesh position={[0, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.04, 0.14, 12]} />
        <primitive object={metal} attach="material" />
      </mesh>
      <mesh position={[0, 0.32, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.030, 0.18, 12]} />
        <primitive object={metal} attach="material" />
      </mesh>
    </>
  )

  // Oturma minderi
  const seat = (
    <mesh position={[0, sitH - 0.04, 0]} castShadow receiveShadow>
      <boxGeometry args={[seatW, 0.08, seatD]} />
      <primitive object={mesh} attach="material" />
    </mesh>
  )

  // Sırtlık — hafif eğik
  const back = (
    <group position={[0, sitH + backH / 2 - 0.02, -seatD / 2 + 0.04]} rotation={[-0.08, 0, 0]}>
      <mesh castShadow>
        <boxGeometry args={[seatW - 0.02, backH, 0.06]} />
        <primitive object={mesh} attach="material" />
      </mesh>
      {/* Bel desteği şeridi */}
      <mesh position={[0, -backH * 0.25, 0.035]} castShadow>
        <boxGeometry args={[seatW - 0.10, 0.08, 0.02]} />
        <primitive object={meshLite} attach="material" />
      </mesh>
    </group>
  )

  // Kolluklar
  const armrests: ReactElement[] = []
  for (const sx of [-1, 1] as const) {
    armrests.push(
      <mesh
        key={`armpost-${sx}`}
        position={[sx * (seatW / 2 + 0.02), sitH + 0.10, -0.05]}
        castShadow
      >
        <boxGeometry args={[0.03, 0.22, 0.04]} />
        <primitive object={metal} attach="material" />
      </mesh>
    )
    armrests.push(
      <mesh
        key={`armpad-${sx}`}
        position={[sx * (seatW / 2 + 0.02), sitH + 0.22, -0.02]}
        castShadow
      >
        <boxGeometry args={[0.06, 0.03, 0.22]} />
        <primitive object={mesh} attach="material" />
      </mesh>
    )
  }

  return (
    <group>
      {arms}
      {wheels}
      {piston}
      {seat}
      {back}
      {armrests}
    </group>
  )
}
