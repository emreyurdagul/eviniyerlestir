import * as THREE from 'three'

const matBody   = new THREE.MeshLambertMaterial({ color: 0xf0f0f0 })
const matPanel  = new THREE.MeshLambertMaterial({ color: 0xe8e8e8 })
const matHandle = new THREE.MeshLambertMaterial({ color: 0x909090 })

export default function Dishwasher({ dims: _dims }: { dims: Record<string, number> }) {
  return (
    <group>
      {/* Gövde */}
      <mesh position={[0, 0.435, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.60, 0.87, 0.60]} />
        <primitive object={matBody} attach="material" />
      </mesh>

      {/* Yatay kapı paneli */}
      <mesh position={[0, 0.41, 0.305]}>
        <boxGeometry args={[0.54, 0.72, 0.018]} />
        <primitive object={matPanel} attach="material" />
      </mesh>

      {/* Tutamaç */}
      <mesh position={[0, 0.80, 0.318]}>
        <boxGeometry args={[0.50, 0.04, 0.04]} />
        <primitive object={matHandle} attach="material" />
      </mesh>
    </group>
  )
}
