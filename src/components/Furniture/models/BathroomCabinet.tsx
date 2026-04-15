import * as THREE from 'three'

const body      = new THREE.MeshLambertMaterial({ color: 0xeae4dc })
const mirror    = new THREE.MeshLambertMaterial({ color: 0xb8c8d4, transparent: true, opacity: 0.85 })
const mirrorFr  = new THREE.MeshLambertMaterial({ color: 0xc8c0b4 })
const chrome    = new THREE.MeshLambertMaterial({ color: 0xb0b0b4 })

/** Banyo Dolabı — duvara asılı, tek aynalı kapı */
export default function BathroomCabinet({ dims }: { dims: Record<string, number> }) {
  const w = (dims.width ?? 60) / 100
  const h = (dims.height ?? 70) / 100
  const d = 0.18

  // Duvara asılı — yerden 100 cm yukarda başlasın; origin alt-orta olduğundan y ofseti yOffset'e bırakıp buradaki y'yi 0'dan başlatıyoruz
  return (
    <group>
      {/* Dolap gövdesi */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <primitive object={body} attach="material" />
      </mesh>

      {/* Ayna çerçevesi */}
      <mesh position={[0, h / 2, d / 2 + 0.005]} castShadow>
        <boxGeometry args={[w - 0.02, h - 0.02, 0.01]} />
        <primitive object={mirrorFr} attach="material" />
      </mesh>
      {/* Ayna yüzeyi */}
      <mesh position={[0, h / 2, d / 2 + 0.012]}>
        <boxGeometry args={[w - 0.08, h - 0.08, 0.004]} />
        <primitive object={mirror} attach="material" />
      </mesh>

      {/* Kulp */}
      <mesh position={[w / 2 - 0.05, h / 2, d / 2 + 0.02]} castShadow>
        <boxGeometry args={[0.015, 0.10, 0.015]} />
        <primitive object={chrome} attach="material" />
      </mesh>

      {/* Üst aydınlatma bar */}
      <mesh position={[0, h + 0.02, 0.05]} castShadow>
        <boxGeometry args={[w - 0.08, 0.025, 0.06]} />
        <primitive object={chrome} attach="material" />
      </mesh>
    </group>
  )
}
