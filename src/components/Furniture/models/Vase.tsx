import * as THREE from 'three'
import type { ReactElement } from 'react'

const ceramic     = new THREE.MeshLambertMaterial({ color: 0xe0d4c0 })
const ceramicD    = new THREE.MeshLambertMaterial({ color: 0xa89680 })
const terracotta  = new THREE.MeshLambertMaterial({ color: 0xc0764a })
const terracottaD = new THREE.MeshLambertMaterial({ color: 0x8f5234 })
const glass       = new THREE.MeshPhongMaterial({ color: 0x9ed3df, transparent: true, opacity: 0.4, shininess: 90 })
const glassRim    = new THREE.MeshPhongMaterial({ color: 0xc3e8f0, transparent: true, opacity: 0.55, shininess: 90 })
const stemMat     = new THREE.MeshLambertMaterial({ color: 0x3a6a3a })
const flowerA     = new THREE.MeshLambertMaterial({ color: 0xd85a70 })
const flowerB     = new THREE.MeshLambertMaterial({ color: 0xf0e090 })

/**
 * Dekoratif vazo. Variant'a göre belirgin biçimde farklı geometri:
 *  - tall  : uzun ince seramik gövde + dik çiçek demeti (klasik, varsayılan)
 *  - short : alçak masa üstü terracotta küp/küre — boyunsuz, geniş ağız, kısa sürgünler
 *  - wide  : yayvan saydam cam — dar tabandan geniş ağıza açılan koni, yelpaze çiçekler
 */
export default function Vase({ dims, variant = 'tall' }: { dims: Record<string, number>; variant?: string }) {
  const diameter = (dims.diameter ?? 20) / 100
  const r = diameter / 2
  const height = (dims.height ?? 45) / 100

  const rand = (seed: number) => Math.abs(Math.sin(seed * 12.9898 + 78.233) * 43758.5453) % 1

  // Çiçek/sürgün demeti üretici — tüm variant'lar paylaşır
  const flowers = (
    count: number,
    baseY: number,
    spread: number,
    stemMin: number,
    stemRand: number,
    tiltBase: number,
    tiltRand: number,
  ): ReactElement[] =>
    Array.from({ length: count }, (_, i) => {
      const theta = (i / count) * Math.PI * 2
      const tilt = tiltBase + rand(i) * tiltRand
      const stemH = stemMin + rand(i * 3) * stemRand
      const tx = Math.cos(theta) * spread
      const tz = Math.sin(theta) * spread
      return (
        <group
          key={`f-${i}`}
          position={[tx, baseY, tz]}
          rotation={[Math.sin(theta) * tilt, 0, Math.cos(theta) * tilt]}
        >
          <mesh position={[0, stemH / 2, 0]} castShadow>
            <cylinderGeometry args={[0.005, 0.005, stemH, 6]} />
            <primitive object={stemMat} attach="material" />
          </mesh>
          <mesh position={[0, stemH + 0.02, 0]} castShadow>
            <sphereGeometry args={[0.035, 10, 8]} />
            <primitive object={i % 2 === 0 ? flowerA : flowerB} attach="material" />
          </mesh>
        </group>
      )
    })

  // ───────────────────────── short: alçak masa üstü terracotta ─────────────────────────
  if (variant === 'short') {
    return (
      <group>
        {/* Taban ayağı */}
        <mesh position={[0, height * 0.06, 0]} castShadow>
          <cylinderGeometry args={[r * 0.55, r * 0.72, height * 0.12, 20]} />
          <primitive object={terracottaD} attach="material" />
        </mesh>
        {/* Tıknaz gövde — üst omuza doğru genişler (boyun yok) */}
        <mesh position={[0, height * 0.38, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[r * 1.0, r * 0.62, height * 0.5, 20]} />
          <primitive object={terracotta} attach="material" />
        </mesh>
        {/* İçe kıvrılan omuz → geniş ağız */}
        <mesh position={[0, height * 0.74, 0]} castShadow>
          <cylinderGeometry args={[r * 0.82, r * 1.0, height * 0.22, 20]} />
          <primitive object={terracotta} attach="material" />
        </mesh>
        {/* Ağız halkası */}
        <mesh position={[0, height * 0.87, 0]}>
          <cylinderGeometry args={[r * 0.84, r * 0.8, height * 0.05, 20]} />
          <primitive object={terracottaD} attach="material" />
        </mesh>
        {/* Alçak, yana açılan kısa sürgünler */}
        {flowers(4, height * 0.85, r * 0.45, 0.10, 0.06, 0.30, 0.18)}
      </group>
    )
  }

  // ───────────────────────── wide: yayvan saydam cam ─────────────────────────
  if (variant === 'wide') {
    return (
      <group>
        {/* Küçük cam ayak */}
        <mesh position={[0, height * 0.04, 0]} castShadow>
          <cylinderGeometry args={[r * 0.32, r * 0.42, height * 0.08, 24]} />
          <primitive object={glassRim} attach="material" />
        </mesh>
        {/* Güçlü yayvanlık: dar taban → geniş ağız konisi */}
        <mesh position={[0, height * 0.40, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[r * 1.0, r * 0.34, height * 0.6, 24]} />
          <primitive object={glass} attach="material" />
        </mesh>
        {/* Geniş dudak flörü */}
        <mesh position={[0, height * 0.78, 0]} castShadow>
          <cylinderGeometry args={[r * 1.0, r * 0.98, height * 0.16, 24]} />
          <primitive object={glass} attach="material" />
        </mesh>
        {/* Ağız halkası */}
        <mesh position={[0, height * 0.86, 0]}>
          <cylinderGeometry args={[r * 1.0, r * 0.96, height * 0.03, 24]} />
          <primitive object={glassRim} attach="material" />
        </mesh>
        {/* Geniş ağza yelpaze gibi yayılan çiçekler */}
        {flowers(6, height * 0.8, r * 0.5, 0.16, 0.10, 0.35, 0.2)}
      </group>
    )
  }

  // ───────────────────────── tall (varsayılan / klasik): uzun ince seramik ─────────────────────────
  return (
    <group>
      {/* Vazo gövdesi — taban */}
      <mesh position={[0, height * 0.08, 0]} castShadow>
        <cylinderGeometry args={[r * 0.7, r * 0.85, height * 0.16, 20]} />
        <primitive object={ceramicD} attach="material" />
      </mesh>
      {/* Gövde (geniş orta) */}
      <mesh position={[0, height * 0.40, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[r * 1.0, r * 0.7, height * 0.52, 20]} />
        <primitive object={ceramic} attach="material" />
      </mesh>
      {/* Boyun */}
      <mesh position={[0, height * 0.80, 0]} castShadow>
        <cylinderGeometry args={[r * 0.6, r * 0.75, height * 0.25, 20]} />
        <primitive object={ceramic} attach="material" />
      </mesh>
      {/* Ağız halkası */}
      <mesh position={[0, height * 0.98, 0]}>
        <cylinderGeometry args={[r * 0.65, r * 0.60, 0.02, 20]} />
        <primitive object={ceramicD} attach="material" />
      </mesh>

      {/* Saplar ve çiçekler */}
      {flowers(5, height, 0.04, 0.22, 0.10, 0.15, 0.15)}
    </group>
  )
}
