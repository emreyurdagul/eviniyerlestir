import * as THREE from 'three'

const wood     = new THREE.MeshLambertMaterial({ color: 0xd8bc96 })
const woodL    = new THREE.MeshLambertMaterial({ color: 0xe8ccaa })

/** Skandinav yemek sandalyesi — açık ahşap, eğimli geniş sırtlık */
export default function DiningChairScandi({ dims: _dims }: { dims: Record<string, number> }) {
  const seatW = 0.45, seatD = 0.44, seatH = 0.44
  const backH = 0.46
  const legT = 0.030

  return (
    <group>
      {/* Ayaklar — dışa eğimli */}
      {[[-seatW/2+legT/2, -seatD/2+legT/2, 0.08, 0.08],
        [seatW/2-legT/2, -seatD/2+legT/2, -0.08, 0.08],
        [-seatW/2+legT/2, seatD/2-legT/2, 0.08, -0.08],
        [seatW/2-legT/2, seatD/2-legT/2, -0.08, -0.08]].map(([x, z, rx, rz], i) => (
        <mesh key={i} position={[x as number, seatH / 2, z as number]} rotation={[rz as number * 0.2, 0, rx as number * 0.2]} castShadow>
          <cylinderGeometry args={[legT / 2 * 0.8, legT / 2, seatH, 8]} />
          <primitive object={wood} attach="material" />
        </mesh>
      ))}

      {/* Ahşap oturma yüzeyi — hafif oyuk */}
      <mesh position={[0, seatH, 0]} castShadow>
        <boxGeometry args={[seatW, 0.04, seatD]} />
        <primitive object={woodL} attach="material" />
      </mesh>
      <mesh position={[0, seatH - 0.025, 0]}>
        <boxGeometry args={[seatW - 0.08, 0.02, seatD - 0.08]} />
        <primitive object={wood} attach="material" />
      </mesh>

      {/* Eğimli geniş sırtlık (tek parça) */}
      <mesh
        position={[0, seatH + backH / 2, -seatD / 2 + 0.08]}
        rotation={[-0.18, 0, 0]}
        castShadow
      >
        <boxGeometry args={[seatW - 0.02, backH, 0.024]} />
        <primitive object={woodL} attach="material" />
      </mesh>
      {/* Sırtlık ortasında eliptik delik (scandi minimalizm) */}
      <mesh
        position={[0, seatH + backH / 2 + 0.04, -seatD / 2 + 0.08 + 0.002]}
        rotation={[-0.18, 0, 0]}
      >
        <torusGeometry args={[0.08, 0.008, 8, 18]} />
        <primitive object={wood} attach="material" />
      </mesh>
    </group>
  )
}
