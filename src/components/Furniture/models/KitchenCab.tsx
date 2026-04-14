import * as THREE from 'three'

const matBody   = new THREE.MeshLambertMaterial({ color: 0xf0f0ec })
const matDoor   = new THREE.MeshLambertMaterial({ color: 0xe0e0dc })
const matEdge   = new THREE.MeshLambertMaterial({ color: 0xd0d0cc })
const matHandle = new THREE.MeshLambertMaterial({ color: 0x909090 })

export default function KitchenCab({ dims }: { dims: Record<string, number> }) {
  const w   = (dims.width ?? 60) / 100
  const dep = (dims.depth ?? 35) / 100

  return (
    <group>
      {/* Ana gövde */}
      <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 2.10, dep]} />
        <primitive object={matBody} attach="material" />
      </mesh>

      {/* Kapı yüzü */}
      <mesh position={[0, 1.05, dep / 2 + 0.005]}>
        <boxGeometry args={[w - 0.02, 2.06, 0.012]} />
        <primitive object={matDoor} attach="material" />
      </mesh>

      {/* Orta dikey çizgi */}
      <mesh position={[0, 1.05, dep / 2 + 0.012]}>
        <boxGeometry args={[0.008, 2.06, 0.005]} />
        <primitive object={matEdge} attach="material" />
      </mesh>

      {/* Kulplar */}
      {[-w / 4, w / 4].map((xOff, i) => (
        <mesh key={i} position={[xOff, 1.05, dep / 2 + 0.025]}>
          <boxGeometry args={[0.02, 0.12, 0.03]} />
          <primitive object={matHandle} attach="material" />
        </mesh>
      ))}
    </group>
  )
}
