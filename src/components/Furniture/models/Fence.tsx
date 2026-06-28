import * as THREE from 'three'
import type { ReactElement } from 'react'

// — Ahşap çit (varsayılan) —
const wood     = new THREE.MeshLambertMaterial({ color: 0xc9a474 })
const woodDk   = new THREE.MeshLambertMaterial({ color: 0x8a6840 })
const post     = new THREE.MeshLambertMaterial({ color: 0x6a4a28 })
// — Metal / ferforje çit —
const iron     = new THREE.MeshLambertMaterial({ color: 0x26262b })
const ironLt   = new THREE.MeshLambertMaterial({ color: 0x46464d })
// — Gizlilik (yüksek, dolu panel) çit —
const panel    = new THREE.MeshLambertMaterial({ color: 0xbf9a6a })
const panelDk  = new THREE.MeshLambertMaterial({ color: 0x7a5630 })

/**
 * Çit — varyanta göre belirgin biçimde farklı geometri:
 *  - wood    → tahta dikey çubuklar (aralıklı), iki yatay kiriş + uç sütunlar
 *  - metal   → ferforje: yuvarlak dikey demir çubuklar + mızrak uçları, küre başlıklı sütunlar
 *  - privacy → dolu/sık dikey paneller + arka kapatma + boydan boya kapak kirişi
 */
