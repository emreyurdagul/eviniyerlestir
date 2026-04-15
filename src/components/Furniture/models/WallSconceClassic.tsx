import * as THREE from 'three'
import { useLampConfig } from '../../../hooks/useLampConfig'

const brass  = new THREE.MeshLambertMaterial({ color: 0xb89050 })
const shade  = new THREE.MeshLambertMaterial({ color: 0xf4e8c0, side: THREE.DoubleSide })
const candle = new THREE.MeshLambertMaterial({ color: 0xf0e8d0 })

interface Props {
  dims: Record<string, number>
  lightIntensity?: number   // DEPRECATED
  lumens?: number
  colorTempK?: number
  lightOn?: boolean
}

/** Klasik duvar aydınlatması — mum formu + yarım abajur */
export default function WallSconceClassic({ dims, lightIntensity, lumens, colorTempK = 2700, lightOn = true }: Props) {
  const w = (dims.width ?? 25) / 100

  const { intensity, colorHex, emissiveMaterial: shadeOn } = useLampConfig({
    lumens, lightIntensity, colorTempK,
    modelScale: 1.0, legacyScale: 800, defaultLumens: 400,
  })

  return (
    <group position={[0, 0.175, 0]}>
      {/* Duvar plakası */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.08, 0.12, 0.02]} />
        <primitive object={brass} attach="material" />
      </mesh>
      {/* Kavisli kol (öne uzanır) */}
      <mesh position={[0, 0.02, 0.06]} rotation={[0.4, 0, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.10, 8]} />
        <primitive object={brass} attach="material" />
      </mesh>
      {/* Mum tabağı */}
      <mesh position={[0, 0.08, 0.11]}>
        <cylinderGeometry args={[0.025, 0.025, 0.008, 12]} />
        <primitive object={brass} attach="material" />
      </mesh>
      {/* Mum */}
      <mesh position={[0, 0.13, 0.11]}>
        <cylinderGeometry args={[0.011, 0.013, 0.08, 8]} />
        <primitive object={candle} attach="material" />
      </mesh>
      {/* Üzerinde yarım abajur (koni) */}
      <mesh position={[0, 0.20, 0.11]} castShadow>
        <cylinderGeometry args={[0.04, w * 0.6, 0.09, 16, 1, true]} />
        <primitive object={lightOn ? shadeOn : shade} attach="material" />
      </mesh>

      {/* Işık */}
      {lightOn && (
        <pointLight
          position={[0, 0.18, 0.11]}
          intensity={intensity}
          color={colorHex}
          distance={3.5}
          decay={2}
        />
      )}
    </group>
  )
}
