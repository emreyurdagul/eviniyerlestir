import * as THREE from 'three'

const frame   = new THREE.MeshLambertMaterial({ color: 0x8a6a40 })
const frameL  = new THREE.MeshLambertMaterial({ color: 0xb09068 })
const mirrorM = new THREE.MeshLambertMaterial({ color: 0xd8e4e8 })

/** Duvar aynası — dikdörtgen ahşap çerçeveli */
export default function Mirror({ dims }: { dims: Record<string, number> }) {
  const w = (dims.width ?? 60) / 100
  const h = (dims.height ?? 80) / 100

  const frameTh = 0.06
  const depth = 0.04

  return (
    <group>
      {/* Arka plaka (çerçeve) */}
      <mesh position={[0, 0, -depth / 2]} castShadow>
        <boxGeometry args={[w, h, depth]} />
        <primitive object={frame} attach="material" />
      </mesh>
      {/* İç ayna yüzeyi */}
      <mesh position={[0, 0, 0.001]}>
        <boxGeometry args={[w - frameTh * 2, h - frameTh * 2, 0.005]} />
        <primitive object={mirrorM} attach="material" />
      </mesh>
      {/* Çerçeve üst süslü kenar (highlight) */}
      <mesh position={[0, h / 2 - 0.015, 0.002]}>
        <boxGeometry args={[w - 0.02, 0.02, 0.008]} />
        <primitive object={frameL} attach="material" />
      </mesh>
      <mesh position={[0, -h / 2 + 0.015, 0.002]}>
        <boxGeometry args={[w - 0.02, 0.02, 0.008]} />
        <primitive object={frameL} attach="material" />
      </mesh>
    </group>
  )
}
