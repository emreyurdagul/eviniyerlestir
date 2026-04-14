import * as THREE from 'three'

const fabric  = new THREE.MeshLambertMaterial({ color: 0x7a5044 })
const fabricL = new THREE.MeshLambertMaterial({ color: 0x8a6054 })
const legWood = new THREE.MeshLambertMaterial({ color: 0x2a1a08 })

/** Kanatlı (wingback) sandalye — yüksek sırt, yan kanatlar, klasik */
export default function ChairWingback({ dims }: { dims: Record<string, number> }) {
  const s = (dims.diameter ?? 90) / 100
  const dep = s * 0.92
  const len = s * 0.86

  const sitH = 0.44
  const backH = 0.82
  const armW = 0.12
  const armH = 0.26
  const legH = 0.10
  const wingT = 0.10

  return (
    <group>
      {/* Ayaklar — turnaj stili */}
      {[
        [-(len / 2 - 0.10), -(dep / 2 - 0.10)],
        [ (len / 2 - 0.10), -(dep / 2 - 0.10)],
        [-(len / 2 - 0.10),  (dep / 2 - 0.10)],
        [ (len / 2 - 0.10),  (dep / 2 - 0.10)],
      ].map(([px, pz], i) => (
        <mesh key={i} position={[px, legH / 2, pz]} castShadow>
          <cylinderGeometry args={[0.030, 0.020, legH, 10]} />
          <primitive object={legWood} attach="material" />
        </mesh>
      ))}

      {/* Alt taban */}
      <mesh position={[0, legH + 0.05, 0]} castShadow>
        <boxGeometry args={[len - 0.02, 0.10, dep - 0.04]} />
        <primitive object={legWood} attach="material" />
      </mesh>

      {/* Oturma minderi */}
      <mesh position={[0, sitH - 0.04, 0.04]} castShadow>
        <boxGeometry args={[len - armW * 2, 0.16, dep - 0.12]} />
        <primitive object={fabricL} attach="material" />
      </mesh>

      {/* Yüksek sırtlık */}
      <mesh position={[0, sitH + backH / 2, -(dep / 2 - 0.08)]} castShadow>
        <boxGeometry args={[len - wingT * 2, backH, 0.18]} />
        <primitive object={fabric} attach="material" />
      </mesh>

      {/* Yan kanatlar (wingback) — sırtlığın üst kısmında öne eğimli */}
      {[-1, 1].map(side => (
        <mesh
          key={side}
          position={[side * (len / 2 - wingT / 2), sitH + backH * 0.65, -(dep / 2 - 0.18)]}
          rotation={[0, side * -0.25, 0]}
          castShadow
        >
          <boxGeometry args={[wingT, backH * 0.55, 0.30]} />
          <primitive object={fabric} attach="material" />
        </mesh>
      ))}

      {/* Yastıklı kollar — aşağı eğimli */}
      {[-1, 1].map(side => (
        <mesh
          key={side}
          position={[side * (len / 2 - armW / 2), sitH + armH * 0.5, 0.02]}
          rotation={[0.10, 0, 0]}
          castShadow
        >
          <boxGeometry args={[armW, armH, dep - 0.12]} />
          <primitive object={fabric} attach="material" />
        </mesh>
      ))}
    </group>
  )
}