export default function Fence({
  dims,
  variant = 'wood',
}: { dims: Record<string, number>; variant?: string }) {
  const length = (dims.length ?? 200) / 100
  const height = (dims.height ?? 120) / 100
  const depth  = 0.06

  // ── Metal — ferforje: yuvarlak çubuklar + mızrak uçlar ──
  if (variant === 'metal') {
    const barR     = 0.012
    const railH    = 0.05
    const innerLen = length - 0.16
    const barPitch = 0.11
    const barCount = Math.max(4, Math.floor(innerLen / barPitch))
    const barStep  = innerLen / barCount
    const barLen   = height - 0.06
    const barY     = 0.04 + barLen / 2

    const bars: ReactElement[] = []
    for (let i = 0; i <= barCount; i++) {
      const x = -innerLen / 2 + barStep * i
      bars.push(
        <mesh key={`mb-${i}`} position={[x, barY, 0]} castShadow>
          <cylinderGeometry args={[barR, barR, barLen, 8]} />
          <primitive object={iron} attach="material" />
        </mesh>,
      )
      // mızrak ucu (spear finial) — koni, üst yarıçapı 0 silindir
      bars.push(
        <mesh key={`mf-${i}`} position={[x, 0.04 + barLen + 0.05, 0]} castShadow>
          <cylinderGeometry args={[0, 0.022, 0.10, 8]} />
          <primitive object={iron} attach="material" />
        </mesh>,
      )
    }

    return (
      <group>
        {/* Uç metal sütunlar */}
        <mesh position={[-length / 2 + 0.04, height / 2, 0]} castShadow>
          <boxGeometry args={[0.07, height, 0.07]} />
          <primitive object={iron} attach="material" />
        </mesh>
        <mesh position={[length / 2 - 0.04, height / 2, 0]} castShadow>
          <boxGeometry args={[0.07, height, 0.07]} />
          <primitive object={iron} attach="material" />
        </mesh>
        {/* Sütun küre başlıkları */}
        <mesh position={[-length / 2 + 0.04, height + 0.05, 0]} castShadow>
          <sphereGeometry args={[0.05, 12, 10]} />
          <primitive object={ironLt} attach="material" />
        </mesh>
        <mesh position={[length / 2 - 0.04, height + 0.05, 0]} castShadow>
          <sphereGeometry args={[0.05, 12, 10]} />
          <primitive object={ironLt} attach="material" />
        </mesh>

        {/* Üst yatay ray */}
        <mesh position={[0, height - 0.06, 0]} castShadow>
          <boxGeometry args={[length - 0.08, railH, 0.03]} />
          <primitive object={ironLt} attach="material" />
        </mesh>
        {/* Alt yatay ray */}
        <mesh position={[0, 0.14, 0]} castShadow>
          <boxGeometry args={[length - 0.08, railH, 0.03]} />
          <primitive object={ironLt} attach="material" />
        </mesh>

        {/* Yuvarlak dikey demir çubuklar + uçlar */}
        {bars}
      </group>
    )
  }

  // ── Gizlilik — sık, dolu dikey paneller (yüksek/kapalı) ──
  if (variant === 'privacy') {
    const postW     = 0.12
    const innerLen  = length - postW * 2
    const boardCount = Math.max(4, Math.round(innerLen / 0.14))
    const boardStep = innerLen / boardCount
    const boardH    = height - 0.10
    const boardY    = 0.05 + boardH / 2

    const boards: ReactElement[] = []
    for (let i = 0; i < boardCount; i++) {
      const x = -innerLen / 2 + boardStep * (i + 0.5)
      // bitişik, hafif binişen tahtalar — boşluk yok (gizlilik)
      boards.push(
        <mesh
          key={`pb-${i}`}
          position={[x, boardY, i % 2 === 0 ? 0.007 : -0.007]}
          castShadow
        >
          <boxGeometry args={[boardStep + 0.006, boardH, 0.025]} />
          <primitive object={i % 2 === 0 ? panel : panelDk} attach="material" />
        </mesh>,
      )
    }

    return (
      <group>
        {/* Dolu arka panel — içeriyi tamamen gizler */}
        <mesh position={[0, height / 2, -0.025]} castShadow receiveShadow>
          <boxGeometry args={[length - postW, height - 0.04, 0.02]} />
          <primitive object={panelDk} attach="material" />
        </mesh>

        {/* Uç sütunlar (kalın) */}
        <mesh position={[-length / 2 + postW / 2, height / 2, 0]} castShadow>
          <boxGeometry args={[postW, height, 0.10]} />
          <primitive object={post} attach="material" />
        </mesh>
        <mesh position={[length / 2 - postW / 2, height / 2, 0]} castShadow>
          <boxGeometry args={[postW, height, 0.10]} />
          <primitive object={post} attach="material" />
        </mesh>

        {/* Boydan boya üst kapak kirişi */}
        <mesh position={[0, height - 0.03, 0]} castShadow>
          <boxGeometry args={[length, 0.06, 0.12]} />
          <primitive object={post} attach="material" />
        </mesh>
        {/* Alt kapak kirişi */}
        <mesh position={[0, 0.05, 0]} castShadow>
          <boxGeometry args={[length - postW, 0.06, 0.10]} />
          <primitive object={post} attach="material" />
        </mesh>

        {/* Sık, dolu dikey tahtalar */}
        {boards}
      </group>
    )
  }

  // ── Ahşap (varsayılan) — tahta dikey çubuklar, iki yatay kiriş + uç sütunlar ──
  const slatW  = 0.05
  const gap    = 0.09
  const pitch  = slatW + gap
  const innerLen = length - 0.20   // uç sütunlardan boşluk
  const slatCount = Math.max(3, Math.floor(innerLen / pitch))
  const slatStep = innerLen / slatCount

  const slatH = height - 0.10
  const slatY = 0.05 + slatH / 2

  const slats: ReactElement[] = []
  for (let i = 0; i < slatCount; i++) {
    const x = -innerLen / 2 + slatStep * (i + 0.5)
    // Deterministik hafif yükseklik varyasyonu (rüzgarlı, el yapımı görünüm)
    const seed = (i * 37) % 5
    const hOff = seed === 0 ? -0.02 : seed === 4 ? 0.02 : 0
    slats.push(
      <mesh key={`s-${i}`} position={[x, slatY + hOff / 2, 0]} castShadow>
        <boxGeometry args={[slatW, slatH + hOff, depth * 0.7]} />
        <primitive object={wood} attach="material" />
      </mesh>,
    )
  }

  return (
    <group>
      {/* Uç sütunlar (daha kalın) */}
      <mesh position={[-length / 2 + 0.05, height / 2, 0]} castShadow>
        <boxGeometry args={[0.10, height, depth]} />
        <primitive object={post} attach="material" />
      </mesh>
      <mesh position={[length / 2 - 0.05, height / 2, 0]} castShadow>
        <boxGeometry args={[0.10, height, depth]} />
        <primitive object={post} attach="material" />
      </mesh>
      {/* Sütun şapkaları */}
      <mesh position={[-length / 2 + 0.05, height + 0.03, 0]} castShadow>
        <boxGeometry args={[0.13, 0.04, depth + 0.03]} />
        <primitive object={woodDk} attach="material" />
      </mesh>
      <mesh position={[length / 2 - 0.05, height + 0.03, 0]} castShadow>
        <boxGeometry args={[0.13, 0.04, depth + 0.03]} />
        <primitive object={woodDk} attach="material" />
      </mesh>

      {/* Yatay kirişler — üst ve alt */}
      <mesh position={[0, height - 0.15, 0]} castShadow>
        <boxGeometry args={[length - 0.20, 0.06, depth * 0.8]} />
        <primitive object={woodDk} attach="material" />
      </mesh>
      <mesh position={[0, 0.20, 0]} castShadow>
        <boxGeometry args={[length - 0.20, 0.06, depth * 0.8]} />
        <primitive object={woodDk} attach="material" />
      </mesh>

      {/* Dikey çubuklar serisi */}
      {slats}
    </group>
  )
}
