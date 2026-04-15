import * as THREE from 'three'
import type { ReactElement } from 'react'

const body   = new THREE.MeshLambertMaterial({ color: 0xf0ead8 })
const wall   = new THREE.MeshLambertMaterial({ color: 0xe0d4b8 })
const pad    = new THREE.MeshLambertMaterial({ color: 0xf4c0cc })
const draw   = new THREE.MeshLambertMaterial({ color: 0xd8c8a8 })
const knob   = new THREE.MeshLambertMaterial({ color: 0x8a6a4a })
const basket = new THREE.MeshLambertMaterial({ color: 0xc0a878 })

/** Bebek bakım masası — yüksek, kenarları yüksek; alt raflı/çekmeceli */
export default function ChangingTable({ dims }: { dims: Record<string, number> }) {
  const w = (dims.width ?? 90) / 100
  const d = (dims.depth ?? 55) / 100
  const h = 0.95   // toplam yükseklik

  const sideT = 0.025
  const baseH = 0.05

  // Gövde — arka, iki yan, alt raflar
  const sides: ReactElement[] = []
  for (const sx of [-1, 1] as const) {
    sides.push(
      <mesh
        key={`sd-${sx}`}
        position={[sx * (w / 2 - sideT / 2), h / 2, 0]}
        castShadow
      >
        <boxGeometry args={[sideT, h, d]} />
        <primitive object={body} attach="material" />
      </mesh>
    )
  }

  // Arka panel
  const back = (
    <mesh position={[0, h / 2, -d / 2 + 0.005]}>
      <boxGeometry args={[w, h, 0.01]} />
      <primitive object={body} attach="material" />
    </mesh>
  )

  // 2 alt raf
  const shelfYs = [0.05, 0.32, 0.60]
  const shelves: ReactElement[] = []
  shelfYs.forEach((y, i) => {
    shelves.push(
      <mesh key={`sh-${i}`} position={[0, y, 0]} castShadow>
        <boxGeometry args={[w - 0.05, 0.025, d - 0.02]} />
        <primitive object={body} attach="material" />
      </mesh>
    )
  })

  // Üst tezgah
  const topBoard = (
    <mesh position={[0, h - 0.01, 0]} castShadow receiveShadow>
      <boxGeometry args={[w, 0.02, d]} />
      <primitive object={body} attach="material" />
    </mesh>
  )

  // Yüksek kenarlar (3 taraf — arka + 2 yan)
  const rails: ReactElement[] = []
  const railH = 0.10
  rails.push(
    <mesh
      key="rl-back"
      position={[0, h + railH / 2, -d / 2 + 0.02]}
      castShadow
    >
      <boxGeometry args={[w, railH, 0.04]} />
      <primitive object={wall} attach="material" />
    </mesh>
  )
  for (const sx of [-1, 1] as const) {
    rails.push(
      <mesh
        key={`rl-${sx}`}
        position={[sx * (w / 2 - 0.02), h + railH / 2, 0.02]}
        castShadow
      >
        <boxGeometry args={[0.04, railH, d - 0.04]} />
        <primitive object={wall} attach="material" />
      </mesh>
    )
  }

  // Pembe altlık (bakım pedi)
  const padMesh = (
    <mesh position={[0, h + 0.05, 0.02]} castShadow>
      <boxGeometry args={[w - 0.10, 0.08, d - 0.12]} />
      <primitive object={pad} attach="material" />
    </mesh>
  )

  // Alt çekmece (orta kısım)
  const drawerY = 0.46
  const drawerH = 0.22
  const drawer = (
    <>
      <mesh position={[0, drawerY, d / 2 - 0.005]} castShadow>
        <boxGeometry args={[w - 0.08, drawerH, 0.012]} />
        <primitive object={draw} attach="material" />
      </mesh>
      <mesh
        position={[0, drawerY, d / 2 + 0.01]}
        castShadow
      >
        <sphereGeometry args={[0.02, 10, 10]} />
        <primitive object={knob} attach="material" />
      </mesh>
    </>
  )

  // Alt rafta sepet
  const basketM = (
    <mesh position={[0, baseH + 0.08, 0]} castShadow>
      <boxGeometry args={[w * 0.5, 0.14, d * 0.65]} />
      <primitive object={basket} attach="material" />
    </mesh>
  )

  return (
    <group>
      {sides}
      {back}
      {shelves}
      {topBoard}
      {rails}
      {padMesh}
      {drawer}
      {basketM}
    </group>
  )
}
