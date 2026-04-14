import * as THREE from 'three'

const marble    = new THREE.MeshLambertMaterial({ color: 0xe8e4dc })
const marbleEdge = new THREE.MeshLambertMaterial({ color: 0xc4bfb0 })
const baseMetal = new THREE.MeshLambertMaterial({ color: 0xb89860 })

/** Mermer sehpa — yuvarlak mermer tabla, altın metal çapraz ayak */
export default function CoffeeTableMarble({ dims }: { dims: Record<string, number> }) {
  const diam = (dims.diameter ?? 100) / 100
  const r = diam / 2
  const topH = 0.42

  return (
    <group>
      {/* Yuvarlak mermer tabla */}
      <mesh position={[0, topH - 0.025, 0]} castShadow>
        <cylinderGeometry args={[r, r, 0.05, 32]} />
        <primitive object={marble} attach="material" />
      </mesh>
      {/* Tabla yan kenar şeridi */}
      <mesh position={[0, topH - 0.055, 0]} castShadow>
        <cylinderGeometry args={[r - 0.002, r - 0.002, 0.01, 32]} />
        <primitive object={marbleEdge} attach="material" />
      </mesh>

      {/* Merkez metal sütun */}
      <mesh position={[0, topH / 2 - 0.04, 0]} castShadow>
        <cylinderGeometry args={[0.028, 0.022, topH - 0.08, 14]} />
        <primitive object={baseMetal} attach="material" />
      </mesh>

      {/* Çapraz alt taban (4 çapraz bacak) */}
      {[0, 1, 2, 3].map(i => {
        const angle = (i / 4) * Math.PI * 2 + Math.PI / 4
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * r * 0.45, 0.015, Math.sin(angle) * r * 0.45]}
            rotation={[0, -angle, 0]}
            castShadow
          >
            <boxGeometry args={[r * 0.9, 0.03, 0.022]} />
            <primitive object={baseMetal} attach="material" />
          </mesh>
        )
      })}
    </group>
  )
}
