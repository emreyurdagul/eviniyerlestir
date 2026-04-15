import * as THREE from 'three'

const fabric   = new THREE.MeshLambertMaterial({ color: 0x8a7860 })
const fabricL  = new THREE.MeshLambertMaterial({ color: 0xa09078 })
const legMat   = new THREE.MeshLambertMaterial({ color: 0x503820 })

/** Puf / Otoman — yumuşak dikdörtgen, kısa ayaklar */
export default function Ottoman({ dims }: { dims: Record<string, number> }) {
  const w = (dims.width ?? 60) / 100
  const l = (dims.length ?? 60) / 100
  const legH = 0.08
  const bodyH = 0.30

  return (
    <group>
      {/* Ana yastık blok */}
      <mesh position={[0, legH + bodyH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, bodyH, l]} />
        <primitive object={fabric} attach="material" />
      </mesh>

      {/* Üst minder (hafif kabarık görünüm) */}
      <mesh position={[0, legH + bodyH + 0.03, 0]} castShadow>
        <boxGeometry args={[w - 0.03, 0.06, l - 0.03]} />
        <primitive object={fabricL} attach="material" />
      </mesh>

      {/* Orta dikiş çizgisi (dekor) — hafif derinlik */}
      <mesh position={[0, legH + bodyH + 0.061, 0]}>
        <boxGeometry args={[0.01, 0.002, l - 0.10]} />
        <primitive object={fabric} attach="material" />
      </mesh>
      <mesh position={[0, legH + bodyH + 0.061, 0]}>
        <boxGeometry args={[w - 0.10, 0.002, 0.01]} />
        <primitive object={fabric} attach="material" />
      </mesh>

      {/* 4 ayak */}
      {[
        [-w / 2 + 0.06, -l / 2 + 0.06],
        [ w / 2 - 0.06, -l / 2 + 0.06],
        [-w / 2 + 0.06,  l / 2 - 0.06],
        [ w / 2 - 0.06,  l / 2 - 0.06],
      ].map(([px, pz], i) => (
        <mesh key={i} position={[px, legH / 2, pz]} castShadow>
          <cylinderGeometry args={[0.018, 0.022, legH, 8]} />
          <primitive object={legMat} attach="material" />
        </mesh>
      ))}
    </group>
  )
}
