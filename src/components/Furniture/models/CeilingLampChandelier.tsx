import * as THREE from 'three'

const brass    = new THREE.MeshLambertMaterial({ color: 0xb89050 })
const brassLgt = new THREE.MeshLambertMaterial({ color: 0xd8b070 })
const crystal  = new THREE.MeshLambertMaterial({ color: 0xe8e4d8, transparent: true, opacity: 0.9 })
const candle   = new THREE.MeshLambertMaterial({ color: 0xf0e8d0 })
const flameOn  = new THREE.MeshBasicMaterial({ color: 0xfff0a0 })

interface Props { dims: Record<string, number>; lightIntensity?: number; lightOn?: boolean }

/** Avize — 6 veya 8 kollu klasik, pirinç gövde, kristal detay */
export default function CeilingLampChandelier({ dims, lightIntensity = 0.8, lightOn = true }: Props) {
  const diam = (dims.diameter ?? 55) / 100
  const armCount = 8
  const armR = diam / 2 * 0.85

  return (
    <group position={[0, 0.55, 0]}>
      {/* Tavan plakası */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.10, 0.10, 0.02, 16]} />
        <primitive object={brass} attach="material" />
      </mesh>
      {/* Askı zinciri (kısa silindir dizisi) */}
      {[0.0, -0.06, -0.12, -0.18].map((y, i) => (
        <mesh key={i} position={[0, y - 0.03, 0]} rotation={[0, 0, i % 2 ? Math.PI / 2 : 0]}>
          <torusGeometry args={[0.015, 0.004, 6, 12]} />
          <primitive object={brass} attach="material" />
        </mesh>
      ))}
      {/* Merkez gövde */}
      <mesh position={[0, -0.32, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.05, 0.18, 12]} />
        <primitive object={brassLgt} attach="material" />
      </mesh>
      {/* Merkez alt topuz */}
      <mesh position={[0, -0.44, 0]} castShadow>
        <sphereGeometry args={[0.06, 16, 12]} />
        <primitive object={crystal} attach="material" />
      </mesh>

      {/* Kollar ve mumlar */}
      {Array.from({ length: armCount }, (_, i) => {
        const theta = (i / armCount) * Math.PI * 2
        const ax = Math.cos(theta) * armR
        const az = Math.sin(theta) * armR
        return (
          <group key={i} rotation={[0, -theta, 0]}>
            {/* Yatay-eğimli kol (kavisli) */}
            <mesh
              position={[armR * 0.5, -0.30, 0]}
              rotation={[0, 0, -0.35]}
              castShadow
            >
              <cylinderGeometry args={[0.010, 0.010, armR * 1.1, 8]} />
              <primitive object={brass} attach="material" />
            </mesh>
            {/* Kol ucu tabağı */}
            <mesh position={[ax, -0.22, az]} castShadow>
              <cylinderGeometry args={[0.035, 0.035, 0.012, 12]} />
              <primitive object={brassLgt} attach="material" />
            </mesh>
            {/* Mum */}
            <mesh position={[ax, -0.16, az]} castShadow>
              <cylinderGeometry args={[0.012, 0.014, 0.10, 8]} />
              <primitive object={candle} attach="material" />
            </mesh>
            {/* Alev / ampul */}
            {lightOn && (
              <mesh position={[ax, -0.10, az]}>
                <sphereGeometry args={[0.020, 10, 8]} />
                <primitive object={flameOn} attach="material" />
              </mesh>
            )}
          </group>
        )
      })}

      {/* Merkezi ışık */}
      {lightOn && (
        <pointLight
          position={[0, -0.30, 0]}
          intensity={lightIntensity * 2.5}
          color={0xfff0b0}
          distance={8}
          decay={2}
          castShadow
        />
      )}
    </group>
  )
}
