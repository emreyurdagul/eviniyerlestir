import * as THREE from 'three'

const ceramic  = new THREE.MeshLambertMaterial({ color: 0xe0d4c0 })
const ceramicD = new THREE.MeshLambertMaterial({ color: 0xa89680 })
const stemMat  = new THREE.MeshLambertMaterial({ color: 0x3a6a3a })
const flowerA  = new THREE.MeshLambertMaterial({ color: 0xd85a70 })
const flowerB  = new THREE.MeshLambertMaterial({ color: 0xf0e090 })

/** Dekoratif vazo — uzun seramik + çiçekli */
export default function Vase({ dims }: { dims: Record<string, number> }) {
  const diameter = (dims.diameter ?? 20) / 100
  const r = diameter / 2
  const height = (dims.height ?? 45) / 100

  const rand = (seed: number) => Math.abs(Math.sin(seed * 12.9898 + 78.233) * 43758.5453) % 1

  return (
    <group>
      {/* Vazo gövdesi — taban */}
      <mesh position={[0, height * 0.08, 0]} castShadow>
        <cylinderGeometry args={[r * 0.7, r * 0.85, height * 0.16, 20]} />
        <primitive object={ceramicD} attach="material" />
      </mesh>
      {/* Gövde (geniş orta) */}
      <mesh position={[0, height * 0.40, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[r * 1.0, r * 0.7, height * 0.52, 20]} />
        <primitive object={ceramic} attach="material" />
      </mesh>
      {/* Boyun */}
      <mesh position={[0, height * 0.80, 0]} castShadow>
        <cylinderGeometry args={[r * 0.6, r * 0.75, height * 0.25, 20]} />
        <primitive object={ceramic} attach="material" />
      </mesh>
      {/* Ağız halkası */}
      <mesh position={[0, height * 0.98, 0]}>
        <cylinderGeometry args={[r * 0.65, r * 0.60, 0.02, 20]} />
        <primitive object={ceramicD} attach="material" />
      </mesh>

      {/* Saplar ve çiçekler */}
      {Array.from({ length: 5 }, (_, i) => {
        const theta = (i / 5) * Math.PI * 2
        const tilt = 0.15 + rand(i) * 0.15
        const stemH = 0.22 + rand(i * 3) * 0.10
        const tx = Math.cos(theta) * 0.04
        const tz = Math.sin(theta) * 0.04
        return (
          <group key={`f-${i}`} position={[tx, height, tz]} rotation={[Math.sin(theta) * tilt, 0, Math.cos(theta) * tilt]}>
            <mesh position={[0, stemH / 2, 0]} castShadow>
              <cylinderGeometry args={[0.005, 0.005, stemH, 6]} />
              <primitive object={stemMat} attach="material" />
            </mesh>
            <mesh position={[0, stemH + 0.02, 0]} castShadow>
              <sphereGeometry args={[0.035, 10, 8]} />
              <primitive object={i % 2 === 0 ? flowerA : flowerB} attach="material" />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
