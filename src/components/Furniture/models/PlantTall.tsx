import * as THREE from 'three'

const pot    = new THREE.MeshLambertMaterial({ color: 0x989080 })
const potRim = new THREE.MeshLambertMaterial({ color: 0x706858 })
const trunk  = new THREE.MeshLambertMaterial({ color: 0x5a3a1a })
const leaf   = new THREE.MeshLambertMaterial({ color: 0x2a6a24, side: THREE.DoubleSide })
const leafL  = new THREE.MeshLambertMaterial({ color: 0x3a8a34, side: THREE.DoubleSide })

/** Uzun iç mekan ağacı (Ficus) — yüksek, gövdeli, geniş yapraklı */
export default function PlantTall({ dims }: { dims: Record<string, number> }) {
  const s = (dims.diameter ?? 40) / 40
  const rand = (seed: number) => Math.abs(Math.sin(seed * 12.9898 + 78.233) * 43758.5453) % 1

  // 3 üst üste yaprak kümesi — farklı yüksekliklerde
  const clusters = [
    { y: 0.95, size: 0.38 },
    { y: 1.35, size: 0.50 },
    { y: 1.68, size: 0.42 },
  ]

  return (
    <group scale={[s, s, s]}>
      {/* Saksı (yüksek) */}
      <mesh position={[0, 0.20, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.14, 0.40, 20]} />
        <primitive object={pot} attach="material" />
      </mesh>
      <mesh position={[0, 0.40, 0]}>
        <cylinderGeometry args={[0.19, 0.19, 0.03, 20]} />
        <primitive object={potRim} attach="material" />
      </mesh>
      {/* Gövde */}
      <mesh position={[0, 0.70, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.045, 0.60, 12]} />
        <primitive object={trunk} attach="material" />
      </mesh>
      {/* İkinci dal yukarıda */}
      <mesh position={[0.02, 1.20, 0]} castShadow>
        <cylinderGeometry args={[0.028, 0.035, 0.50, 12]} />
        <primitive object={trunk} attach="material" />
      </mesh>

      {/* Yaprak kümeleri */}
      {clusters.map((c, ci) => (
        <group key={ci} position={[0, c.y, 0]}>
          {Array.from({ length: 10 }, (_, i) => {
            const theta = (i / 10) * Math.PI * 2 + ci * 0.3
            const r = c.size * (0.7 + rand(ci * 31 + i) * 0.4)
            const dy = (rand(ci * 7 + i) - 0.5) * c.size * 0.3
            const lx = Math.cos(theta) * r
            const lz = Math.sin(theta) * r
            const leafLen = 0.20 + rand(ci * 13 + i) * 0.10
            const leafW = leafLen * 0.55
            return (
              <mesh
                key={`l-${ci}-${i}`}
                position={[lx, dy, lz]}
                rotation={[rand(i) * 0.3, -theta + Math.PI / 2, 0.2 + rand(i * 5) * 0.3]}
                scale={[leafLen, 0.02, leafW]}
                castShadow
              >
                <sphereGeometry args={[1, 10, 6]} />
                <primitive object={i % 2 === 0 ? leaf : leafL} attach="material" />
              </mesh>
            )
          })}
        </group>
      ))}
    </group>
  )
}
