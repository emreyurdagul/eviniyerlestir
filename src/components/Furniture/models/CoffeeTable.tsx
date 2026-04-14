import * as THREE from 'three'

const wood    = new THREE.MeshLambertMaterial({ color: 0xc0a878 })
const woodDk  = new THREE.MeshLambertMaterial({ color: 0x8a6a4a })
const glass   = new THREE.MeshLambertMaterial({ color: 0xd8e4e8, transparent: true, opacity: 0.4 })

/** Yuvarlak orta sehpa — alt raflı, ahşap + cam üst tabla */
export default function CoffeeTable({ dims }: { dims: Record<string, number> }) {
  const r = (dims.diameter ?? 100) / 200
  const topH = 0.42
  const shelfH = 0.12

  return (
    <group>
      {/* 4 ayak — hafif dışa eğimli */}
      {[0, 1, 2, 3].map(i => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4
        const px = Math.sin(a) * (r - 0.12)
        const pz = Math.cos(a) * (r - 0.12)
        return (
          <mesh key={i} position={[px, topH / 2, pz]} rotation={[Math.cos(a) * 0.05, 0, -Math.sin(a) * 0.05]} castShadow>
            <cylinderGeometry args={[0.028, 0.020, topH, 10]} />
            <primitive object={woodDk} attach="material" />
          </mesh>
        )
      })}

      {/* Alt raf */}
      <mesh position={[0, shelfH, 0]} castShadow>
        <cylinderGeometry args={[r - 0.14, r - 0.14, 0.025, 24]} />
        <primitive object={wood} attach="material" />
      </mesh>

      {/* Üst tabla: ahşap kenarlı, cam içli */}
      <mesh position={[0, topH - 0.015, 0]} castShadow>
        <cylinderGeometry args={[r, r, 0.03, 28]} />
        <primitive object={woodDk} attach="material" />
      </mesh>
      <mesh position={[0, topH, 0]}>
        <cylinderGeometry args={[r - 0.025, r - 0.025, 0.03, 28]} />
        <primitive object={glass} attach="material" />
      </mesh>
      {/* Cam altı iç çerçeve */}
      <mesh position={[0, topH - 0.02, 0]}>
        <torusGeometry args={[r - 0.010, 0.005, 8, 28]} />
        <primitive object={woodDk} attach="material" />
      </mesh>
    </group>
  )
}
