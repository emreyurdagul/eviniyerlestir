import * as THREE from 'three'
import { useMemo } from 'react'
import { useLampConfig } from '../../../hooks/useLampConfig'

const metal  = new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
const marble = new THREE.MeshLambertMaterial({ color: 0xe8e4dc })
const shade  = new THREE.MeshLambertMaterial({ color: 0x3a3a3a, side: THREE.DoubleSide })

interface Props {
  dims: Record<string, number>
  lightIntensity?: number   // DEPRECATED
  lumens?: number
  colorTempK?: number
  lightOn?: boolean
}

/** Arc floor lamp — mermer taban, kavisli metal kol, büyük abajur */
export default function FloorLampArc({ lightIntensity, lumens, colorTempK = 2800, lightOn = true }: Props) {
  const { intensity, colorHex, emissiveMaterial: shadeOn } = useLampConfig({
    lumens, lightIntensity, colorTempK,
    modelScale: 1.8, legacyScale: 1100, defaultLumens: 900,
  })

  // Kavis için TubeGeometry — bezier curve
  const curve = useMemo(() => {
    const c = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, 0.10, 0),
      new THREE.Vector3(0, 1.8, 0),
      new THREE.Vector3(0.7, 2.0, 0),
      new THREE.Vector3(1.30, 1.90, 0),
    )
    return new THREE.TubeGeometry(c, 40, 0.015, 8, false)
  }, [])

  return (
    <group>
      {/* Mermer yuvarlak taban */}
      <mesh position={[0, 0.04, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.24, 0.08, 24]} />
        <primitive object={marble} attach="material" />
      </mesh>
      {/* Metal halka taban üstünde */}
      <mesh position={[0, 0.085, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.005, 24]} />
        <primitive object={metal} attach="material" />
      </mesh>

      {/* Kavisli metal kol */}
      <mesh castShadow>
        <primitive object={curve} attach="geometry" />
        <primitive object={metal} attach="material" />
      </mesh>

      {/* Abajur — büyük koni */}
      <mesh position={[1.30, 1.80, 0]} rotation={[0, 0, Math.PI]} castShadow>
        <coneGeometry args={[0.20, 0.28, 20, 1, true]} />
        <primitive object={lightOn ? shadeOn : shade} attach="material" />
      </mesh>
      {/* Abajur üst kapak */}
      <mesh position={[1.30, 1.94, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.01, 16]} />
        <primitive object={metal} attach="material" />
      </mesh>

      {/* Işık — aşağı doğru, abajurun içinden */}
      {lightOn && (
        <pointLight
          position={[1.30, 1.72, 0]}
          intensity={intensity}
          color={colorHex}
          distance={5}
          decay={2}
          castShadow
        />
      )}
    </group>
  )
}
