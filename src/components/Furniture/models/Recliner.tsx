import * as THREE from 'three'

const fabric   = new THREE.MeshLambertMaterial({ color: 0x5a6874 })
const fabricL  = new THREE.MeshLambertMaterial({ color: 0x6a7884 })
const baseMat  = new THREE.MeshLambertMaterial({ color: 0x302820 })

/** Rahatlık Koltuğu — kumaş, tek kişilik, yüksek sırt, ayak desteği */
export default function Recliner({ dims }: { dims: Record<string, number> }) {
  const w = (dims.width ?? 95) / 100
  const d = (dims.depth ?? 100) / 100
  const sitH = 0.44
  const backH = 0.82

  return (
    <group>
      {/* Baz blok */}
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[w - 0.04, 0.10, d - 0.14]} />
        <primitive object={baseMat} attach="material" />
      </mesh>

      {/* Oturma minderi */}
      <mesh position={[0, sitH - 0.08, 0.04]} castShadow>
        <boxGeometry args={[w - 0.10, 0.16, d - 0.20]} />
        <primitive object={fabric} attach="material" />
      </mesh>
      <mesh position={[0, sitH + 0.02, 0.04]} castShadow>
        <boxGeometry args={[w - 0.14, 0.06, d - 0.24]} />
        <primitive object={fabricL} attach="material" />
      </mesh>

      {/* Kollar */}
      {[-1, 1].map((sign) => (
        <group key={sign}>
          <mesh position={[sign * (w / 2 - 0.09), sitH - 0.04, 0.02]} castShadow>
            <boxGeometry args={[0.16, 0.40, d - 0.20]} />
            <primitive object={fabric} attach="material" />
          </mesh>
          <mesh position={[sign * (w / 2 - 0.09), sitH + 0.18, 0.02]} castShadow>
            <boxGeometry args={[0.18, 0.04, d - 0.20]} />
            <primitive object={fabricL} attach="material" />
          </mesh>
        </group>
      ))}

      {/* Yüksek sırtlık (kavisli) */}
      <mesh position={[0, sitH + backH / 2, -d / 2 + 0.18]} rotation={[-0.18, 0, 0]} castShadow>
        <boxGeometry args={[w - 0.20, backH, 0.22]} />
        <primitive object={fabric} attach="material" />
      </mesh>
      {/* Sırt yastık — üst */}
      <mesh position={[0, sitH + backH - 0.20, -d / 2 + 0.26]} rotation={[-0.22, 0, 0]} castShadow>
        <boxGeometry args={[w - 0.28, 0.30, 0.12]} />
        <primitive object={fabricL} attach="material" />
      </mesh>

      {/* Ayak desteği (çıkık, düşük) */}
      <mesh position={[0, 0.18, d / 2 - 0.06]} castShadow>
        <boxGeometry args={[w - 0.20, 0.14, 0.26]} />
        <primitive object={fabric} attach="material" />
      </mesh>
      <mesh position={[0, 0.26, d / 2 - 0.06]} castShadow>
        <boxGeometry args={[w - 0.24, 0.04, 0.24]} />
        <primitive object={fabricL} attach="material" />
      </mesh>
    </group>
  )
}
