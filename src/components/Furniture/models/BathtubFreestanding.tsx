import * as THREE from 'three'

const tubOut   = new THREE.MeshLambertMaterial({ color: 0xf4f4f0 })
const tubIn    = new THREE.MeshLambertMaterial({ color: 0xd8d8d2 })
const footMat  = new THREE.MeshLambertMaterial({ color: 0x8a6a40 })
const chrome   = new THREE.MeshLambertMaterial({ color: 0xb0b0b4 })

/** Küvet — Freestanding, ayaklı klasik oval */
export default function BathtubFreestanding({ dims }: { dims: Record<string, number> }) {
  const l = (dims.length ?? 170) / 100
  const w = (dims.width ?? 80) / 100
  const h = 0.60
  const footH = 0.10

  return (
    <group>
      {/* Oval küvet gövdesi — silindir, döndürülmüş */}
      <mesh position={[0, footH + h / 2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[w / 2, w / 2, l, 24]} />
        <primitive object={tubOut} attach="material" />
      </mesh>

      {/* Üst açıklık (havuz iç) */}
      <mesh position={[0, footH + h - 0.02, 0]}>
        <boxGeometry args={[l - 0.20, 0.04, w - 0.16]} />
        <primitive object={tubIn} attach="material" />
      </mesh>
      <mesh position={[0, footH + h - 0.18, 0]}>
        <boxGeometry args={[l - 0.30, 0.24, w - 0.26]} />
        <primitive object={tubIn} attach="material" />
      </mesh>

      {/* Dört süslü ayak (panç ayak) */}
      {[
        [-l / 2 + 0.18, -w / 2 + 0.10],
        [ l / 2 - 0.18, -w / 2 + 0.10],
        [-l / 2 + 0.18,  w / 2 - 0.10],
        [ l / 2 - 0.18,  w / 2 - 0.10],
      ].map(([px, pz], i) => (
        <mesh key={i} position={[px, footH / 2, pz]} castShadow>
          <cylinderGeometry args={[0.05, 0.07, footH, 10]} />
          <primitive object={footMat} attach="material" />
        </mesh>
      ))}

      {/* Yer musluğu (ayak üstü duvar uzağında) */}
      <mesh position={[l / 2 + 0.08, 0.30, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.028, 0.60, 10]} />
        <primitive object={chrome} attach="material" />
      </mesh>
      <mesh position={[l / 2 + 0.02, 0.62, 0]} rotation={[0, 0, -Math.PI / 2.2]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.16, 10]} />
        <primitive object={chrome} attach="material" />
      </mesh>
      {/* Taban */}
      <mesh position={[l / 2 + 0.08, 0.01, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.02, 14]} />
        <primitive object={chrome} attach="material" />
      </mesh>
    </group>
  )
}
