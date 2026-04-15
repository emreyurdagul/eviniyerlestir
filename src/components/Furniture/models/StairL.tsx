import * as THREE from 'three'

const woodStep  = new THREE.MeshLambertMaterial({ color: 0xb88860 })
const woodSide  = new THREE.MeshLambertMaterial({ color: 0x8a6a48 })
const railMat   = new THREE.MeshLambertMaterial({ color: 0x555555 })
const platformMat = new THREE.MeshLambertMaterial({ color: 0xa07850 })

/**
 * L-tipi (çeyrek dönüşlü) merdiven — iki kısım + ortada platform.
 *
 * Düzen: -Z yönünden başlar, ortada 90° dönüşle +X yönüne çıkar.
 *
 * Props:
 *   height: toplam yükseklik (cm)
 *   width : basamak genişliği (cm)
 */
export default function StairL({ dims }: { dims: Record<string, number> }) {
  const h = (dims.height ?? 280) / 100
  const w = (dims.width ?? 100) / 100

  const stepRise = 0.18
  const totalSteps = Math.max(12, Math.round(h / stepRise))
  const halfSteps = Math.floor(totalSteps / 2)
  const actualRise = h / totalSteps
  const stepRun = 0.25

  // Platform (ortada dönüş noktası)
  const platformY = halfSteps * actualRise
  const platformZ = -halfSteps * stepRun
  const platformX = 0

  // İlk yarım: -Z yönüne uzanan basamaklar
  const firstHalf = Array.from({ length: halfSteps }, (_, i) => {
    const y = i * actualRise + actualRise / 2
    const z = -i * stepRun - stepRun / 2
    return (
      <mesh key={`s1-${i}`} position={[0, y, z]} castShadow receiveShadow>
        <boxGeometry args={[w, actualRise, stepRun]} />
        <primitive object={woodStep} attach="material" />
      </mesh>
    )
  })

  // İkinci yarım: +X yönüne uzanan basamaklar (platformun üstünden başlar)
  const secondHalf = Array.from({ length: totalSteps - halfSteps }, (_, i) => {
    const y = platformY + (i + 1) * actualRise - actualRise / 2
    const x = (i + 1) * stepRun - stepRun / 2
    return (
      <mesh key={`s2-${i}`} position={[x, y, platformZ]} castShadow receiveShadow>
        <boxGeometry args={[stepRun, actualRise, w]} />
        <primitive object={woodStep} attach="material" />
      </mesh>
    )
  })

  return (
    <group>
      {firstHalf}
      {/* Dönüş platformu */}
      <mesh position={[platformX, platformY - 0.02, platformZ]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.04, w]} />
        <primitive object={platformMat} attach="material" />
      </mesh>
      {secondHalf}

      {/* Yan kiriş — ilk yarım (Z ekseni boyunca eğimli) */}
      <mesh
        position={[w / 2 + 0.02, platformY / 2, -halfSteps * stepRun / 2]}
        rotation={[-Math.atan(platformY / (halfSteps * stepRun)), 0, 0]}
        castShadow
      >
        <boxGeometry args={[0.04, 0.3, Math.sqrt(platformY * platformY + (halfSteps * stepRun) ** 2)]} />
        <primitive object={woodSide} attach="material" />
      </mesh>

      {/* Korkuluk dikmeleri — ilk yarım sağ */}
      {Array.from({ length: Math.ceil(halfSteps / 2) }, (_, i) => (
        <mesh
          key={`r1-${i}`}
          position={[w / 2 + 0.05, i * 2 * actualRise + 0.45, -i * 2 * stepRun]}
          castShadow
        >
          <boxGeometry args={[0.025, 0.9, 0.025]} />
          <primitive object={railMat} attach="material" />
        </mesh>
      ))}

      {/* Korkuluk dikmeleri — ikinci yarım ön */}
      {Array.from({ length: Math.ceil((totalSteps - halfSteps) / 2) }, (_, i) => (
        <mesh
          key={`r2-${i}`}
          position={[i * 2 * stepRun, platformY + i * 2 * actualRise + 0.45, platformZ - w / 2 - 0.05]}
          castShadow
        >
          <boxGeometry args={[0.025, 0.9, 0.025]} />
          <primitive object={railMat} attach="material" />
        </mesh>
      ))}
    </group>
  )
}
