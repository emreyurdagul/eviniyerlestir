import * as THREE from 'three'
import type { ReactElement } from 'react'

const wood    = new THREE.MeshLambertMaterial({ color: 0x8a5a32 })
const woodDk  = new THREE.MeshLambertMaterial({ color: 0x5e3c20 })
const brass   = new THREE.MeshLambertMaterial({ color: 0xb08d3c })
const coatMat = new THREE.MeshLambertMaterial({ color: 0x39506e })
const hatMat  = new THREE.MeshLambertMaterial({ color: 0x2b2b2f })

/**
 * Portmanto / ayaklı askılık. Dik direk + alt haç taban + üstte yana çıkan
 * kısa askı kolları (uçlarında küçük toplar) + bir palto ve bir şapka.
 */
export default function CoatRack({ dims }: { dims: Record<string, number> }) {
  const w = (dims.width ?? 50) / 100
  const d = (dims.depth ?? 50) / 100
  const height = (dims.height ?? 180) / 100

  const postH = height * 0.97
  const postR = Math.min(w, d) * 0.05

  // ── Yana çıkan kısa askı kolları (uçlarında küçük toplar) ──
  const hookCount = 5
  const armLen = 0.13
  const tilt = 0.5 // kolların yukarı eğimi
  const tx = Math.cos(tilt) * armLen
  const ty = Math.sin(tilt) * armLen
  const hooks: ReactElement[] = Array.from({ length: hookCount }, (_, i) => {
    const theta = (i / hookCount) * Math.PI * 2
    const hy = i % 2 === 0 ? postH * 0.86 : postH * 0.76
    return (
      <group key={`hook-${i}`} position={[0, hy, 0]} rotation={[0, theta, 0]}>
        <mesh position={[tx / 2, ty / 2, 0]} rotation={[0, 0, -(Math.PI / 2 - tilt)]} castShadow>
          <cylinderGeometry args={[postR * 0.5, postR * 0.5, armLen, 8]} />
          <primitive object={wood} attach="material" />
        </mesh>
        <mesh position={[tx, ty, 0]} castShadow>
          <sphereGeometry args={[postR * 0.85, 10, 8]} />
          <primitive object={brass} attach="material" />
        </mesh>
      </group>
    )
  })

  // ── Haç tabanın uçlarındaki küçük ayak topları ──
  const footPos: [number, number][] = [
    [w * 0.46, 0],
    [-w * 0.46, 0],
    [0, d * 0.46],
    [0, -d * 0.46],
  ]
  const feet: ReactElement[] = footPos.map(([fx, fz], i) => (
    <mesh key={`foot-${i}`} position={[fx, 0.025, fz]} castShadow>
      <sphereGeometry args={[0.04, 10, 8]} />
      <primitive object={woodDk} attach="material" />
    </mesh>
  ))

  return (
    <group>
      {/* Haç taban — çapraz iki kiriş */}
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <boxGeometry args={[w * 0.92, 0.05, 0.09]} />
        <primitive object={wood} attach="material" />
      </mesh>
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.09, 0.05, d * 0.92]} />
        <primitive object={wood} attach="material" />
      </mesh>
      {feet}
      {/* Taban göbeği */}
      <mesh position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[postR * 2.2, postR * 2.8, 0.14, 16]} />
        <primitive object={woodDk} attach="material" />
      </mesh>

      {/* Dik direk */}
      <mesh position={[0, postH / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[postR, postR * 1.15, postH, 14]} />
        <primitive object={wood} attach="material" />
      </mesh>
      {/* Üst tepe topu */}
      <mesh position={[0, postH, 0]} castShadow>
        <sphereGeometry args={[postR * 1.6, 12, 10]} />
        <primitive object={woodDk} attach="material" />
      </mesh>

      {hooks}

      {/* Ön kola asılı stilize palto */}
      <group position={[tx + 0.02, postH * 0.86 + ty - 0.02, 0]}>
        <mesh position={[0, -0.05, 0]} castShadow>
          <sphereGeometry args={[0.055, 10, 8]} />
          <primitive object={coatMat} attach="material" />
        </mesh>
        <mesh position={[0, -0.33, 0]} castShadow>
          <boxGeometry args={[0.26, 0.5, 0.12]} />
          <primitive object={coatMat} attach="material" />
        </mesh>
      </group>

      {/* Tepeye konmuş şapka */}
      <group position={[0, postH + 0.01, 0]} rotation={[0.22, 0, 0.15]}>
        <mesh position={[0, 0.02, 0]} castShadow>
          <cylinderGeometry args={[0.13, 0.13, 0.018, 18]} />
          <primitive object={hatMat} attach="material" />
        </mesh>
        <mesh position={[0, 0.07, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.082, 0.1, 18]} />
          <primitive object={hatMat} attach="material" />
        </mesh>
      </group>
    </group>
  )
}
