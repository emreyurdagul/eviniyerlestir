import * as THREE from 'three'

const glass  = new THREE.MeshLambertMaterial({ color: 0xd8e4e8, transparent: true, opacity: 0.45 })
const metal  = new THREE.MeshLambertMaterial({ color: 0x303030 })
const metalL = new THREE.MeshLambertMaterial({ color: 0x505050 })

/** Modern cam yemek masası — cam tabla, X metal ayak yapı */
export default function DiningTableGlass({ dims }: { dims: Record<string, number> }) {
  const len = (dims.length ?? 180) / 100
  const wid = (dims.width ?? 90) / 100
  const tableH = 0.74

  return (
    <group>
      {/* Cam tabla */}
      <mesh position={[0, tableH, 0]} castShadow receiveShadow>
        <boxGeometry args={[len, 0.018, wid]} />
        <primitive object={glass} attach="material" />
      </mesh>
      {/* Cam kenar metal şerit */}
      <mesh position={[0, tableH, 0]}>
        <boxGeometry args={[len + 0.01, 0.022, wid + 0.01]} />
        <primitive object={metalL} attach="material" />
      </mesh>

      {/* İki uçta metal çerçeveler (A-shape) */}
      {[-1, 1].map(s => (
        <group key={s} position={[s * (len / 2 - 0.10), 0, 0]}>
          {/* İki çapraz ayak (X) */}
          <mesh rotation={[0, 0, 0.55]} position={[0, tableH / 2, -wid * 0.3]} castShadow>
            <boxGeometry args={[0.035, tableH + 0.05, 0.035]} />
            <primitive object={metal} attach="material" />
          </mesh>
          <mesh rotation={[0, 0, -0.55]} position={[0, tableH / 2, -wid * 0.3]} castShadow>
            <boxGeometry args={[0.035, tableH + 0.05, 0.035]} />
            <primitive object={metal} attach="material" />
          </mesh>
          <mesh rotation={[0, 0, 0.55]} position={[0, tableH / 2, wid * 0.3]} castShadow>
            <boxGeometry args={[0.035, tableH + 0.05, 0.035]} />
            <primitive object={metal} attach="material" />
          </mesh>
          <mesh rotation={[0, 0, -0.55]} position={[0, tableH / 2, wid * 0.3]} castShadow>
            <boxGeometry args={[0.035, tableH + 0.05, 0.035]} />
            <primitive object={metal} attach="material" />
          </mesh>
          {/* Alt yatay bağ */}
          <mesh position={[0, 0.02, 0]} castShadow>
            <boxGeometry args={[0.05, 0.035, wid * 0.7]} />
            <primitive object={metal} attach="material" />
          </mesh>
        </group>
      ))}
      {/* Uçlar arası alt streç */}
      <mesh position={[0, tableH * 0.2, 0]}>
        <boxGeometry args={[len - 0.28, 0.03, 0.03]} />
        <primitive object={metal} attach="material" />
      </mesh>
    </group>
  )
}
