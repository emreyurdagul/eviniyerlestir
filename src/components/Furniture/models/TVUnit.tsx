import * as THREE from 'three'

const body = new THREE.MeshLambertMaterial({ color: 0x483020 })
const screen = new THREE.MeshLambertMaterial({ color: 0x040410 })
const frame = new THREE.MeshLambertMaterial({ color: 0x121212 })

export default function TVUnit({ dims }: { dims: Record<string, number> }) {
  const len = (dims.length ?? 190) / 100
  const sl = Math.max(0.5, len - 0.34)

  return (
    <group>
      <mesh position={[0.27, 0.23, 0]} castShadow><boxGeometry args={[0.44, 0.46, len]} /><primitive object={body} attach="material" /></mesh>
      <mesh position={[0.10, 0.92, 0]} castShadow><boxGeometry args={[0.055, 0.84, sl]} /><primitive object={screen} attach="material" /></mesh>
      <mesh position={[0.09, 0.92, 0]} castShadow><boxGeometry args={[0.04, 0.90, sl + 0.07]} /><primitive object={frame} attach="material" /></mesh>
    </group>
  )
}
