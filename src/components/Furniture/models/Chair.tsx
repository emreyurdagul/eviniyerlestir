import * as THREE from 'three'

const cream = new THREE.MeshLambertMaterial({ color: 0xd8cebc })
const lCream = new THREE.MeshLambertMaterial({ color: 0xe6dcca })
const wood = new THREE.MeshLambertMaterial({ color: 0x1e1008 })

export default function Chair({ dims }: { dims: Record<string, number> }) {
  const scale = (dims.diameter ?? 90) / 124

  return (
    <group scale={[scale, scale, scale]}>
      {/* Seat blob */}
      <mesh position={[0, 0.44, 0]} castShadow>
        <sphereGeometry args={[0.62, 18, 12]} />
        <primitive object={cream} attach="material" />
        <group scale={[1, 0.70, 1]} />
      </mesh>
      {/* Cushion */}
      <mesh position={[0, 0.60, 0.06]} castShadow>
        <sphereGeometry args={[0.54, 16, 10]} />
        <primitive object={lCream} attach="material" />
        <group scale={[0.84, 0.28, 0.80]} />
      </mesh>
      {/* Back */}
      <mesh position={[0, 0.78, -0.18]} castShadow>
        <sphereGeometry args={[0.56, 14, 10]} />
        <primitive object={cream} attach="material" />
        <group scale={[0.86, 0.64, 0.68]} />
      </mesh>
      {/* Legs */}
      {[0, 1, 2, 3].map(i => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4
        return (
          <mesh key={i} position={[Math.sin(a) * 0.21, 0.135, Math.cos(a) * 0.21]}
            rotation={[Math.sin(a) * 0.16, 0, -Math.cos(a) * 0.16]} castShadow>
            <cylinderGeometry args={[0.020, 0.014, 0.27, 8]} />
            <primitive object={wood} attach="material" />
          </mesh>
        )
      })}
    </group>
  )
}
