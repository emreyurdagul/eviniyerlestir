import * as THREE from 'three'

const rattan     = new THREE.MeshLambertMaterial({ color: 0x9a7a50 })
const rattanDark = new THREE.MeshLambertMaterial({ color: 0x6a4a28 })
const cushion    = new THREE.MeshLambertMaterial({ color: 0xd8cfb8 })

/** Bahçe sandalyesi — örgü rattan gövde, kolsuz, dış mekan */
export default function GardenChair({ dims }: { dims: Record<string, number> }) {
  const s = (dims.diameter ?? 55) / 55
  const w = 0.55 * s
  const d = 0.55 * s

  const legH = 0.42
  const seatTh = 0.06
  const backH = 0.50

  return (
    <group>
      {/* Ayaklar */}
      {[
        [ w / 2 - 0.04,  d / 2 - 0.04],
        [-w / 2 + 0.04,  d / 2 - 0.04],
        [ w / 2 - 0.04, -d / 2 + 0.04],
        [-w / 2 + 0.04, -d / 2 + 0.04],
      ].map(([px, pz], i) => (
        <mesh key={`leg-${i}`} position={[px, legH / 2, pz]} castShadow>
          <cylinderGeometry args={[0.022, 0.022, legH, 10]} />
          <primitive object={rattanDark} attach="material" />
        </mesh>
      ))}

      {/* Oturak */}
      <mesh position={[0, legH, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, seatTh, d]} />
        <primitive object={rattan} attach="material" />
      </mesh>
      {/* Minder */}
      <mesh position={[0, legH + seatTh / 2 + 0.035, 0]} castShadow>
        <boxGeometry args={[w - 0.06, 0.06, d - 0.06]} />
        <primitive object={cushion} attach="material" />
      </mesh>

      {/* Sırt çerçevesi */}
      <mesh position={[0, legH + backH / 2, -d / 2 + 0.04]} castShadow>
        <boxGeometry args={[w, backH, 0.05]} />
        <primitive object={rattan} attach="material" />
      </mesh>
      {/* Sırt — yatay rattan çubukları */}
      {[0.10, 0.22, 0.34, 0.46].map((h, i) => (
        <mesh key={`b-${i}`} position={[0, legH + h, -d / 2 + 0.065]} castShadow>
          <boxGeometry args={[w - 0.05, 0.015, 0.015]} />
          <primitive object={rattanDark} attach="material" />
        </mesh>
      ))}

      {/* Ön birleştirici çubuklar (alt) */}
      <mesh position={[0, 0.10, d / 2 - 0.04]}>
        <boxGeometry args={[w - 0.05, 0.02, 0.02]} />
        <primitive object={rattanDark} attach="material" />
      </mesh>
      <mesh position={[0, 0.10, -d / 2 + 0.04]}>
        <boxGeometry args={[w - 0.05, 0.02, 0.02]} />
        <primitive object={rattanDark} attach="material" />
      </mesh>
    </group>
  )
}
