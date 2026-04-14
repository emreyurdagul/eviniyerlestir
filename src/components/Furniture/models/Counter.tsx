import * as THREE from 'three'

const matOak    = new THREE.MeshLambertMaterial({ color: 0xc0a878 })
const matStone  = new THREE.MeshLambertMaterial({ color: 0xd8d4cc })
const matDoor   = new THREE.MeshLambertMaterial({ color: 0xb89860 })
const matHandle = new THREE.MeshLambertMaterial({ color: 0x888888 })

export default function Counter({ dims }: { dims: Record<string, number> }) {
  const len = (dims.length ?? 180) / 100
  const dep = (dims.depth  ??  60) / 100

  return (
    <group>
      {/* Alt dolap gövdesi */}
      <mesh position={[0, 0.435, 0]} castShadow receiveShadow>
        <boxGeometry args={[len, 0.87, dep]} />
        <primitive object={matOak} attach="material" />
      </mesh>

      {/* Tezgah */}
      <mesh position={[0, 0.895, 0]} castShadow>
        <boxGeometry args={[len + 0.02, 0.05, dep + 0.02]} />
        <primitive object={matStone} attach="material" />
      </mesh>

      {/* Kapı yüzü */}
      <mesh position={[0, 0.435, dep / 2 + 0.005]}>
        <boxGeometry args={[len - 0.04, 0.80, 0.012]} />
        <primitive object={matDoor} attach="material" />
      </mesh>

      {/* Kulplar */}
      {[-len / 4, len / 4].map((xOff, i) => (
        <mesh key={i} position={[xOff, 0.50, dep / 2 + 0.018]}>
          <boxGeometry args={[0.10, 0.02, 0.03]} />
          <primitive object={matHandle} attach="material" />
        </mesh>
      ))}
    </group>
  )
}
