import * as THREE from 'three'

const wood    = new THREE.MeshLambertMaterial({ color: 0x2a1a08 })
const fabric  = new THREE.MeshLambertMaterial({ color: 0xa68060 })
const fabricL = new THREE.MeshLambertMaterial({ color: 0xb89070 })

/** Modern yastıklı yemek sandalyesi — tamamen kumaş kaplı, arka yastıklı */
export default function DiningChairUpholstered({ dims: _dims }: { dims: Record<string, number> }) {
  const seatW = 0.46, seatD = 0.48, seatH = 0.44
  const backH = 0.52
  const legT = 0.028

  return (
    <group>
      {/* İnce ahşap ayaklar */}
      {[[-seatW/2+legT/2+0.02, -seatD/2+legT/2+0.02], [seatW/2-legT/2-0.02, -seatD/2+legT/2+0.02],
        [-seatW/2+legT/2+0.02, seatD/2-legT/2-0.02], [seatW/2-legT/2-0.02, seatD/2-legT/2-0.02]].map(([x, z], i) => (
        <mesh key={i} position={[x, seatH / 2 - 0.03, z]} castShadow>
          <cylinderGeometry args={[legT / 2 * 0.7, legT / 2, seatH - 0.06, 8]} />
          <primitive object={wood} attach="material" />
        </mesh>
      ))}

      {/* Oturma yastığı — kumaş kaplı kalın */}
      <mesh position={[0, seatH, 0]} castShadow>
        <boxGeometry args={[seatW, 0.14, seatD]} />
        <primitive object={fabric} attach="material" />
      </mesh>
      <mesh position={[0, seatH + 0.06, 0]} castShadow>
        <boxGeometry args={[seatW - 0.04, 0.06, seatD - 0.04]} />
        <primitive object={fabricL} attach="material" />
      </mesh>

      {/* Yastıklı sırtlık — tek parça, eğimli */}
      <mesh
        position={[0, seatH + backH / 2 + 0.04, -seatD / 2 + 0.07]}
        rotation={[-0.08, 0, 0]}
        castShadow
      >
        <boxGeometry args={[seatW - 0.02, backH, 0.10]} />
        <primitive object={fabric} attach="material" />
      </mesh>
      {/* Sırtlık iç yastık detay */}
      <mesh
        position={[0, seatH + backH / 2 + 0.04, -seatD / 2 + 0.12]}
        rotation={[-0.08, 0, 0]}
        castShadow
      >
        <boxGeometry args={[seatW - 0.10, backH - 0.08, 0.06]} />
        <primitive object={fabricL} attach="material" />
      </mesh>
    </group>
  )
}
