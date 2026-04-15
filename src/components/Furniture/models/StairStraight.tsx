import * as THREE from 'three'

const woodStep  = new THREE.MeshLambertMaterial({ color: 0xb88860 })
const woodSide  = new THREE.MeshLambertMaterial({ color: 0x8a6a48 })
const railMat   = new THREE.MeshLambertMaterial({ color: 0x555555 })

/**
 * Düz merdiven — basamak serisi + yan kirişler + opsiyonel korkuluk.
 *
 * Props:
 *   height: toplam yükseklik (cm) — hedef kat yüksekliği
 *   width : basamak genişliği (cm)
 *   length: yatay uzunluk (cm) — basamak sayısını belirler
 *
 * Basamak yüksekliği ~18 cm, derinliği ~25 cm (Türkiye standardı).
 */
export default function StairStraight({ dims }: { dims: Record<string, number> }) {
  const h = (dims.height ?? 280) / 100
  const w = (dims.width  ?? 100) / 100
  const l = (dims.length ?? 350) / 100

  const stepRise = 0.18
  const stepCount = Math.max(10, Math.round(h / stepRise))
  const actualRise = h / stepCount
  const stepRun = l / stepCount

  // Basamaklar
  const steps = Array.from({ length: stepCount }, (_, i) => {
    const y = i * actualRise + actualRise / 2
    const z = -l / 2 + i * stepRun + stepRun / 2
    return (
      <mesh key={`step-${i}`} position={[0, y, z]} castShadow receiveShadow>
        <boxGeometry args={[w, actualRise, stepRun]} />
        <primitive object={woodStep} attach="material" />
      </mesh>
    )
  })

  // Yan kirişler (stringers) — eğimli
  const angle = Math.atan(h / l)
  const stringerLen = Math.sqrt(h * h + l * l)

  return (
    <group>
      {steps}
      {/* Sol yan kiriş */}
      <mesh
        position={[-w / 2 - 0.02, h / 2, 0]}
        rotation={[-angle, 0, 0]}
        castShadow
      >
        <boxGeometry args={[0.04, 0.3, stringerLen]} />
        <primitive object={woodSide} attach="material" />
      </mesh>
      {/* Sağ yan kiriş */}
      <mesh
        position={[w / 2 + 0.02, h / 2, 0]}
        rotation={[-angle, 0, 0]}
        castShadow
      >
        <boxGeometry args={[0.04, 0.3, stringerLen]} />
        <primitive object={woodSide} attach="material" />
      </mesh>

      {/* Korkuluk küpeştesi (sağ) — eğimli */}
      <mesh
        position={[w / 2 + 0.05, h / 2 + 0.9, 0]}
        rotation={[-angle, 0, 0]}
        castShadow
      >
        <boxGeometry args={[0.04, 0.04, stringerLen]} />
        <primitive object={railMat} attach="material" />
      </mesh>

      {/* Korkuluk dikmeleri (her 2 basamakta bir) */}
      {Array.from({ length: Math.floor(stepCount / 2) + 1 }, (_, i) => {
        const z = -l / 2 + i * 2 * stepRun
        const y = i * 2 * actualRise
        return (
          <mesh key={`baluster-${i}`} position={[w / 2 + 0.05, y + 0.45, z]} castShadow>
            <boxGeometry args={[0.025, 0.9, 0.025]} />
            <primitive object={railMat} attach="material" />
          </mesh>
        )
      })}
    </group>
  )
}
