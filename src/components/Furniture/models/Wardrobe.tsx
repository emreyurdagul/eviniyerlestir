import * as THREE from 'three'

const body = new THREE.MeshLambertMaterial({ color: 0xc0a878 })
const door = new THREE.MeshLambertMaterial({ color: 0xd4c4a0 })
const handle = new THREE.MeshLambertMaterial({ color: 0x606060 })

export default function Wardrobe({ dims }: { dims: Record<string, number> }) {
  const w = (dims.width ?? 120) / 100
  const d = (dims.depth ?? 60) / 100
  const h = 2.0

  return (
    <group>
      {/* Body */}
      <mesh position={[0, h / 2, 0]} castShadow><boxGeometry args={[w, h, d]} /><primitive object={body} attach="material" /></mesh>
      {/* Doors */}
      <mesh position={[0, h / 2, d / 2 + 0.005]} castShadow><boxGeometry args={[w - 0.04, h - 0.08, 0.02]} /><primitive object={door} attach="material" /></mesh>
      {/* Door line */}
      <mesh position={[0, h / 2, d / 2 + 0.016]} castShadow><boxGeometry args={[0.01, h - 0.12, 0.005]} /><primitive object={handle} attach="material" /></mesh>
      {/* Handles */}
      <mesh position={[-0.04, h / 2, d / 2 + 0.025]} castShadow><boxGeometry args={[0.02, 0.10, 0.02]} /><primitive object={handle} attach="material" /></mesh>
      <mesh position={[0.04, h / 2, d / 2 + 0.025]} castShadow><boxGeometry args={[0.02, 0.10, 0.02]} /><primitive object={handle} attach="material" /></mesh>
    </group>
  )
}
