import * as THREE from 'three'

const matBody    = new THREE.MeshLambertMaterial({ color: 0x303030 })
const matDoor    = new THREE.MeshLambertMaterial({ color: 0x888888 })
const matHob     = new THREE.MeshLambertMaterial({ color: 0x202020 })
const matBurner  = new THREE.MeshLambertMaterial({ color: 0x444444 })

export default function Ankastre({ dims }: { dims: Record<string, number> }) {
  const w = (dims.width ?? 60) / 100

  return (
    <group>
      {/* Ana gövde */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.9, 0.60]} />
        <primitive object={matBody} attach="material" />
      </mesh>

      {/* Fırın kapısı */}
      <mesh position={[0, 0.25, 0.31]} castShadow>
        <boxGeometry args={[w - 0.06, 0.38, 0.02]} />
        <primitive object={matDoor} attach="material" />
      </mesh>

      {/* Ocak yüzeyi */}
      <mesh position={[0, 0.895, -0.025]}>
        <boxGeometry args={[w - 0.04, 0.01, 0.55]} />
        <primitive object={matHob} attach="material" />
      </mesh>

      {/* 4 brülör */}
      {[[-w * 0.22, -0.08], [w * 0.22, -0.08], [-w * 0.22, 0.08], [w * 0.22, 0.08]].map(([bx, bz], i) => (
        <mesh key={i} position={[bx, 0.901, bz]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.01, 16]} />
          <primitive object={matBurner} attach="material" />
        </mesh>
      ))}
    </group>
  )
}
