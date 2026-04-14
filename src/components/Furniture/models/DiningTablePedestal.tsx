import * as THREE from 'three'

const wood   = new THREE.MeshLambertMaterial({ color: 0xa88060 })
const woodDk = new THREE.MeshLambertMaterial({ color: 0x6a4a2a })

/** Pedestal yemek masası — tek merkez sütun + dört kollu taban */
export default function DiningTablePedestal({ dims }: { dims: Record<string, number> }) {
  const len = (dims.length ?? 180) / 100
  const wid = (dims.width ?? 90) / 100
  const tableH = 0.76
  const diag = Math.min(len, wid) * 0.4

  return (
    <group>
      {/* Oval/yuvarlak tabla (kareye yakın kutu) */}
      <mesh position={[0, tableH, 0]} castShadow receiveShadow>
        <boxGeometry args={[len, 0.04, wid]} />
        <primitive object={wood} attach="material" />
      </mesh>
      <mesh position={[0, tableH - 0.04, 0]} castShadow>
        <boxGeometry args={[len - 0.06, 0.04, wid - 0.06]} />
        <primitive object={woodDk} attach="material" />
      </mesh>

      {/* Merkez sütun */}
      <mesh position={[0, tableH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.10, tableH - 0.08, 20]} />
        <primitive object={woodDk} attach="material" />
      </mesh>
      {/* Sütunda dekoratif halka */}
      <mesh position={[0, tableH * 0.3, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.03, 20]} />
        <primitive object={wood} attach="material" />
      </mesh>

      {/* Dört kollu taban */}
      {[0, 1, 2, 3].map(i => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * diag * 0.5, 0.03, Math.sin(a) * diag * 0.5]}
            rotation={[0, -a, 0]}
            castShadow
          >
            <boxGeometry args={[diag, 0.06, 0.07]} />
            <primitive object={wood} attach="material" />
          </mesh>
        )
      })}
      {/* Merkez topuk */}
      <mesh position={[0, 0.02, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.16, 0.04, 20]} />
        <primitive object={woodDk} attach="material" />
      </mesh>
    </group>
  )
}
