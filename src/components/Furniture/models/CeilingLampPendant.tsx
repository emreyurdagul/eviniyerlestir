import * as THREE from 'three'
import { useLampConfig } from '../../../hooks/useLampConfig'

const cord    = new THREE.MeshLambertMaterial({ color: 0x202020 })
const mount   = new THREE.MeshLambertMaterial({ color: 0x3a3a3a })
const globe   = new THREE.MeshLambertMaterial({ color: 0xf8f4e4, side: THREE.DoubleSide })

interface Props {
  dims: Record<string, number>
  lightIntensity?: number   // DEPRECATED
  lumens?: number
  colorTempK?: number
  lightOn?: boolean
}

/**
 * Tavan sarkıt lambası — tavana monteli, kablo ile sarkan küre/koni globe
 * Işık: lumens → intensity (modelScale=2.0 — geniş alan aydınlatır)
 *       colorTempK → pointLight rengi + globe "on" rengi
 */
export default function CeilingLampPendant({ dims, lightIntensity, lumens, colorTempK = 3000, lightOn = true }: Props) {
  const diam = (dims.diameter ?? 55) / 100

  const { intensity, colorHex, emissiveMaterial: globeOnMat } = useLampConfig({
    lumens, lightIntensity, colorTempK,
    modelScale: 2.0, legacyScale: 1500, defaultLumens: 1500,
  })

  return (
    <group position={[0, 0.55, 0]}>
      {/* Tavan plakası */}
      <mesh position={[0, 0.00, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} />
        <primitive object={mount} attach="material" />
      </mesh>
      {/* Kablo */}
      <mesh position={[0, -0.20, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.40, 6]} />
        <primitive object={cord} attach="material" />
      </mesh>
      {/* Globe — yarım küre formu */}
      <mesh position={[0, -0.42, 0]} castShadow>
        <sphereGeometry args={[diam / 2, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
        <primitive object={lightOn ? globeOnMat : globe} attach="material" />
      </mesh>
      {/* Globe üst bağlantı */}
      <mesh position={[0, -0.38, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.02, 12]} />
        <primitive object={mount} attach="material" />
      </mesh>

      {/* Işık */}
      {lightOn && (
        <pointLight
          position={[0, -0.42, 0]}
          intensity={intensity}
          color={colorHex}
          distance={7}
          decay={2}
          castShadow
        />
      )}
    </group>
  )
}
