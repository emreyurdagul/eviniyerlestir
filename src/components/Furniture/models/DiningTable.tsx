import * as THREE from 'three'

const top = new THREE.MeshLambertMaterial({ color: 0xcfc09a })
const leg = new THREE.MeshLambertMaterial({ color: 0x887050 })

export default function DiningTable({ dims }: { dims: Record<string, number> }) {
  const len = (dims.length ?? 180) / 100
  const wid = (dims.width ?? 90) / 100
  const lx = len / 2 - 0.08
  const lz = wid / 2 - 0.07

  return (
    <group>
      <mesh position={[0, 0.76, 0]} castShadow><boxGeometry args={[len, 0.044, wid]} /><primitive object={top} attach="material" /></mesh>
      {[[-lx, -lz], [-lx, lz], [lx, -lz], [lx, lz]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.38, z]} castShadow><boxGeometry args={[0.06, 0.76, 0.06]} /><primitive object={leg} attach="material" /></mesh>
      ))}
    </group>
  )
}
