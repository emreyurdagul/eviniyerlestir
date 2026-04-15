import * as THREE from 'three'

const fabric   = new THREE.MeshLambertMaterial({ color: 0x8a6a78 })
const fabricL  = new THREE.MeshLambertMaterial({ color: 0xa08898 })
const fabricD  = new THREE.MeshLambertMaterial({ color: 0x70505e })

/** Armut Koltuk — yumuşak deforme, alçak, üst üste yığılmış sferler */
export default function Beanbag({ dims }: { dims: Record<string, number> }) {
  const s = (dims.diameter ?? 100) / 100
  const r = s / 2

  // Deforme şekil: birkaç farklı konumda/radyusta sfer + alt düzleştirme kutusu
  return (
    <group>
      {/* Alt yayılmış taban (düzleştirilmiş kürenin alt kısmı) */}
      <mesh position={[0, r * 0.28, 0]} scale={[1.15, 0.55, 1.05]} castShadow receiveShadow>
        <sphereGeometry args={[r, 18, 14]} />
        <primitive object={fabric} attach="material" />
      </mesh>

      {/* Sağ tarafta şişkinlik */}
      <mesh position={[r * 0.35, r * 0.50, -r * 0.10]} scale={[0.70, 0.55, 0.70]} castShadow>
        <sphereGeometry args={[r, 16, 12]} />
        <primitive object={fabricL} attach="material" />
      </mesh>

      {/* Sol tarafta şişkinlik */}
      <mesh position={[-r * 0.30, r * 0.45, r * 0.08]} scale={[0.60, 0.50, 0.60]} castShadow>
        <sphereGeometry args={[r, 16, 12]} />
        <primitive object={fabricL} attach="material" />
      </mesh>

      {/* Arka yüksek kısım — bel desteği görünümü */}
      <mesh position={[0, r * 0.70, -r * 0.45]} scale={[0.80, 0.80, 0.50]} castShadow>
        <sphereGeometry args={[r, 16, 12]} />
        <primitive object={fabricD} attach="material" />
      </mesh>

      {/* Üst büzgü noktası (deforme merkez) */}
      <mesh position={[0, r * 0.90, -r * 0.08]} scale={[0.25, 0.20, 0.25]}>
        <sphereGeometry args={[r, 12, 8]} />
        <primitive object={fabricD} attach="material" />
      </mesh>
    </group>
  )
}
