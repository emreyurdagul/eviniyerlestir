import * as THREE from 'three'

const body      = new THREE.MeshLambertMaterial({ color: 0xe8e2d8 })
const mirror    = new THREE.MeshLambertMaterial({ color: 0xb8c8d4, transparent: true, opacity: 0.85 })
const mirrorFr  = new THREE.MeshLambertMaterial({ color: 0xc8c0b4 })
const chrome    = new THREE.MeshLambertMaterial({ color: 0xb0b0b4 })

/** Banyo Dolabı — duvara asılı, çift aynalı kapı */
export default function BathroomCabinetDouble({ dims }: { dims: Record<string, number> }) {
  const w = (dims.width ?? 90) / 100
  const h = (dims.height ?? 70) / 100
  const d = 0.18

  return (
    <group>
      {/* Gövde */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <primitive object={body} attach="material" />
      </mesh>

      {/* İki kapı + ayna */}
      {[-1, 1].map((sign) => (
        <group key={sign}>
          <mesh position={[(sign * w) / 4, h / 2, d / 2 + 0.005]} castShadow>
            <boxGeometry args={[w / 2 - 0.02, h - 0.02, 0.01]} />
            <primitive object={mirrorFr} attach="material" />
          </mesh>
          <mesh position={[(sign * w) / 4, h / 2, d / 2 + 0.012]}>
            <boxGeometry args={[w / 2 - 0.08, h - 0.08, 0.004]} />
            <primitive object={mirror} attach="material" />
          </mesh>
          {/* kulp — iç kenara */}
          <mesh position={[sign * 0.02, h / 2, d / 2 + 0.02]} castShadow>
            <boxGeometry args={[0.012, 0.10, 0.015]} />
            <primitive object={chrome} attach="material" />
          </mesh>
        </group>
      ))}

      {/* Üst led bar */}
      <mesh position={[0, h + 0.02, 0.05]} castShadow>
        <boxGeometry args={[w - 0.10, 0.025, 0.06]} />
        <primitive object={chrome} attach="material" />
      </mesh>
    </group>
  )
}
