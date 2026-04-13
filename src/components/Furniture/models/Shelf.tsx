import * as THREE from 'three'

const wood = new THREE.MeshLambertMaterial({ color: 0xb09870 })
const side = new THREE.MeshLambertMaterial({ color: 0x9a8860 })

export default function Shelf({ dims }: { dims: Record<string, number> }) {
  const w = (dims.width ?? 80) / 100
  const h = (dims.height ?? 180) / 100
  const d = 0.30
  const shelves = Math.max(2, Math.floor(h / 0.35))
  const shelfGap = h / shelves

  return (
    <group>
      {/* Sides */}
      <mesh position={[-w / 2, h / 2, 0]} castShadow><boxGeometry args={[0.025, h, d]} /><primitive object={side} attach="material" /></mesh>
      <mesh position={[w / 2, h / 2, 0]} castShadow><boxGeometry args={[0.025, h, d]} /><primitive object={side} attach="material" /></mesh>
      {/* Back */}
      <mesh position={[0, h / 2, -d / 2 + 0.005]} castShadow><boxGeometry args={[w, h, 0.01]} /><primitive object={side} attach="material" /></mesh>
      {/* Shelves */}
      {Array.from({ length: shelves + 1 }, (_, i) => (
        <mesh key={i} position={[0, i * shelfGap, 0]} castShadow>
          <boxGeometry args={[w - 0.02, 0.025, d]} /><primitive object={wood} attach="material" />
        </mesh>
      ))}
    </group>
  )
}
