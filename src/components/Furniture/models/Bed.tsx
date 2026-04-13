import * as THREE from 'three'

const base = new THREE.MeshLambertMaterial({ color: 0xcfc09a })
const board = new THREE.MeshLambertMaterial({ color: 0xc0b49e })
const mattress = new THREE.MeshLambertMaterial({ color: 0xf0ebe5 })
const pillow = new THREE.MeshLambertMaterial({ color: 0x7e6e58 })

export default function Bed({ dims }: { dims: Record<string, number> }) {
  const len = (dims.length ?? 200) / 100
  const wid = (dims.width ?? 160) / 100

  return (
    <group>
      <mesh position={[0, 0.15, 0]} castShadow><boxGeometry args={[wid, 0.30, len]} /><primitive object={base} attach="material" /></mesh>
      <mesh position={[0, 0.60, -(len / 2 - 0.07)]} castShadow><boxGeometry args={[wid, 0.60, 0.14]} /><primitive object={board} attach="material" /></mesh>
      <mesh position={[0, 0.41, len / 2 - 0.05]} castShadow><boxGeometry args={[wid, 0.22, 0.10]} /><primitive object={board} attach="material" /></mesh>
      <mesh position={[0, 0.345, -0.02]} castShadow><boxGeometry args={[wid - 0.10, 0.18, len - 0.28]} /><primitive object={mattress} attach="material" /></mesh>
      <mesh position={[-(wid / 4), 0.47, -(len / 2 - 0.28)]} castShadow><boxGeometry args={[0.50, 0.12, 0.36]} /><primitive object={pillow} attach="material" /></mesh>
      <mesh position={[(wid / 4), 0.47, -(len / 2 - 0.28)]} castShadow><boxGeometry args={[0.50, 0.12, 0.36]} /><primitive object={pillow} attach="material" /></mesh>
    </group>
  )
}
