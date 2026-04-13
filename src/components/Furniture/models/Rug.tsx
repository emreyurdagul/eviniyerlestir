import * as THREE from 'three'

const rugMain = new THREE.MeshLambertMaterial({ color: 0x98886c })
const rugBorder = new THREE.MeshLambertMaterial({ color: 0x7e6e58 })

export default function Rug({ dims }: { dims: Record<string, number> }) {
  const len = (dims.length ?? 200) / 100
  const wid = (dims.width ?? 150) / 100

  return (
    <group>
      {/* Main rug */}
      <mesh position={[0, 0.005, 0]} receiveShadow>
        <boxGeometry args={[len, 0.01, wid]} /><primitive object={rugMain} attach="material" />
      </mesh>
      {/* Border */}
      <mesh position={[0, 0.008, 0]} receiveShadow>
        <boxGeometry args={[len - 0.10, 0.006, wid - 0.10]} /><primitive object={rugBorder} attach="material" />
      </mesh>
    </group>
  )
}
