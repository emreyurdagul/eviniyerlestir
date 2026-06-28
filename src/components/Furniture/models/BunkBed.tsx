import * as THREE from 'three'
import type { ReactElement } from 'react'

const frame   = new THREE.MeshLambertMaterial({ color: 0x7a5a40 })
const frameLt = new THREE.MeshLambertMaterial({ color: 0xa07a58 })
const mattM   = new THREE.MeshLambertMaterial({ color: 0xf4ece0 })
const duvet1  = new THREE.MeshLambertMaterial({ color: 0x5090c0 })
const duvet2  = new THREE.MeshLambertMaterial({ color: 0xd06080 })
const pillowM = new THREE.MeshLambertMaterial({ color: 0xffffff })
const drawerM = new THREE.MeshLambertMaterial({ color: 0xb98c64 })
const handleM = new THREE.MeshLambertMaterial({ color: 0x9aa0a6 })
const deskTop = new THREE.MeshLambertMaterial({ color: 0xe8dcc8 })
const screenM = new THREE.MeshLambertMaterial({ color: 0x202428 })

/**
 * Ranza — iki katlı yatak, merdiven, üst korkuluk.
 * Variant:
 *  - classic : klasik iki katlı ranza (alt + üst yatak)
 *  - drawer  : alt yatağın altında çekmeceli depolama
 *  - desk     : alt kat yatak yerine çalışma masası (yüksek ranza)
 */
