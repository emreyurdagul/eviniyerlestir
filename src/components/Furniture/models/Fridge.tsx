import * as THREE from 'three'

const matBody    = new THREE.MeshLambertMaterial({ color: 0xf0f0ee })
const matDoor    = new THREE.MeshLambertMaterial({ color: 0xe8e8e6 })
const matFreezer = new THREE.MeshLambertMaterial({ color: 0xe0e0de })
const matHandle  = new THREE.MeshLambertMaterial({ color: 0xb0b0ae })

export default function Fridge({ dims }: { dims: Record<string, number> }) {
  const w   = (dims.width ?? 70) / 100
  const dep = (dims.depth ?? 65) / 100

  return (
    <group>
      {/* Ana gövde */}
      <mesh position={[0, 0.925, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 1.85, dep]} />
        <primitive object={matBody} attach="material" />
      </mesh>

      {/* Kapı yüzü */}
      <mesh position={[0, 0.925, dep / 2 + 0.005]}>
        <boxGeometry args={[w - 0.02, 1.83, 0.014]} />
        <primitive object={matDoor} attach="material" />
      </mesh>

      {/* Freezer çizgisi */}
      <mesh position={[0, 1.32, dep / 2 + 0.012]}>
        <boxGeometry args={[w - 0.02, 0.012, 0.005]} />
        <primitive object={matFreezer} attach="material" />
      </mesh>

      {/* Kulp */}
      <mesh position={[w * 0.3, 0.90, dep / 2 + 0.038]}>
        <boxGeometry args={[0.025, 0.35, 0.025]} />
        <primitive object={matHandle} attach="material" />
      </mesh>
    </group>
  )
}
