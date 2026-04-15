import * as THREE from 'three'
import type { ReactElement } from 'react'

const frame   = new THREE.MeshLambertMaterial({ color: 0x7a5a40 })
const frameLt = new THREE.MeshLambertMaterial({ color: 0xa07a58 })
const mattM   = new THREE.MeshLambertMaterial({ color: 0xf4ece0 })
const duvet1  = new THREE.MeshLambertMaterial({ color: 0x5090c0 })
const duvet2  = new THREE.MeshLambertMaterial({ color: 0xd06080 })
const pillowM = new THREE.MeshLambertMaterial({ color: 0xffffff })

/** Ranza — iki katlı yatak, merdiven, üst korkuluk */
export default function BunkBed({ dims }: { dims: Record<string, number> }) {
  const len = (dims.length ?? 200) / 100
  const wid = (dims.width ?? 90) / 100

  const lowerY = 0.28   // alt yatak taban yüksekliği
  const upperY = 1.12   // üst yatak taban yüksekliği
  const mattH  = 0.14
  const postH  = 1.70
  const postT  = 0.08

  // 4 dikme
  const posts: ReactElement[] = []
  const px = len / 2 - postT / 2
  const pz = wid / 2 - postT / 2
  const postPos: [number, number][] = [[-px,-pz],[px,-pz],[-px,pz],[px,pz]]
  postPos.forEach(([x, z], i) => {
    posts.push(
      <mesh key={`p-${i}`} position={[x, postH / 2, z]} castShadow>
        <boxGeometry args={[postT, postH, postT]} />
        <primitive object={frame} attach="material" />
      </mesh>
    )
  })

  // Yatak platformları (alt ve üst)
  const platforms: ReactElement[] = []
  ;[lowerY, upperY].forEach((py, i) => {
    platforms.push(
      <mesh key={`pl-${i}`} position={[0, py, 0]} castShadow>
        <boxGeometry args={[len - 0.04, 0.06, wid - 0.04]} />
        <primitive object={frameLt} attach="material" />
      </mesh>
    )
  })

  // Yan panelleri (baş ve ayak ucu)
  const endPanels: ReactElement[] = []
  for (const sx of [-1, 1] as const) {
    endPanels.push(
      <mesh
        key={`ep-lower-${sx}`}
        position={[sx * (len / 2 - 0.02), lowerY + 0.15, 0]}
        castShadow
      >
        <boxGeometry args={[0.04, 0.30, wid - 0.04]} />
        <primitive object={frame} attach="material" />
      </mesh>
    )
    endPanels.push(
      <mesh
        key={`ep-upper-${sx}`}
        position={[sx * (len / 2 - 0.02), upperY + 0.20, 0]}
        castShadow
      >
        <boxGeometry args={[0.04, 0.38, wid - 0.04]} />
        <primitive object={frame} attach="material" />
      </mesh>
    )
  }

  // Üst korkuluk — uzun kenar (tek taraf açık, merdiven için)
  const guardY = upperY + 0.20
  const guard = (
    <>
      <mesh position={[0, guardY, -wid / 2 + 0.03]} castShadow>
        <boxGeometry args={[len - 0.04, 0.04, 0.04]} />
        <primitive object={frame} attach="material" />
      </mesh>
      {/* Dikey korkuluk çubukları */}
      {[-0.30, -0.10, 0.10, 0.30].map((bx, i) => (
        <mesh
          key={`gb-${i}`}
          position={[bx * (len / 0.8), upperY + 0.12, -wid / 2 + 0.03]}
          castShadow
        >
          <boxGeometry args={[0.025, 0.22, 0.025]} />
          <primitive object={frame} attach="material" />
        </mesh>
      ))}
    </>
  )

  // Merdiven — sağ uçta (+x)
  const ladder: ReactElement[] = []
  const lxPos = len / 2 - 0.05
  const stepCount = 4
  for (let i = 0; i < stepCount; i++) {
    const sy = 0.20 + i * ((upperY - 0.10) / stepCount)
    ladder.push(
      <mesh
        key={`step-${i}`}
        position={[lxPos, sy, wid / 2 + 0.08]}
        castShadow
      >
        <boxGeometry args={[0.14, 0.03, 0.20]} />
        <primitive object={frameLt} attach="material" />
      </mesh>
    )
  }
  // Merdiven yan rayları
  for (const dz of [-0.08, 0.08] as const) {
    ladder.push(
      <mesh
        key={`rail-${dz}`}
        position={[lxPos, upperY / 2 + 0.10, wid / 2 + 0.08 + dz]}
        castShadow
      >
        <boxGeometry args={[0.04, upperY + 0.10, 0.04]} />
        <primitive object={frame} attach="material" />
      </mesh>
    )
  }

  // Yatak + yorgan + yastık (alt ve üst)
  const beds: ReactElement[] = []
  ;[{ y: lowerY + 0.03, duv: duvet1 }, { y: upperY + 0.03, duv: duvet2 }].forEach((b, i) => {
    beds.push(
      <mesh key={`m-${i}`} position={[0, b.y + mattH / 2, 0]} castShadow>
        <boxGeometry args={[len - 0.12, mattH, wid - 0.10]} />
        <primitive object={mattM} attach="material" />
      </mesh>
    )
    beds.push(
      <mesh
        key={`dv-${i}`}
        position={[0, b.y + mattH + 0.02, len * 0.10]}
        castShadow
      >
        <boxGeometry args={[len - 0.14, 0.04, wid * 0.55]} />
        <primitive object={b.duv} attach="material" />
      </mesh>
    )
    beds.push(
      <mesh
        key={`pl-${i}`}
        position={[0, b.y + mattH + 0.05, -(len / 2 - 0.22)]}
        castShadow
      >
        <boxGeometry args={[wid * 0.55, 0.07, 0.22]} />
        <primitive object={pillowM} attach="material" />
      </mesh>
    )
  })

  return (
    <group>
      {posts}
      {platforms}
      {endPanels}
      {guard}
      {ladder}
      {beds}
    </group>
  )
}