export default function BunkBed({
  dims,
  variant = 'classic',
}: {
  dims: Record<string, number>
  variant?: string
}) {
  const len = (dims.length ?? 200) / 100
  const wid = (dims.width ?? 90) / 100

  const lowerY = 0.28   // alt yatak taban yüksekliği
  const upperY = 1.12   // üst yatak taban yüksekliği
  const mattH  = 0.14
  const postH  = 1.70
  const postT  = 0.08

  // 'desk' variantında alt kat yatak yok — yerine masa gelir
  const hasLowerBed = variant !== 'desk'

  // 4 dikme (her variantta)
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

  // Yatak platformları (alt varsa alt+üst, yoksa sadece üst)
  const platforms: ReactElement[] = []
  const platformYs = hasLowerBed ? [lowerY, upperY] : [upperY]
  platformYs.forEach((py, i) => {
    platforms.push(
      <mesh key={`pl-${i}`} position={[0, py, 0]} castShadow>
        <boxGeometry args={[len - 0.04, 0.06, wid - 0.04]} />
        <primitive object={frameLt} attach="material" />
      </mesh>
    )
  })

  // Yan panelleri (baş ve ayak ucu) — alt panel sadece alt yatak varsa
  const endPanels: ReactElement[] = []
  for (const sx of [-1, 1] as const) {
    if (hasLowerBed) {
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
    }
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

  // Yatak + yorgan + yastık (alt varsa 2, yoksa sadece üst)
  const beds: ReactElement[] = []
  const bedDefs: { y: number; duv: THREE.MeshLambertMaterial }[] = hasLowerBed
    ? [{ y: lowerY + 0.03, duv: duvet1 }, { y: upperY + 0.03, duv: duvet2 }]
    : [{ y: upperY + 0.03, duv: duvet2 }]
  bedDefs.forEach((b, i) => {
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

  // Variant'a özel ek parçalar (çekmece / masa)
  const extras: ReactElement[] = []

  if (variant === 'drawer') {
    // Alt yatağın altına sıra çekmece (uzun ön yüz, +z)
    const drawerCount = 3
    const gap = 0.03
    const totalW = len - 0.16
    const dW = (totalW - gap * (drawerCount - 1)) / drawerCount
    const dH = 0.20
    const dY = 0.14
    const frontZ = wid / 2 - 0.04
    for (let i = 0; i < drawerCount; i++) {
      const cx = -totalW / 2 + dW / 2 + i * (dW + gap)
      extras.push(
        <mesh key={`dr-${i}`} position={[cx, dY, frontZ]} castShadow>
          <boxGeometry args={[dW, dH, 0.16]} />
          <primitive object={drawerM} attach="material" />
        </mesh>
      )
      // Çekmece kulpu
      extras.push(
        <mesh key={`dh-${i}`} position={[cx, dY + 0.04, frontZ + 0.085]} castShadow>
          <boxGeometry args={[dW * 0.4, 0.02, 0.02]} />
          <primitive object={handleM} attach="material" />
        </mesh>
      )
    }
    // Alt süpürgelik / kaide
    extras.push(
      <mesh key="dr-base" position={[0, 0.02, frontZ - 0.05]} castShadow>
        <boxGeometry args={[len - 0.10, 0.04, 0.10]} />
        <primitive object={frame} attach="material" />
      </mesh>
    )
  }

  if (variant === 'desk') {
    // Alt kat çalışma masası (yüksek ranza)
    const deskY = 0.74
    const deskD = wid * 0.62
    const deskZ = -wid / 2 + deskD / 2 + 0.06   // arkaya yaslı, önde diz boşluğu

    // Tezgah / masa üstü
    extras.push(
      <mesh key="desk-top" position={[0, deskY, deskZ]} castShadow>
        <boxGeometry args={[len - 0.14, 0.04, deskD]} />
        <primitive object={deskTop} attach="material" />
      </mesh>
    )

    // Sol çekmeceli kabin (pedestal)
    const pedW = (len - 0.14) * 0.26
    const pedX = -(len / 2) + pedW / 2 + 0.08
    extras.push(
      <mesh key="desk-ped" position={[pedX, deskY / 2, deskZ]} castShadow>
        <boxGeometry args={[pedW, deskY - 0.04, deskD * 0.9]} />
        <primitive object={frameLt} attach="material" />
      </mesh>
    )
    for (let i = 0; i < 2; i++) {
      extras.push(
        <mesh
          key={`desk-h-${i}`}
          position={[pedX, 0.28 + i * 0.22, deskZ + deskD * 0.45 + 0.02]}
          castShadow
        >
          <boxGeometry args={[pedW * 0.5, 0.02, 0.02]} />
          <primitive object={handleM} attach="material" />
        </mesh>
      )
    }

    // Sağ destek bacağı
    const legX = len / 2 - 0.10
    extras.push(
      <mesh key="desk-leg" position={[legX, deskY / 2, deskZ]} castShadow>
        <boxGeometry args={[0.06, deskY - 0.04, deskD * 0.9]} />
        <primitive object={frame} attach="material" />
      </mesh>
    )

    // Masa üstünde monitör (ekran + ayak + taban)
    const monX = len * 0.12
    const monZ = deskZ - deskD * 0.2
    extras.push(
      <mesh key="mon-screen" position={[monX, deskY + 0.20, monZ]} castShadow>
        <boxGeometry args={[0.34, 0.22, 0.02]} />
        <primitive object={screenM} attach="material" />
      </mesh>
    )
    extras.push(
      <mesh key="mon-stand" position={[monX, deskY + 0.06, monZ]} castShadow>
        <boxGeometry args={[0.04, 0.10, 0.04]} />
        <primitive object={handleM} attach="material" />
      </mesh>
    )
    extras.push(
      <mesh key="mon-base" position={[monX, deskY + 0.02, monZ]} castShadow>
        <boxGeometry args={[0.16, 0.02, 0.10]} />
        <primitive object={handleM} attach="material" />
      </mesh>
    )

    // Üst yatağın altına asılı küçük raf
    extras.push(
      <mesh key="desk-shelf" position={[0, upperY - 0.28, -wid / 2 + 0.08]} castShadow>
        <boxGeometry args={[len - 0.20, 0.03, 0.16]} />
        <primitive object={frameLt} attach="material" />
      </mesh>
    )
  }

  return (
    <group>
      {posts}
      {platforms}
      {endPanels}
      {guard}
      {ladder}
      {beds}
      {extras}
    </group>
  )
}
