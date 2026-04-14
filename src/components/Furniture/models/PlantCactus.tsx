import * as THREE from 'three'

const pot    = new THREE.MeshLambertMaterial({ color: 0xc8a888 })
const potRim = new THREE.MeshLambertMaterial({ color: 0x8a6848 })
const sand   = new THREE.MeshLambertMaterial({ color: 0xd8c090 })
const cac    = new THREE.MeshLambertMaterial({ color: 0x4a7a3a })
const cacDk  = new THREE.MeshLambertMaterial({ color: 0x3a6a2a })
const flower = new THREE.MeshLambertMaterial({ color: 0xd85060 })

/** Kaktüs — ana gövde + yan kollar + çiçek */
export default function PlantCactus({ dims }: { dims: Record<string, number> }) {
  const s = (dims.diameter ?? 40) / 40

  return (
    <group scale={[s, s, s]}>
      {/* Saksı */}
      <mesh position={[0, 0.10, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.11, 0.20, 14]} />
        <primitive object={pot} attach="material" />
      </mesh>
      <mesh position={[0, 0.20, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.025, 14]} />
        <primitive object={potRim} attach="material" />
      </mesh>
      {/* Kum */}
      <mesh position={[0, 0.215, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.01, 14]} />
        <primitive object={sand} attach="material" />
      </mesh>

      {/* Ana gövde — dikey silindir */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.10, 0.70, 14]} />
        <primitive object={cac} attach="material" />
      </mesh>
      {/* Dikey dikenler (strip'ler) */}
      {[0, 1, 2, 3, 4, 5].map(i => {
        const a = (i / 6) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.085, 0.55, Math.sin(a) * 0.085]}>
            <boxGeometry args={[0.008, 0.65, 0.008]} />
            <primitive object={cacDk} attach="material" />
          </mesh>
        )
      })}

      {/* Sol kol */}
      <mesh position={[-0.12, 0.60, 0]} rotation={[0, 0, 0.5]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 0.30, 12]} />
        <primitive object={cac} attach="material" />
      </mesh>
      <mesh position={[-0.20, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.22, 12]} />
        <primitive object={cac} attach="material" />
      </mesh>

      {/* Sağ kol (daha kısa) */}
      <mesh position={[0.10, 0.72, 0]} rotation={[0, 0, -0.4]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.22, 12]} />
        <primitive object={cac} attach="material" />
      </mesh>

      {/* Tepe çiçeği */}
      <mesh position={[0, 0.93, 0]} castShadow>
        <sphereGeometry args={[0.04, 10, 8]} />
        <primitive object={flower} attach="material" />
      </mesh>
      <mesh position={[-0.20, 0.88, 0]} castShadow>
        <sphereGeometry args={[0.03, 8, 6]} />
        <primitive object={flower} attach="material" />
      </mesh>
    </group>
  )
}
