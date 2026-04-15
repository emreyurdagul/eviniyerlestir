import * as THREE from 'three'

const frame = new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
const face  = new THREE.MeshLambertMaterial({ color: 0xf4f0e8 })
const mark  = new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
const hand  = new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
const red   = new THREE.MeshLambertMaterial({ color: 0xc03030 })

/** Duvar saati — yuvarlak, klasik kadran */
export default function WallClock({ dims }: { dims: Record<string, number> }) {
  const diameter = (dims.diameter ?? 35) / 100
  const r = diameter / 2

  return (
    <group>
      {/* Çerçeve */}
      <mesh position={[0, 0, -0.02]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[r, r, 0.04, 28]} />
        <primitive object={frame} attach="material" />
      </mesh>
      {/* Kadran */}
      <mesh position={[0, 0, 0.002]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[r - 0.02, r - 0.02, 0.006, 28]} />
        <primitive object={face} attach="material" />
      </mesh>

      {/* 12 saat işaretçisi */}
      {Array.from({ length: 12 }, (_, i) => {
        const theta = (i / 12) * Math.PI * 2
        const px = Math.sin(theta) * (r - 0.05)
        const py = Math.cos(theta) * (r - 0.05)
        const isMajor = i % 3 === 0
        return (
          <mesh key={`m-${i}`} position={[px, py, 0.008]}>
            <boxGeometry args={[isMajor ? 0.012 : 0.006, isMajor ? 0.035 : 0.020, 0.004]} />
            <primitive object={mark} attach="material" />
          </mesh>
        )
      })}

      {/* Akrep (saat) — yukarı */}
      <mesh position={[0, r * 0.30, 0.010]}>
        <boxGeometry args={[0.012, r * 0.55, 0.004]} />
        <primitive object={hand} attach="material" />
      </mesh>
      {/* Yelkovan (dakika) — sağa yatık */}
      <mesh position={[r * 0.22, r * 0.15, 0.012]} rotation={[0, 0, -1.0]}>
        <boxGeometry args={[0.008, r * 0.85, 0.004]} />
        <primitive object={hand} attach="material" />
      </mesh>
      {/* Saniye — kırmızı */}
      <mesh position={[-r * 0.15, -r * 0.20, 0.014]} rotation={[0, 0, 0.7]}>
        <boxGeometry args={[0.003, r * 0.95, 0.003]} />
        <primitive object={red} attach="material" />
      </mesh>
      {/* Merkez */}
      <mesh position={[0, 0, 0.016]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.006, 12]} />
        <primitive object={red} attach="material" />
      </mesh>
    </group>
  )
}
