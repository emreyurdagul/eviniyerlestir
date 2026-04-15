import * as THREE from 'three'

const fabric   = new THREE.MeshLambertMaterial({ color: 0x6a7860 })
const fabricL  = new THREE.MeshLambertMaterial({ color: 0x8a9878 })
const legMat   = new THREE.MeshLambertMaterial({ color: 0x5a3820 })

/** Bank — yastıklı üst, ince ahşap ayaklar */
export default function BenchUpholstered({ dims }: { dims: Record<string, number> }) {
  const l = (dims.length ?? 120) / 100
  const w = (dims.width ?? 40) / 100
  const legH = 0.20
  const padH = 0.18

  return (
    <group>
      {/* Yastık ana blok */}
      <mesh position={[0, legH + padH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[l, padH, w]} />
        <primitive object={fabric} attach="material" />
      </mesh>
      {/* Üst kabarık yastık */}
      <mesh position={[0, legH + padH + 0.03, 0]} castShadow>
        <boxGeometry args={[l - 0.04, 0.06, w - 0.04]} />
        <primitive object={fabricL} attach="material" />
      </mesh>
      {/* Orta boyuna dikiş */}
      <mesh position={[0, legH + padH + 0.061, 0]}>
        <boxGeometry args={[l - 0.20, 0.002, 0.01]} />
        <primitive object={fabric} attach="material" />
      </mesh>

      {/* Tufted düğme noktaları (3 adet) */}
      {[-l / 4, 0, l / 4].map((px, i) => (
        <mesh key={i} position={[px, legH + padH + 0.062, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.008, 10]} />
          <primitive object={legMat} attach="material" />
        </mesh>
      ))}

      {/* 4 eğimli ahşap ayak */}
      {[
        [-l / 2 + 0.06, -w / 2 + 0.05],
        [ l / 2 - 0.06, -w / 2 + 0.05],
        [-l / 2 + 0.06,  w / 2 - 0.05],
        [ l / 2 - 0.06,  w / 2 - 0.05],
      ].map(([px, pz], i) => (
        <mesh
          key={i}
          position={[px, legH / 2, pz]}
          rotation={[px < 0 ? 0 : 0, 0, px < 0 ? 0.08 : -0.08]}
          castShadow
        >
          <cylinderGeometry args={[0.016, 0.020, legH, 8]} />
          <primitive object={legMat} attach="material" />
        </mesh>
      ))}
    </group>
  )
}
