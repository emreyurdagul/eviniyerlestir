import * as THREE from 'three'
import type { ReactElement } from 'react'

const panelMat   = new THREE.MeshLambertMaterial({ color: 0xf3f1ea })
const finMat     = new THREE.MeshLambertMaterial({ color: 0xeae8e0 })
const manifoldMat = new THREE.MeshLambertMaterial({ color: 0xe2dfd6 })
const bracketMat = new THREE.MeshLambertMaterial({ color: 0xc9c6bd })
const valveMat   = new THREE.MeshLambertMaterial({ color: 0xb6b2a8 })

/**
 * Panel kalorifer / petek (radyatör). Variant yok.
 * Dikey ince paralel lamellerden (8-12 boru) oluşan panel; üstte ve altta
 * yatay manifold, arkada düz panel ve duvara tutturma ayakları, yanda valf.
 * Beyaz/krem metal görünüm. Genişlik dims.width (cm) ile ölçeklenir.
 */
export default function Radiator({ dims }: { dims: Record<string, number>; variant?: string }) {
  const w = (dims.width ?? 80) / 100
  const h = 0.55
  const d = 0.10

  const footH = 0.06          // zeminden boşluk
  const manT = 0.05           // manifold kalınlığı
  const yBase = footH         // panel altı
  const yTop = footH + h      // panel üstü
  const yMid = footH + h / 2

  // Dikey lamel sayısı (8-12 arası, genişliğe göre)
  const finCount = Math.min(12, Math.max(8, Math.round(w / 0.07)))
  const innerW = w - 0.04
  const slot = innerW / finCount
  const finW = slot * 0.55
  const finH = h - 2 * manT

  const fins: ReactElement[] = Array.from({ length: finCount }, (_, i) => {
    const x = -innerW / 2 + slot * (i + 0.5)
    return (
      <mesh key={`fin-${i}`} position={[x, yMid, 0]} castShadow>
        <boxGeometry args={[finW, finH, d]} />
        <primitive object={finMat} attach="material" />
      </mesh>
    )
  })

  return (
    <group>
      {/* Arka düz panel — petek gövdesi */}
      <mesh position={[0, yMid, -d * 0.28]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d * 0.4]} />
        <primitive object={panelMat} attach="material" />
      </mesh>

      {/* Dikey lameller / borular */}
      {fins}

      {/* Alt manifold */}
      <mesh position={[0, yBase + manT / 2, 0]} castShadow>
        <boxGeometry args={[w, manT, d]} />
        <primitive object={manifoldMat} attach="material" />
      </mesh>

      {/* Üst manifold */}
      <mesh position={[0, yTop - manT / 2, 0]} castShadow>
        <boxGeometry args={[w, manT, d]} />
        <primitive object={manifoldMat} attach="material" />
      </mesh>

      {/* Duvara tutturma ayakları */}
      {[-1, 1].map((sx) => (
        <mesh
          key={`foot-${sx}`}
          position={[sx * (w / 2 - 0.08), footH / 2, -d * 0.2]}
          castShadow
        >
          <boxGeometry args={[0.04, footH, 0.04]} />
          <primitive object={bracketMat} attach="material" />
        </mesh>
      ))}

      {/* Yan alt valf gövdesi */}
      <mesh
        position={[-w / 2 + 0.02, yBase + manT / 2, d / 2 - 0.01]}
        castShadow
      >
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <primitive object={valveMat} attach="material" />
      </mesh>
      {/* Valf düğmesi */}
      <mesh
        position={[-w / 2 - 0.02, yBase + manT / 2, d / 2 - 0.01]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.025, 0.025, 0.04, 14]} />
        <primitive object={valveMat} attach="material" />
      </mesh>
    </group>
  )
}
