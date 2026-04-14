import * as THREE from 'three'

const pot     = new THREE.MeshLambertMaterial({ color: 0xa06040 })
const potRim  = new THREE.MeshLambertMaterial({ color: 0x8a4830 })
const soil    = new THREE.MeshLambertMaterial({ color: 0x3a2a18 })
const leaf    = new THREE.MeshLambertMaterial({ color: 0x3a7a2e, side: THREE.DoubleSide })
const leafDk  = new THREE.MeshLambertMaterial({ color: 0x2a5a1e, side: THREE.DoubleSide })
const stem    = new THREE.MeshLambertMaterial({ color: 0x4a3a1a })

/** Saksı bitkisi — katlı pot + birçok yaprak + ince saplar */
export default function Plant({ dims }: { dims: Record<string, number> }) {
  const s = (dims.diameter ?? 40) / 40

  // Deterministik rand
  const rand = (seed: number) => Math.abs(Math.sin(seed * 12.9898 + 78.233) * 43758.5453) % 1

  const leaves = Array.from({ length: 14 }, (_, i) => {
    const angle = (i / 14) * Math.PI * 2 + rand(i) * 0.4
    const height = 0.30 + rand(i * 3) * 0.50
    const radial = 0.05 + rand(i * 7) * 0.18
    const leafLen = 0.18 + rand(i * 11) * 0.14
    const leafW = leafLen * 0.35
    const dark = i % 3 === 0
    return { angle, height, radial, leafLen, leafW, dark }
  })

  return (
    <group scale={[s, s, s]}>
      {/* Saksı gövdesi */}
      <mesh position={[0, 0.14, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.10, 0.28, 16]} />
        <primitive object={pot} attach="material" />
      </mesh>
      {/* Saksı üst kenar halkası */}
      <mesh position={[0, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.028, 16]} />
        <primitive object={potRim} attach="material" />
      </mesh>
      {/* Toprak */}
      <mesh position={[0, 0.295, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.015, 16]} />
        <primitive object={soil} attach="material" />
      </mesh>

      {/* Yapraklar — her biri ince uzun sap + yaprak bıçağı */}
      {leaves.map((l, i) => {
        const cx = Math.cos(l.angle) * l.radial
        const cz = Math.sin(l.angle) * l.radial
        const stemTopY = 0.30 + l.height * 0.5
        const leafY = 0.30 + l.height
        const leafX = Math.cos(l.angle) * (l.radial + l.leafLen * 0.3)
        const leafZ = Math.sin(l.angle) * (l.radial + l.leafLen * 0.3)
        return (
          <group key={i}>
            {/* Sap */}
            <mesh position={[(cx + leafX) / 2, stemTopY - 0.02, (cz + leafZ) / 2]}
              rotation={[0, -l.angle, Math.atan2(l.leafLen * 0.3, l.height) - 0.1]}
              castShadow>
              <cylinderGeometry args={[0.004, 0.006, l.height, 6]} />
              <primitive object={stem} attach="material" />
            </mesh>
            {/* Yaprak bıçağı — düzleştirilmiş küre */}
            <mesh
              position={[leafX, leafY, leafZ]}
              rotation={[rand(i * 5) * 0.3, -l.angle + Math.PI / 2, 0.3 + rand(i * 13) * 0.3]}
              scale={[l.leafLen, 0.02, l.leafW]}
              castShadow
            >
              <sphereGeometry args={[1, 10, 6]} />
              <primitive object={l.dark ? leafDk : leaf} attach="material" />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
