import * as THREE from 'three'

const tubOut   = new THREE.MeshLambertMaterial({ color: 0xf0f0ec })
const tubIn    = new THREE.MeshLambertMaterial({ color: 0xdadad4 })
const chrome   = new THREE.MeshLambertMaterial({ color: 0xb0b0b4 })
const tile     = new THREE.MeshLambertMaterial({ color: 0xe0e0d8 })

/** Küvet — klasik gömme, tek duvar kenarı */
export default function Bathtub({ dims }: { dims: Record<string, number> }) {
  const l = (dims.length ?? 170) / 100
  const w = (dims.width ?? 75) / 100
  const h = 0.58

  return (
    <group>
      {/* Alt kaide (fayans kaplamalı blok) */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[l, h, w]} />
        <primitive object={tile} attach="material" />
      </mesh>

      {/* Küvet iç havuzu (gömülü) — üstte koyu alan */}
      <mesh position={[0, h - 0.04, 0]}>
        <boxGeometry args={[l - 0.14, 0.02, w - 0.14]} />
        <primitive object={tubIn} attach="material" />
      </mesh>
      {/* Havuz iç dipleri */}
      <mesh position={[0, h - 0.18, 0]}>
        <boxGeometry args={[l - 0.26, 0.24, w - 0.24]} />
        <primitive object={tubIn} attach="material" />
      </mesh>

      {/* Üst pervaz */}
      <mesh position={[0, h, 0]} castShadow>
        <boxGeometry args={[l, 0.03, w]} />
        <primitive object={tubOut} attach="material" />
      </mesh>
      {/* iç açıklık (üst görüş için koyu kare) */}
      <mesh position={[0, h + 0.0155, 0]}>
        <boxGeometry args={[l - 0.16, 0.001, w - 0.16]} />
        <primitive object={tubIn} attach="material" />
      </mesh>

      {/* Musluk bloğu (uzun kenar ortasında) */}
      <mesh position={[-l / 2 + 0.10, h + 0.05, 0]} castShadow>
        <boxGeometry args={[0.10, 0.08, 0.14]} />
        <primitive object={chrome} attach="material" />
      </mesh>
      {/* Musluk burnu */}
      <mesh position={[-l / 2 + 0.18, h + 0.08, 0]} rotation={[0, 0, Math.PI / 2.2]} castShadow>
        <cylinderGeometry args={[0.014, 0.014, 0.14, 10]} />
        <primitive object={chrome} attach="material" />
      </mesh>

      {/* Drenaj */}
      <mesh position={[l / 2 - 0.15, h - 0.28, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.004, 12]} />
        <primitive object={chrome} attach="material" />
      </mesh>
    </group>
  )
}
