import * as THREE from 'three'
import type { ReactElement } from 'react'

const wood     = new THREE.MeshLambertMaterial({ color: 0xc9a474 })
const woodDk   = new THREE.MeshLambertMaterial({ color: 0x8a6840 })
const post     = new THREE.MeshLambertMaterial({ color: 0x6a4a28 })

/** Çit — tahta dikey çubuklar, iki yatay kiriş + uç sütunlar */
export default function Fence({ dims }: { dims: Record<string, number> }) {
  const length = (dims.length ?? 200) / 100
  const height = (dims.height ?? 120) / 100
  const depth  = 0.06

  // Dikey çubuk sayısı — her ~14 cm'de bir çubuk
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
      </mesh>
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
