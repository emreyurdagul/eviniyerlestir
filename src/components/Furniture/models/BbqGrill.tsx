import * as THREE from 'three'

const shell  = new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
const shellL = new THREE.MeshLambertMaterial({ color: 0x4a4a4a })
const grate  = new THREE.MeshLambertMaterial({ color: 0x666666 })
const wood   = new THREE.MeshLambertMaterial({ color: 0x6a4a28 })

/** Mangal — silindir gövde + üst ızgara + 3 ayak */
export default function BbqGrill({ dims }: { dims: Record<string, number> }) {
  const diameter = (dims.diameter ?? 55) / 100
  const r = diameter / 2

  const legH = 0.60
  const bowlH = 0.20

  return (
    <group>
      {/* 3 ayak */}
      {Array.from({ length: 3 }, (_, i) => {
        const theta = (i / 3) * Math.PI * 2
        const px = Math.cos(theta) * (r - 0.02)
        const pz = Math.sin(theta) * (r - 0.02)
        return (
          <mesh key={`leg-${i}`} position={[px, legH / 2, pz]} rotation={[0, 0, 0]} castShadow>
            <cylinderGeometry args={[0.012, 0.012, legH, 8]} />
            <primitive object={shell} attach="material" />
          </mesh>
        )
      })}
      {/* Alt alet rafı (yuvarlak halka) */}
      <mesh position={[0, 0.20, 0]}>
        <torusGeometry args={[r * 0.9, 0.008, 6, 20]} />
        <primitive object={shell} attach="material" />
      </mesh>

      {/* Çanak (ana gövde) */}
      <mesh position={[0, legH + bowlH / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[r, r * 0.85, bowlH, 24]} />
        <primitive object={shell} attach="material" />
      </mesh>

      {/* Izgara teli — üstte */}
      <mesh position={[0, legH + bowlH + 0.01, 0]}>
        <cylinderGeometry args={[r - 0.015, r - 0.015, 0.008, 20]} />
        <primitive object={grate} attach="material" />
      </mesh>
      {/* Paralel tel çizgileri — görsel */}
      {Array.from({ length: 8 }, (_, i) => {
        const offset = (i - 3.5) * (diameter * 0.11)
        return (
          <mesh key={`wire-${i}`} position={[offset, legH + bowlH + 0.015, 0]}>
            <boxGeometry args={[0.006, 0.006, (r * 2) - 0.03]} />
            <primitive object={grate} attach="material" />
          </mesh>
        )
      })}

      {/* Kapak (yarım küre, arkaya yatık) */}
      <mesh position={[0, legH + bowlH + 0.04, -r * 0.25]} rotation={[-0.6, 0, 0]} castShadow>
        <sphereGeometry args={[r * 0.98, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <primitive object={shellL} attach="material" />
      </mesh>

      {/* Kapak tutamacı (ahşap) */}
      <mesh position={[0, legH + bowlH + 0.30, -r * 0.6]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, 0.10, 10]} />
        <primitive object={wood} attach="material" />
      </mesh>
    </group>
  )
}
