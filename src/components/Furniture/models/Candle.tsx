import * as THREE from 'three'

const tray   = new THREE.MeshLambertMaterial({ color: 0x8a7050 })
const wax    = new THREE.MeshLambertMaterial({ color: 0xf0e8d0 })
const waxAlt = new THREE.MeshLambertMaterial({ color: 0xe8d8b0 })
const wick   = new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
const flame  = new THREE.MeshLambertMaterial({ color: 0xffc860, emissive: 0xff8020, emissiveIntensity: 0.8 })

/** Dekoratif mum seti — 3 farklı boy mum + tabak */
export default function Candle({ dims }: { dims: Record<string, number> }) {
  const scale = (dims.diameter ?? 25) / 25
  const s = scale

  const candles: { x: number; z: number; h: number; r: number; alt: boolean }[] = [
    { x: -0.07 * s, z: 0,          h: 0.22 * s, r: 0.035 * s, alt: false },
    { x:  0.00 * s, z: 0.03 * s,   h: 0.14 * s, r: 0.028 * s, alt: true  },
    { x:  0.07 * s, z: -0.02 * s,  h: 0.18 * s, r: 0.032 * s, alt: false },
  ]

  return (
    <group>
      {/* Metal tabak */}
      <mesh position={[0, 0.015, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.14 * s, 0.15 * s, 0.03 * s, 20]} />
        <primitive object={tray} attach="material" />
      </mesh>
      <mesh position={[0, 0.032 * s, 0]}>
        <cylinderGeometry args={[0.13 * s, 0.13 * s, 0.005, 20]} />
        <primitive object={tray} attach="material" />
      </mesh>

      {candles.map((c, i) => (
        <group key={`c-${i}`} position={[c.x, 0.03, c.z]}>
          {/* Mum gövdesi */}
          <mesh position={[0, c.h / 2, 0]} castShadow>
            <cylinderGeometry args={[c.r, c.r, c.h, 16]} />
            <primitive object={c.alt ? waxAlt : wax} attach="material" />
          </mesh>
          {/* Fitil */}
          <mesh position={[0, c.h + 0.015, 0]}>
            <cylinderGeometry args={[0.0015, 0.0015, 0.03, 6]} />
            <primitive object={wick} attach="material" />
          </mesh>
          {/* Alev (küçük damlacık) */}
          <mesh position={[0, c.h + 0.045, 0]}>
            <sphereGeometry args={[0.014, 10, 8]} />
            <primitive object={flame} attach="material" />
          </mesh>
        </group>
      ))}
    </group>
  )
}
