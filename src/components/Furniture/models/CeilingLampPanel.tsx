import * as THREE from 'three'
import { useLampConfig } from '../../../hooks/useLampConfig'

const frame = new THREE.MeshLambertMaterial({ color: 0xe8e8e8 })
const panel = new THREE.MeshLambertMaterial({ color: 0xf4f4f0 })

interface Props {
  dims: Record<string, number>
  lightIntensity?: number   // DEPRECATED
  lumens?: number
  colorTempK?: number
  lightOn?: boolean
}

/** Yuvarlak LED panel — ince, modern, tavana gömülü */
export default function CeilingLampPanel({ dims, lightIntensity, lumens, colorTempK = 4000, lightOn = true }: Props) {
  const diam = (dims.diameter ?? 55) / 100
  const r = diam / 2

  const { intensity, colorHex, emissiveMaterial: panelOn } = useLampConfig({
    lumens, lightIntensity, colorTempK,
    modelScale: 2.2, legacyScale: 2000, defaultLumens: 2000,
  })

  return (
    <group position={[0, 0.53, 0]}>
      {/* Dış çerçeve */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[r, r, 0.04, 32]} />
        <primitive object={frame} attach="material" />
      </mesh>
      {/* Işık paneli (alt yüz) */}
      <mesh position={[0, -0.022, 0]} rotation={[Math.PI, 0, 0]}>
        <circleGeometry args={[r - 0.015, 32]} />
        <primitive object={lightOn ? panelOn : panel} attach="material" />
      </mesh>

      {/* Geniş alan ışığı */}
      {lightOn && (
        <>
          <pointLight
            position={[0, -0.08, 0]}
            intensity={intensity}
            color={colorHex}
            distance={8}
            decay={2}
            castShadow
          />
          {/* Hafif emissive glow halka */}
          <mesh position={[0, -0.025, 0]}>
            <ringGeometry args={[r - 0.018, r - 0.002, 32]} />
            <meshBasicMaterial color={colorHex} transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
        </>
      )}
    </group>
  )
}
