import * as THREE from 'three'
import type { ReactElement } from 'react'

const top      = new THREE.MeshLambertMaterial({ color: 0xb28a5c })
const topEdge  = new THREE.MeshLambertMaterial({ color: 0x8a6640 })
const legMat   = new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
const drawerM  = new THREE.MeshLambertMaterial({ color: 0x9a7450 })
const handleM  = new THREE.MeshLambertMaterial({ color: 0xcfcfcf })

/** Çalışma masası — tabla + 4 ayak + opsiyonel yan çekmece bloğu */
export default function Desk({ dims }: { dims: Record<string, number> }) {
  const len = (dims.length ?? 140) / 100
  const dep = (dims.depth ?? 70) / 100

  const topH = 0.04
  const tabletopY = 0.74
  const legH = tabletopY - topH
  const legT = 0.06

  // Tabla
  const tableTop = (
    <>
      <mesh position={[0, tabletopY - topH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[len, topH, dep]} />
        <primitive object={top} attach="material" />
      </mesh>
      {/* Kenar şeridi */}
      <mesh position={[0, tabletopY - topH - 0.005, 0]}>
        <boxGeometry args={[len - 0.01, 0.01, dep - 0.01]} />
        <primitive object={topEdge} attach="material" />
      </mesh>
    </>
  )

  // 4 ayak
  const legs: ReactElement[] = []
  const lx = len / 2 - legT / 2 - 0.03
  const lz = dep / 2 - legT / 2 - 0.03
  const legPositions: [number, number][] = [
    [-lx, -lz],
    [ lx, -lz],
    [-lx,  lz],
    [ lx,  lz],
  ]
  legPositions.forEach(([px, pz], i) => {
    legs.push(
      <mesh key={`leg-${i}`} position={[px, legH / 2, pz]} castShadow>
        <boxGeometry args={[legT, legH, legT]} />
        <primitive object={legMat} attach="material" />
      </mesh>
    )
  })

  // Sağ taraf çekmece bloğu (3 çekmece)
  const boxW = Math.min(0.38, len * 0.28)
  const boxD = dep - 0.08
  const boxH = legH - 0.02
  const boxX = len / 2 - boxW / 2 - 0.03
  const drawers: ReactElement[] = []
  for (let i = 0; i < 3; i++) {
    const dy = 0.04 + i * (boxH / 3) + (boxH / 3) / 2
    drawers.push(
      <mesh
        key={`dr-${i}`}
        position={[boxX + 0.005, dy, 0.01]}
        castShadow
      >
        <boxGeometry args={[0.01, (boxH / 3) - 0.02, boxD - 0.04]} />
        <primitive object={drawerM} attach="material" />
      </mesh>
    )
    // Kulp
    drawers.push(
      <mesh
        key={`hd-${i}`}
        position={[boxX + 0.012, dy, 0.01]}
        castShadow
      >
        <boxGeometry args={[0.008, 0.02, 0.08]} />
        <primitive object={handleM} attach="material" />
      </mesh>
    )
  }
  const drawerBox = (
    <mesh position={[boxX, 0.04 + boxH / 2, 0]} castShadow>
      <boxGeometry args={[boxW, boxH, boxD]} />
      <primitive object={drawerM} attach="material" />
    </mesh>
  )

  // Arka modesty panel
  const modesty = (
    <mesh position={[0, legH * 0.55, -dep / 2 + 0.04]} castShadow>
      <boxGeometry args={[len - 0.15, legH * 0.5, 0.015]} />
      <primitive object={top} attach="material" />
    </mesh>
  )

  return (
    <group>
      {tableTop}
      {legs}
      {drawerBox}
      {drawers}
      {modesty}
    </group>
  )
}
