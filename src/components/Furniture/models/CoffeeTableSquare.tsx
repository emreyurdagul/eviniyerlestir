import * as THREE from 'three'

const wood    = new THREE.MeshLambertMaterial({ color: 0x8a6a4a })
const woodTop = new THREE.MeshLambertMaterial({ color: 0xa88868 })
const legDark = new THREE.MeshLambertMaterial({ color: 0x4a3020 })

/** Kare sehpa — 2 katlı ahşap, dört ayak */
export default function CoffeeTableSquare({ dims }: { dims: Record<string, number> }) {
  const s = (dims.diameter ?? 100) / 100
  const w = s, d = s
  const topH = 0.42
  const shelfH = 0.12
  const legT = 0.05

  return (
    <group>
      {/* Ayaklar */}
      {[
        [-(w / 2 - legT / 2), -(d / 2 - legT / 2)],
        [ (w / 2 - legT / 2), -(d / 2 - legT / 2)],
        [-(w / 2 - legT / 2),  (d / 2 - legT / 2)],
        [ (w / 2 - legT / 2),  (d / 2 - legT / 2)],
      ].map(([px, pz], i) => (
        <mesh key={i} position={[px, topH / 2, pz]} castShadow>
          <boxGeometry args={[legT, topH, legT]} />
          <primitive object={legDark} attach="material" />
        </mesh>
      ))}

      {/* Alt raf */}
      <mesh position={[0, shelfH, 0]} castShadow>
        <boxGeometry args={[w - legT * 2 - 0.02, 0.03, d - legT * 2 - 0.02]} />
        <primitive object={wood} attach="material" />
      </mesh>

      {/* Üst tabla */}
      <mesh position={[0, topH, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.05, d]} />
        <primitive object={woodTop} attach="material" />
      </mesh>
    </group>
  )
}
