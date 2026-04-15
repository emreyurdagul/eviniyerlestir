import * as THREE from 'three'
import { useLampConfig } from '../../../hooks/useLampConfig'

const metal = new THREE.MeshLambertMaterial({ color: 0x404040 })
const shade = new THREE.MeshLambertMaterial({ color: 0xf0e8d0, side: THREE.DoubleSide })
const base  = new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
const wood  = new THREE.MeshLambertMaterial({ color: 0x6a4a2a })

interface Props {
  dims: Record<string, number>
  lightIntensity?: number   // DEPRECATED
  lumens?: number
  colorTempK?: number
  lightOn?: boolean
}

/** Klasik lambader — ahşap taban, ince direk, kumaş abajur, ışık kaynağı */
export default function FloorLamp({ lightIntensity, lumens, colorTempK = 2800, lightOn = true }: Props) {
  const { intensity, colorHex, emissiveMaterial: shadeHot } = useLampConfig({
    lumens, lightIntensity, colorTempK,
    modelScale: 1.5, legacyScale: 1000, defaultLumens: 800,
  })

  return (
    <group>
      {/* Yuvarlak ahşap taban */}
      <mesh position={[0, 0.02, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.20, 0.04, 20]} />
        <primitive object={wood} attach="material" />
      </mesh>
      <mesh position={[0, 0.045, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.02, 12]} />
        <primitive object={base} attach="material" />
      </mesh>
      {/* İnce metal direk */}
      <mesh position={[0, 0.88, 0]} castShadow>
        <cylinderGeometry args={[0.014, 0.014, 1.70, 8]} />
        <primitive object={metal} attach="material" />
      </mesh>
      {/* Abajur */}
      <mesh position={[0, 1.72, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.22, 0.30, 20, 1, true]} />
        <primitive object={lightOn ? shadeHot : shade} attach="material" />
      </mesh>
      {/* Abajur üst kapak */}
      <mesh position={[0, 1.87, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.006, 20]} />
        <primitive object={metal} attach="material" />
      </mesh>
      {/* Kablo detayı (abajurdan tabana) */}
      <mesh position={[0.015, 1.0, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.30, 6]} />
        <primitive object={base} attach="material" />
      </mesh>

      {/* Işık */}
      {lightOn && (
        <pointLight
          position={[0, 1.68, 0]}
          intensity={intensity}
          color={colorHex}
          distance={6}
          decay={2}
          castShadow
        />
      )}
    </group>
  )
}
