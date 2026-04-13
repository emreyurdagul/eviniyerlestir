import * as THREE from 'three'

const seat = new THREE.MeshLambertMaterial({ color: 0xc0b49e })
const leg = new THREE.MeshLambertMaterial({ color: 0x887050 })

export default function DiningChair({ dims: _dims }: { dims: Record<string, number> }) {
  return (
    <group>
      <mesh position={[0, 0.46, 0]} castShadow><boxGeometry args={[0.44, 0.04, 0.44]} /><primitive object={seat} attach="material" /></mesh>
      {[[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.23, z]} castShadow><boxGeometry args={[0.034, 0.46, 0.034]} /><primitive object={leg} attach="material" /></mesh>
      ))}
      <mesh position={[0, 0.67, -0.20]} castShadow><boxGeometry args={[0.42, 0.36, 0.04]} /><primitive object={seat} attach="material" /></mesh>
      <mesh position={[-0.19, 0.67, -0.18]} castShadow><boxGeometry args={[0.034, 0.36, 0.034]} /><primitive object={leg} attach="material" /></mesh>
      <mesh position={[0.19, 0.67, -0.18]} castShadow><boxGeometry args={[0.034, 0.36, 0.034]} /><primitive object={leg} attach="material" /></mesh>
    </group>
  )
}
