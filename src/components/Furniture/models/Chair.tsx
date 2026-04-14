import * as THREE from 'three'

const fabric      = new THREE.MeshLambertMaterial({ color: 0xc9b896 })
const fabricLight = new THREE.MeshLambertMaterial({ color: 0xd9c9a8 })
const fabricBack  = new THREE.MeshLambertMaterial({ color: 0xb8a582 })
const wood        = new THREE.MeshLambertMaterial({ color: 0x2a1a08 })
const pillow      = new THREE.MeshLambertMaterial({ color: 0x8a6a4a })

/**
 * Tekli koltuk (berjer) — kare proporsiyonlu, kollu, minderli.
 * diameter = toplam genişlik & derinlik (yaklaşık)
 */
export default function Chair({ dims }: { dims: Record<string, number> }) {
  const s = (dims.diameter ?? 90) / 100
  const dep = s
  const len = s

  const sitH = 0.42
  const backH = 0.46
  const armW = 0.14
  const armH = 0.26
  const legH = 0.08

  const seatW = len - armW * 2
  const seatD = dep - 0.10

  return (
    <group>
      {/* Ayaklar */}
      {[
        [-(len / 2 - 0.10), -(dep / 2 - 0.10)],
        [ (len / 2 - 0.10), -(dep / 2 - 0.10)],
        [-(len / 2 - 0.10),  (dep / 2 - 0.10)],
        [ (len / 2 - 0.10),  (dep / 2 - 0.10)],
      ].map(([px, pz], i) => (
        <mesh key={i} position={[px, legH / 2, pz]} castShadow>
          <boxGeometry args={[0.05, legH, 0.05]} />
          <primitive object={wood} attach="material" />
        </mesh>
      ))}

      {/* Alt taban */}
      <mesh position={[0, legH + 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[len - 0.02, 0.10, dep - 0.04]} />
        <primitive object={wood} attach="material" />
      </mesh>

      {/* Oturma minderi */}
      <mesh position={[0, sitH - 0.05, 0.04]} castShadow>
        <boxGeometry args={[seatW, 0.16, seatD]} />
        <primitive object={fabricLight} attach="material" />
      </mesh>
      <mesh position={[0, sitH + 0.04, 0.04]} castShadow>
        <boxGeometry args={[seatW - 0.03, 0.05, seatD - 0.03]} />
        <primitive object={fabric} attach="material" />
      </mesh>

      {/* Sırtlık */}
      <mesh position={[0, sitH + backH / 2, -(dep / 2 - 0.11)]} castShadow>
        <boxGeometry args={[seatW, backH, 0.20]} />
        <primitive object={fabricBack} attach="material" />
      </mesh>
      {/* Sırt yastığı */}
      <mesh position={[0, sitH + backH * 0.55, -(dep / 2 - 0.22)]} rotation={[-0.12, 0, 0]} castShadow>
        <boxGeometry args={[seatW - 0.05, backH * 0.80, 0.13]} />
        <primitive object={fabricLight} attach="material" />
      </mesh>

      {/* Kollar */}
      {[-1, 1].map(side => (
        <group key={side}>
          <mesh position={[side * (len / 2 - armW / 2), sitH - 0.05 + armH / 2 + 0.04, 0]} castShadow>
            <boxGeometry args={[armW, armH + 0.10, dep - 0.04]} />
            <primitive object={fabric} attach="material" />
          </mesh>
          <mesh position={[side * (len / 2 - armW / 2), sitH + armH + 0.02, 0]} castShadow>
            <boxGeometry args={[armW - 0.02, 0.06, dep - 0.08]} />
            <primitive object={fabricLight} attach="material" />
          </mesh>
        </group>
      ))}

      {/* Dekoratif yastık */}
      <mesh position={[0, sitH + 0.20, 0.22]} rotation={[0, 0.2, 0.15]} castShadow>
        <boxGeometry args={[0.28, 0.24, 0.10]} />
        <primitive object={pillow} attach="material" />
      </mesh>
    </group>
  )
}
