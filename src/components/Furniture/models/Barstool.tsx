import * as THREE from 'three'

const seatMat  = new THREE.MeshLambertMaterial({ color: 0x3a3a3a })
const legMat   = new THREE.MeshLambertMaterial({ color: 0xb0b0b4 })
const footRest = new THREE.MeshLambertMaterial({ color: 0xc8c8cc })

/** Bar Taburesi — modern (tek metal ayak, yuvarlak oturak) */
export default function Barstool({ dims }: { dims: Record<string, number> }) {
  const s = (dims.diameter ?? 38) / 100
  const seatH = 0.75  // standart bar oturma yüksekliği

  return (
    <group>
      {/* Taban disk */}
      <mesh position={[0, 0.015, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[s / 2 * 0.95, s / 2 * 1.0, 0.03, 20]} />
        <primitive object={legMat} attach="material" />
      </mesh>

      {/* Orta kolon (konik) */}
      <mesh position={[0, seatH / 2 + 0.02, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.055, seatH - 0.04, 16]} />
        <primitive object={legMat} attach="material" />
      </mesh>

      {/* Ayak desteği halkası */}
      <mesh position={[0, 0.22, 0]}>
        <torusGeometry args={[s / 2 * 0.85, 0.012, 8, 20]} />
        <primitive object={footRest} attach="material" />
      </mesh>

      {/* Oturak (yuvarlak) */}
      <mesh position={[0, seatH + 0.02, 0]} castShadow>
        <cylinderGeometry args={[s / 2, s / 2, 0.05, 24]} />
        <primitive object={seatMat} attach="material" />
      </mesh>
      {/* Oturak üst yastık */}
      <mesh position={[0, seatH + 0.05, 0]} castShadow>
        <cylinderGeometry args={[s / 2 - 0.015, s / 2 - 0.01, 0.03, 24]} />
        <primitive object={seatMat} attach="material" />
      </mesh>

      {/* Arkalık (alçak, opsiyonel hafif kavisli) */}
      <mesh position={[0, seatH + 0.22, -s / 2 + 0.04]} rotation={[-0.1, 0, 0]} castShadow>
        <boxGeometry args={[s * 0.8, 0.28, 0.04]} />
        <primitive object={seatMat} attach="material" />
      </mesh>
    </group>
  )
}
