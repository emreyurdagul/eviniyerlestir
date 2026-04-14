import * as THREE from 'three'

const wood     = new THREE.MeshLambertMaterial({ color: 0x8a6a4a })
const woodDark = new THREE.MeshLambertMaterial({ color: 0x6a4a2a })
const fabric   = new THREE.MeshLambertMaterial({ color: 0xd8cebc })

/** Yemek sandalyesi — yastıklı oturma, dikey çıta sırtlık */
export default function DiningChair({ dims: _dims }: { dims: Record<string, number> }) {
  const seatW = 0.44, seatD = 0.44, seatH = 0.46
  const backH = 0.50
  const legT = 0.036

  return (
    <group>
      {/* 4 ayak — alt uçları biraz ince, ahşap */}
      {[[-seatW/2+legT/2, -seatD/2+legT/2], [seatW/2-legT/2, -seatD/2+legT/2],
        [-seatW/2+legT/2, seatD/2-legT/2], [seatW/2-legT/2, seatD/2-legT/2]].map(([x, z], i) => (
        <mesh key={i} position={[x, seatH / 2, z]} castShadow>
          <cylinderGeometry args={[legT / 2 * 0.7, legT / 2, seatH, 8]} />
          <primitive object={wood} attach="material" />
        </mesh>
      ))}

      {/* Oturma altı (ahşap çerçeve) */}
      <mesh position={[0, seatH - 0.04, 0]} castShadow>
        <boxGeometry args={[seatW - legT * 0.3, 0.04, seatD - legT * 0.3]} />
        <primitive object={woodDark} attach="material" />
      </mesh>

      {/* Yastıklı oturma */}
      <mesh position={[0, seatH + 0.03, 0]} castShadow>
        <boxGeometry args={[seatW - 0.04, 0.06, seatD - 0.04]} />
        <primitive object={fabric} attach="material" />
      </mesh>

      {/* Sırtlık arka dikey dikmeler (iki tane) */}
      {[-seatW / 2 + legT / 2, seatW / 2 - legT / 2].map((x, i) => (
        <mesh key={`b-${i}`} position={[x, seatH + backH / 2, -seatD / 2 + legT / 2]} castShadow>
          <cylinderGeometry args={[legT / 2 * 0.6, legT / 2 * 0.6, backH + 0.04, 8]} />
          <primitive object={wood} attach="material" />
        </mesh>
      ))}

      {/* Sırtlık üst taç */}
      <mesh position={[0, seatH + backH - 0.02, -seatD / 2 + legT / 2]} castShadow>
        <boxGeometry args={[seatW - 0.02, 0.05, 0.04]} />
        <primitive object={woodDark} attach="material" />
      </mesh>

      {/* Sırtlık dikey çıtalar — klasik spindle tarzı */}
      {[-0.12, -0.04, 0.04, 0.12].map((x, i) => (
        <mesh key={`s-${i}`} position={[x, seatH + backH / 2, -seatD / 2 + legT / 2]} castShadow>
          <cylinderGeometry args={[0.008, 0.008, backH - 0.08, 6]} />
          <primitive object={wood} attach="material" />
        </mesh>
      ))}

      {/* Ön + arka sandalye çerçevesi (ayaklar arası bağ) */}
      <mesh position={[0, seatH * 0.4, -seatD / 2 + legT / 2]}>
        <boxGeometry args={[seatW - legT * 2, 0.025, 0.02]} />
        <primitive object={woodDark} attach="material" />
      </mesh>
      <mesh position={[0, seatH * 0.4, seatD / 2 - legT / 2]}>
        <boxGeometry args={[seatW - legT * 2, 0.025, 0.02]} />
        <primitive object={woodDark} attach="material" />
      </mesh>
    </group>
  )
}
