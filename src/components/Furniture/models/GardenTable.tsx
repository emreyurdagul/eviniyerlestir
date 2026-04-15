import * as THREE from 'three'

const metal = new THREE.MeshLambertMaterial({ color: 0x3a3a3a })
const glass = new THREE.MeshLambertMaterial({ color: 0xcfe4e8, transparent: true, opacity: 0.55 })
const wood  = new THREE.MeshLambertMaterial({ color: 0x8a6a40 })

/** Bahçe masası — cam üstlü, metal ayaklı, yuvarlak */
export default function GardenTable({ dims }: { dims: Record<string, number> }) {
  const diameter = (dims.diameter ?? 90) / 100
  const r = diameter / 2
  const topH = 0.74
  const topTh = 0.04

  return (
    <group>
      {/* Merkez sütun */}
      <mesh position={[0, (topH - topTh) / 2, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, topH - topTh, 12]} />
        <primitive object={metal} attach="material" />
      </mesh>
      {/* Taban */}
      <mesh position={[0, 0.025, 0]} castShadow>
        <cylinderGeometry args={[r * 0.45, r * 0.48, 0.05, 20]} />
        <primitive object={metal} attach="material" />
      </mesh>
      {/* Ahşap çerçeve */}
      <mesh position={[0, topH - topTh / 2 - 0.005, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[r, r, 0.03, 28]} />
        <primitive object={wood} attach="material" />
      </mesh>
      {/* Cam üst */}
      <mesh position={[0, topH + 0.005, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[r - 0.04, r - 0.04, 0.012, 28]} />
        <primitive object={glass} attach="material" />
      </mesh>
    </group>
  )
}
