import * as THREE from 'three'
import type { ReactElement } from 'react'

const stone   = new THREE.MeshLambertMaterial({ color: 0xb0a898 })
const stoneDk = new THREE.MeshLambertMaterial({ color: 0x7c7464 })
const metal   = new THREE.MeshLambertMaterial({ color: 0x2a2a2e })
const metalLt = new THREE.MeshLambertMaterial({ color: 0x4a4a50 })

/** Bahçe kapısı — 2 taş sütun + tepede kemer + demir kanatlar */
export default function Gate({ dims }: { dims: Record<string, number> }) {
  const width  = (dims.width ?? 150) / 100
  const height = 2.20
  const colW = 0.20

  // Kapı kanadı boyutu (iki sütun arası)
  const doorW = width / 2 - 0.02
  const doorH = height - 0.50

  // Demir dikey çubuklar (her kanatta)
  const bars: ReactElement[] = []
  const barCount = 5
  for (let side = 0; side < 2; side++) {
    const baseX = side === 0 ? -doorW / 2 - 0.01 : doorW / 2 + 0.01
    for (let i = 0; i < barCount; i++) {
      const lx = baseX + (i - (barCount - 1) / 2) * (doorW / (barCount + 1))
      bars.push(
        <mesh
          key={`b-${side}-${i}`}
          position={[lx, doorH / 2 + 0.10, 0]}
          castShadow
        >
          <cylinderGeometry args={[0.012, 0.012, doorH - 0.10, 8]} />
          <primitive object={metal} attach="material" />
        </mesh>
      )
    }
  }

  return (
    <group>
      {/* Sol taş sütun */}
      <mesh position={[-width / 2 - colW / 2, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[colW, height, colW]} />
        <primitive object={stone} attach="material" />
      </mesh>
      <mesh position={[-width / 2 - colW / 2, height + 0.05, 0]} castShadow>
        <boxGeometry args={[colW + 0.06, 0.08, colW + 0.06]} />
        <primitive object={stoneDk} attach="material" />
      </mesh>
      {/* Sağ taş sütun */}
      <mesh position={[width / 2 + colW / 2, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[colW, height, colW]} />
        <primitive object={stone} attach="material" />
      </mesh>
      <mesh position={[width / 2 + colW / 2, height + 0.05, 0]} castShadow>
        <boxGeometry args={[colW + 0.06, 0.08, colW + 0.06]} />
        <primitive object={stoneDk} attach="material" />
      </mesh>

      {/* Üst kemer (düz kemer — kalın yatay blok) */}
      <mesh position={[0, height + 0.05, 0]} castShadow>
        <boxGeometry args={[width + colW * 2 + 0.04, 0.08, colW * 0.8]} />
        <primitive object={stoneDk} attach="material" />
      </mesh>
      {/* Kemer altı dekoratif eğri (yuvarlak gövde yanılsaması) */}
      <mesh position={[0, height + 0.02, 0]} castShadow>
        <cylinderGeometry args={[width / 2 + 0.02, width / 2 + 0.02, 0.04, 18, 1, false, Math.PI, Math.PI]} />
        <primitive object={stone} attach="material" />
      </mesh>

      {/* Kapı çerçevesi — üst kiriş */}
      <mesh position={[0, doorH + 0.12, 0]} castShadow>
        <boxGeometry args={[width - 0.02, 0.05, 0.05]} />
        <primitive object={metalLt} attach="material" />
      </mesh>
      {/* Kapı alt kiriş */}
      <mesh position={[0, 0.08, 0]} castShadow>
        <boxGeometry args={[width - 0.02, 0.05, 0.05]} />
        <primitive object={metalLt} attach="material" />
      </mesh>
      {/* Kapı ortası (iki kanat ayrımı) */}
      <mesh position={[0, doorH / 2 + 0.10, 0]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, doorH, 8]} />
        <primitive object={metalLt} attach="material" />
      </mesh>

      {/* Dikey demir çubuklar */}
      {bars}

      {/* Kol (kapı tokmağı) */}
      <mesh position={[-0.08, doorH / 2, 0.05]} castShadow>
        <cylinderGeometry args={[0.020, 0.020, 0.04, 10]} />
        <primitive object={metalLt} attach="material" />
      </mesh>
      <mesh position={[0.08, doorH / 2, 0.05]} castShadow>
        <cylinderGeometry args={[0.020, 0.020, 0.04, 10]} />
        <primitive object={metalLt} attach="material" />
      </mesh>
    </group>
  )
}
