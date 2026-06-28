import * as THREE from 'three'

const matBody   = new THREE.MeshLambertMaterial({ color: 0xf6f6f4 })
const matFront  = new THREE.MeshLambertMaterial({ color: 0xececeb })
const matVent   = new THREE.MeshLambertMaterial({ color: 0x262626 })
const matFlap   = new THREE.MeshLambertMaterial({ color: 0xdedede })
const matSlat   = new THREE.MeshLambertMaterial({ color: 0xdadad8 })
const matGrille = new THREE.MeshLambertMaterial({ color: 0xc2c2c0 })
const matLed    = new THREE.MeshBasicMaterial({ color: 0x35d07f })

/**
 * Klima — split duvar ünitesi. Variant yok.
 * Yatay dikdörtgen beyaz gövde; üstte hava emiş ızgaraları, altta koyu hava
 * çıkış kanalı + ince eğik yönlendirme kanadı, yan yüzlerde ızgaralar.
 * Origin alt-orta (y=0 zemin); duvara montaj yOffset ile dışarıda yapılır.
 */
export default function AirConditioner({ dims }: { dims: Record<string, number>; variant?: string }) {
  const w = (dims.width ?? 90) / 100
  const h = 0.30
  const d = 0.20

  // Üst yüzeydeki yatay emiş ızgara çizgileri (arkadan öne doğru)
  const intakeZ = [-0.05, -0.025, 0, 0.025, 0.05]
  // Yan yüzlerdeki dikey ızgara dilimleri
  const grilleZ = [-0.05, -0.02, 0.01, 0.04]

  return (
    <group>
      {/* Ana gövde */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <primitive object={matBody} attach="material" />
      </mesh>

      {/* Hafif çıkıntılı ön yüz paneli */}
      <mesh position={[0, h * 0.55, d / 2 + 0.006]} castShadow>
        <boxGeometry args={[w - 0.02, h * 0.78, 0.012]} />
        <primitive object={matFront} attach="material" />
      </mesh>

      {/* Üst emiş ızgaraları */}
      {intakeZ.map((z, i) => (
        <mesh key={`in-${i}`} position={[0, h - 0.004, z]}>
          <boxGeometry args={[w - 0.05, 0.004, 0.01]} />
          <primitive object={matSlat} attach="material" />
        </mesh>
      ))}

      {/* Alt koyu hava çıkış kanalı (ağız) */}
      <mesh position={[0, 0.045, d / 2 - 0.002]}>
        <boxGeometry args={[w - 0.06, 0.06, 0.02]} />
        <primitive object={matVent} attach="material" />
      </mesh>

      {/* İnce eğik hava yönlendirme kanadı (louver) */}
      <mesh position={[0, 0.03, d / 2 + 0.03]} rotation={[-0.6, 0, 0]} castShadow>
        <boxGeometry args={[w - 0.08, 0.07, 0.008]} />
        <primitive object={matFlap} attach="material" />
      </mesh>

      {/* Yan ızgaralar (sol + sağ uç) */}
      {[-1, 1].map((side) =>
        grilleZ.map((z, i) => (
          <mesh
            key={`g-${side}-${i}`}
            position={[side * (w / 2 + 0.001), h * 0.55, z]}
            castShadow
          >
            <boxGeometry args={[0.006, h * 0.6, 0.012]} />
            <primitive object={matGrille} attach="material" />
          </mesh>
        )),
      )}

      {/* Çalışma LED'i (ön sağ alt) */}
      <mesh position={[w * 0.34, 0.085, d / 2 + 0.012]}>
        <boxGeometry args={[0.02, 0.012, 0.004]} />
        <primitive object={matLed} attach="material" />
      </mesh>
    </group>
  )
}
