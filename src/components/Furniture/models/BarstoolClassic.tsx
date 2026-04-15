import * as THREE from 'three'

const wood    = new THREE.MeshLambertMaterial({ color: 0x8a5a34 })
const woodDk  = new THREE.MeshLambertMaterial({ color: 0x6a4020 })
const seatMat = new THREE.MeshLambertMaterial({ color: 0xa07050 })

/** Bar Taburesi — klasik ahşap 4 ayaklı */
export default function BarstoolClassic({ dims }: { dims: Record<string, number> }) {
  const s = (dims.diameter ?? 38) / 100
  const seatH = 0.75
  const legOff = s / 2 - 0.04

  return (
    <group>
      {/* 4 ayak */}
      {[
        [-legOff, -legOff],
        [ legOff, -legOff],
        [-legOff,  legOff],
        [ legOff,  legOff],
      ].map(([px, pz], i) => (
        <mesh key={i} position={[px, seatH / 2, pz]} castShadow>
          <cylinderGeometry args={[0.022, 0.028, seatH, 10]} />
          <primitive object={wood} attach="material" />
        </mesh>
      ))}

      {/* Ayak bağı (ön, yukarda) */}
      <mesh position={[0, 0.28, legOff]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, s - 0.08, 10]} />
        <primitive object={woodDk} attach="material" />
      </mesh>
      {/* Ayak bağı (arka) */}
      <mesh position={[0, 0.28, -legOff]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, s - 0.08, 10]} />
        <primitive object={woodDk} attach="material" />
      </mesh>
      {/* Ayak bağı (sol/sağ) */}
      <mesh position={[-legOff, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, s - 0.08, 10]} />
        <primitive object={woodDk} attach="material" />
      </mesh>
      <mesh position={[ legOff, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, s - 0.08, 10]} />
        <primitive object={woodDk} attach="material" />
      </mesh>

      {/* Oturak kare ahşap */}
      <mesh position={[0, seatH + 0.02, 0]} castShadow>
        <boxGeometry args={[s, 0.04, s]} />
        <primitive object={seatMat} attach="material" />
      </mesh>

      {/* Düşük sırtlık dikmeleri + yatay */}
      <mesh position={[-legOff + 0.02, seatH + 0.20, -legOff]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.38, 8]} />
        <primitive object={wood} attach="material" />
      </mesh>
      <mesh position={[ legOff - 0.02, seatH + 0.20, -legOff]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.38, 8]} />
        <primitive object={wood} attach="material" />
      </mesh>
      <mesh position={[0, seatH + 0.36, -legOff]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, s - 0.04, 10]} />
        <primitive object={wood} attach="material" />
      </mesh>
    </group>
  )
}
