import * as THREE from 'three'

const fabric      = new THREE.MeshLambertMaterial({ color: 0xe8ddc8 })
const fabricLight = new THREE.MeshLambertMaterial({ color: 0xf0e6d0 })
const legLight    = new THREE.MeshLambertMaterial({ color: 0x8a6a3a })

/** Minimal koltuk — ince ayaklar, dar kollar, sade dokuma, açık ton */
export default function SofaMinimal({ dims }: { dims: Record<string, number> }) {
  const len = (dims.length ?? 240) / 100
  const dep = 0.84
  const backH = 0.40
  const armW = 0.08
  const legH = 0.18

  const seatW = len - armW * 2

  return (
    <group>
      {/* Uzun ince eğimli ahşap ayaklar */}
      {[
        [-(len / 2 - 0.10), -(dep / 2 - 0.10),  0.15, -0.10],
        [ (len / 2 - 0.10), -(dep / 2 - 0.10), -0.15, -0.10],
        [-(len / 2 - 0.10),  (dep / 2 - 0.10),  0.15,  0.10],
        [ (len / 2 - 0.10),  (dep / 2 - 0.10), -0.15,  0.10],
      ].map(([px, pz, rx, rz], i) => (
        <mesh key={i} position={[px as number, legH / 2, pz as number]} rotation={[rx as number * 0.1, 0, rz as number * 0.1]} castShadow>
          <cylinderGeometry args={[0.018, 0.010, legH, 10]} />
          <primitive object={legLight} attach="material" />
        </mesh>
      ))}

      {/* Oturma gövdesi — ince, hafif */}
      <mesh position={[0, legH + 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[len - 0.02, 0.16, dep - 0.04]} />
        <primitive object={fabric} attach="material" />
      </mesh>
      {/* Oturma minderi */}
      <mesh position={[0, legH + 0.18, 0.03]} castShadow>
        <boxGeometry args={[seatW - 0.02, 0.08, dep - 0.12]} />
        <primitive object={fabricLight} attach="material" />
      </mesh>

      {/* Sırtlık — çok ince, sade */}
      <mesh position={[0, legH + 0.22 + backH / 2, -(dep / 2 - 0.08)]} castShadow>
        <boxGeometry args={[seatW, backH, 0.10]} />
        <primitive object={fabric} attach="material" />
      </mesh>
      {/* 2 sırt yastığı */}
      {[-1, 1].map(i => (
        <mesh
          key={i}
          position={[(seatW / 4) * i, legH + 0.22 + backH * 0.5, -(dep / 2 - 0.16)]}
          rotation={[-0.08, 0, 0]}
          castShadow
        >
          <boxGeometry args={[seatW / 2 - 0.06, backH * 0.78, 0.10]} />
          <primitive object={fabricLight} attach="material" />
        </mesh>
      ))}

      {/* İnce düz kollar */}
      {[-1, 1].map(s => (
        <mesh key={s} position={[s * (len / 2 - armW / 2), legH + 0.12 + 0.18, 0]} castShadow>
          <boxGeometry args={[armW, 0.36, dep - 0.08]} />
          <primitive object={fabric} attach="material" />
        </mesh>
      ))}
    </group>
  )
}
