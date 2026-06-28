import * as THREE from 'three'
import type { ReactElement } from 'react'

const top      = new THREE.MeshLambertMaterial({ color: 0xb28a5c })
const topEdge  = new THREE.MeshLambertMaterial({ color: 0x8a6640 })
const legMat   = new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
const drawerM  = new THREE.MeshLambertMaterial({ color: 0x9a7450 })
const handleM  = new THREE.MeshLambertMaterial({ color: 0xcfcfcf })
const carcass  = new THREE.MeshLambertMaterial({ color: 0x6b5236 })

/**
 * Çalışma masası — varyanta göre farklı geometri:
 *  - classic : düz tabla + 4 ayak + tek yan çekmece bloğu (varsayılan)
 *  - lshape  : köşe L çalışma alanı (ön bar + sol dönüş kanadı)
 *  - drawer  : çift ayaklı (double pedestal) çoklu çekmece bloğu
 */
export default function Desk({ dims, variant = 'classic' }: { dims: Record<string, number>; variant?: string }) {
  const len = (dims.length ?? 140) / 100
  const dep = (dims.depth ?? 70) / 100

  const topH = 0.04
  const tabletopY = 0.74
  const legH = tabletopY - topH
  const legT = 0.06

  // Ortak ayak üreteci (lshape + drawer dışı varyantlar kendi döngüsünü kullanır)
  const makeLeg = (key: string, px: number, pz: number): ReactElement => (
    <mesh key={key} position={[px, legH / 2, pz]} castShadow>
      <boxGeometry args={[legT, legH, legT]} />
      <primitive object={legMat} attach="material" />
    </mesh>
  )

  // ──────────────────────────────────────────────────────────────
  //  L Şekli — köşe çalışma alanı (ön bar + sol dönüş kanadı)
  // ──────────────────────────────────────────────────────────────
  if (variant === 'lshape') {
    const inset = legT / 2 + 0.02
    const returnW = Math.min(len * 0.42, len - 0.2)   // sol kanat genişliği
    const frontD = Math.min(dep * 0.5, dep - 0.15)    // ön barın derinliği

    const lTop = (
      <>
        {/* Ön bar — tüm uzunluk boyunca, ön kenara hizalı */}
        <mesh position={[0, tabletopY - topH / 2, dep / 2 - frontD / 2]} castShadow receiveShadow>
          <boxGeometry args={[len, topH, frontD]} />
          <primitive object={top} attach="material" />
        </mesh>
        {/* Sol dönüş kanadı — tüm derinlik boyunca */}
        <mesh position={[-len / 2 + returnW / 2, tabletopY - topH / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[returnW, topH, dep]} />
          <primitive object={top} attach="material" />
        </mesh>
        {/* Kenar şeritleri */}
        <mesh position={[0, tabletopY - topH - 0.005, dep / 2 - frontD / 2]}>
          <boxGeometry args={[len - 0.01, 0.01, frontD - 0.01]} />
          <primitive object={topEdge} attach="material" />
        </mesh>
        <mesh position={[-len / 2 + returnW / 2, tabletopY - topH - 0.005, 0]}>
          <boxGeometry args={[returnW - 0.01, 0.01, dep - 0.01]} />
          <primitive object={topEdge} attach="material" />
        </mesh>
      </>
    )

    // L köşelerine 5 ayak
    const lLegs: ReactElement[] = [
      makeLeg('l0', -len / 2 + inset, dep / 2 - inset),               // ön-sol
      makeLeg('l1',  len / 2 - inset, dep / 2 - inset),               // ön-sağ
      makeLeg('l2',  len / 2 - inset, dep / 2 - frontD + inset),      // ön barın arka-sağı
      makeLeg('l3', -len / 2 + returnW - inset, -dep / 2 + inset),    // kanadın arkası
      makeLeg('l4', -len / 2 + inset, -dep / 2 + inset),              // arka-sol
    ]

    // Ön bar arkasında modesty panel
    const lModesty = (
      <mesh position={[0, legH * 0.55, dep / 2 - frontD + 0.02]} castShadow>
        <boxGeometry args={[len - 0.15, legH * 0.5, 0.015]} />
        <primitive object={top} attach="material" />
      </mesh>
    )

    return (
      <group>
        {lTop}
        {lLegs}
        {lModesty}
      </group>
    )
  }

  // ──────────────────────────────────────────────────────────────
  //  Çekmeceli — çift ayaklı (double pedestal) blok
  // ──────────────────────────────────────────────────────────────
  if (variant === 'drawer') {
    const pedW = Math.min(0.4, len * 0.28)
    const pedD = dep - 0.06
    const pedH = legH
    const pedInset = 0.03

    const fullTop = (
      <>
        <mesh position={[0, tabletopY - topH / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[len, topH, dep]} />
          <primitive object={top} attach="material" />
        </mesh>
        <mesh position={[0, tabletopY - topH - 0.005, 0]}>
          <boxGeometry args={[len - 0.01, 0.01, dep - 0.01]} />
          <primitive object={topEdge} attach="material" />
        </mesh>
      </>
    )

    // Tek bir çekmece bloğu (3 çekmece) üreten yardımcı
    const pedestal = (side: 1 | -1, keyBase: string): ReactElement[] => {
      const cx = side * (len / 2 - pedW / 2 - pedInset)
      const out: ReactElement[] = []
      // Gövde
      out.push(
        <mesh key={`${keyBase}-body`} position={[cx, pedH / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[pedW, pedH, pedD]} />
          <primitive object={carcass} attach="material" />
        </mesh>
      )
      const n = 3
      const dh = (pedH - 0.06) / n
      for (let i = 0; i < n; i++) {
        const dy = 0.03 + i * dh + dh / 2
        // Çekmece yüzü
        out.push(
          <mesh key={`${keyBase}-f${i}`} position={[cx, dy, pedD / 2 + 0.006]} castShadow>
            <boxGeometry args={[pedW - 0.04, dh - 0.015, 0.012]} />
            <primitive object={drawerM} attach="material" />
          </mesh>
        )
        // Kulp
        out.push(
          <mesh key={`${keyBase}-h${i}`} position={[cx, dy, pedD / 2 + 0.018]} castShadow>
            <boxGeometry args={[pedW * 0.4, 0.02, 0.012]} />
            <primitive object={handleM} attach="material" />
          </mesh>
        )
      }
      return out
    }

    // Orta kalem çekmecesi (kneehole üstü)
    const centerW = len - 2 * (pedW + pedInset) - 0.06
    const centerDrawer: ReactElement | null = centerW > 0.12 ? (
      <>
        <mesh position={[0, tabletopY - topH - 0.06, dep / 2 - 0.02]} castShadow>
          <boxGeometry args={[centerW, 0.08, 0.02]} />
          <primitive object={drawerM} attach="material" />
        </mesh>
        <mesh position={[0, tabletopY - topH - 0.06, dep / 2 - 0.006]} castShadow>
          <boxGeometry args={[centerW * 0.5, 0.018, 0.012]} />
          <primitive object={handleM} attach="material" />
        </mesh>
      </>
    ) : null

    return (
      <group>
        {fullTop}
        {pedestal(-1, 'pl')}
        {pedestal(1, 'pr')}
        {centerDrawer}
      </group>
    )
  }

  // ──────────────────────────────────────────────────────────────
  //  Classic (varsayılan) — düz tabla + 4 ayak + yan çekmece bloğu
  // ──────────────────────────────────────────────────────────────

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
        position={[boxX, dy, boxD / 2 + 0.006]}
        castShadow
      >
        <boxGeometry args={[boxW - 0.04, (boxH / 3) - 0.02, 0.012]} />
        <primitive object={drawerM} attach="material" />
      </mesh>
    )
    // Kulp
    drawers.push(
      <mesh
        key={`hd-${i}`}
        position={[boxX, dy, boxD / 2 + 0.018]}
        castShadow
      >
        <boxGeometry args={[boxW * 0.4, 0.02, 0.012]} />
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
