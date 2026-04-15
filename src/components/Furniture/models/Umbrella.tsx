import * as THREE from 'three'

const pole     = new THREE.MeshLambertMaterial({ color: 0x8a7250 })
const canvasA  = new THREE.MeshLambertMaterial({ color: 0xd8c080, side: THREE.DoubleSide })
const canvasB  = new THREE.MeshLambertMaterial({ color: 0xc8a870, side: THREE.DoubleSide })
const baseMat  = new THREE.MeshLambertMaterial({ color: 0x2e2e2e })

/** Büyük güneş şemsiyesi — direk + 8 kanatlı açılmış tepe */
export default function Umbrella({ dims }: { dims: Record<string, number> }) {
  const diameter = (dims.diameter ?? 250) / 100
  const r = diameter / 2
  const poleH = 2.30
  const segs = 8

  return (
    <group>
      {/* Ağır taban */}
      <mesh position={[0, 0.04, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.32, 0.35, 0.08, 24]} />
        <primitive object={baseMat} attach="material" />
      </mesh>
      <mesh position={[0, 0.10, 0]}>
        <cylinderGeometry args={[0.22, 0.26, 0.05, 20]} />
        <primitive object={baseMat} attach="material" />
      </mesh>

      {/* Direk (alt) */}
      <mesh position={[0, poleH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.03, poleH, 12]} />
        <primitive object={pole} attach="material" />
      </mesh>

      {/* Merkez hub (kanatların birleştiği yer) */}
      <mesh position={[0, poleH + 0.02, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.05, 12]} />
        <primitive object={pole} attach="material" />
      </mesh>

      {/* Açılmış kanatlar — üçgen pleatler */}
      {Array.from({ length: segs }, (_, i) => {
        const theta = (i / segs) * Math.PI * 2
        // Kanat üçgeni: merkez → uç (hafif eğim)
        const midX = Math.cos(theta) * r * 0.5
        const midZ = Math.sin(theta) * r * 0.5
        return (
          <group key={`seg-${i}`} position={[midX, poleH - 0.02, midZ]}>
            <mesh rotation={[0.15, -theta + Math.PI / 2, 0]} castShadow>
              <boxGeometry args={[r * 0.55, 0.008, r * 0.96]} />
              <primitive object={i % 2 === 0 ? canvasA : canvasB} attach="material" />
            </mesh>
          </group>
        )
      })}

      {/* Uç tepe süsü */}
      <mesh position={[0, poleH + 0.08, 0]}>
        <cylinderGeometry args={[0.02, 0.03, 0.10, 10]} />
        <primitive object={pole} attach="material" />
      </mesh>

      {/* Kanat uçlarında tırnaklar */}
      {Array.from({ length: segs }, (_, i) => {
        const theta = (i / segs) * Math.PI * 2
        const tipX = Math.cos(theta) * (r - 0.02)
        const tipZ = Math.sin(theta) * (r - 0.02)
        return (
          <mesh key={`tip-${i}`} position={[tipX, poleH - 0.08, tipZ]}>
            <boxGeometry args={[0.03, 0.08, 0.03]} />
            <primitive object={i % 2 === 0 ? canvasB : canvasA} attach="material" />
          </mesh>
        )
      })}
    </group>
  )
}
