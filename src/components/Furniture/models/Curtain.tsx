import * as THREE from 'three'

const rod     = new THREE.MeshLambertMaterial({ color: 0x8a7050 })
const fabric  = new THREE.MeshLambertMaterial({ color: 0xc0a890, side: THREE.DoubleSide })
const fabricL = new THREE.MeshLambertMaterial({ color: 0xd8c4a8, side: THREE.DoubleSide })

/** Perde — kornişli, dalgalı pleated kumaş */
export default function Curtain({ dims }: { dims: Record<string, number> }) {
  const w = (dims.width ?? 180) / 100
  const h = (dims.height ?? 220) / 100

  const pleats = Math.max(10, Math.round(w / 0.12))

  return (
    <group>
      {/* Korniş çubuğu */}
      <mesh position={[0, h - 0.04, 0.02]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.020, 0.020, w + 0.16, 10]} />
        <primitive object={rod} attach="material" />
      </mesh>
      {/* Korniş uçları */}
      <mesh position={[ (w + 0.16) / 2 + 0.01, h - 0.04, 0.02]}>
        <sphereGeometry args={[0.035, 12, 10]} />
        <primitive object={rod} attach="material" />
      </mesh>
      <mesh position={[-(w + 0.16) / 2 - 0.01, h - 0.04, 0.02]}>
        <sphereGeometry args={[0.035, 12, 10]} />
        <primitive object={rod} attach="material" />
      </mesh>

      {/* Perde pleatleri — ince dikey kumaş panelleri */}
      {Array.from({ length: pleats }, (_, i) => {
        const t = (i / (pleats - 1)) - 0.5   // -0.5..0.5
        const x = t * w
        // Dalgalı: z offset sinüs ile
        const z = Math.sin(i * 1.2) * 0.04
        const pw = (w / pleats) * 1.15
        return (
          <mesh
            key={`p-${i}`}
            position={[x, h / 2 - 0.04, z]}
            rotation={[0, Math.sin(i * 0.7) * 0.08, 0]}
            castShadow
          >
            <boxGeometry args={[pw, h - 0.06, 0.015]} />
            <primitive object={i % 2 === 0 ? fabric : fabricL} attach="material" />
          </mesh>
        )
      })}

      {/* Tiebacks (alt hafif bağlama) — görselde bir band */}
      <mesh position={[0, 0.02, 0.06]}>
        <boxGeometry args={[w * 1.02, 0.04, 0.02]} />
        <primitive object={fabricL} attach="material" />
      </mesh>
    </group>
  )
}
