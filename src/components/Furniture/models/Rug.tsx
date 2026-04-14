import * as THREE from 'three'

const base    = new THREE.MeshLambertMaterial({ color: 0x98886c })
const border  = new THREE.MeshLambertMaterial({ color: 0x7a6a50 })
const pattern = new THREE.MeshLambertMaterial({ color: 0x6a5a40 })
const accent  = new THREE.MeshLambertMaterial({ color: 0xd8c898 })
const fringe  = new THREE.MeshLambertMaterial({ color: 0x8a7854 })

/** Halı — çerçeve + iç desen + saçaklı uçlar */
export default function Rug({ dims }: { dims: Record<string, number> }) {
  const len = (dims.length ?? 200) / 100
  const wid = (dims.width ?? 150) / 100

  return (
    <group>
      {/* Ana halı */}
      <mesh position={[0, 0.005, 0]} receiveShadow>
        <boxGeometry args={[len, 0.010, wid]} />
        <primitive object={base} attach="material" />
      </mesh>
      {/* Dış çerçeve */}
      <mesh position={[0, 0.011, 0]} receiveShadow>
        <boxGeometry args={[len - 0.08, 0.011, wid - 0.08]} />
        <primitive object={border} attach="material" />
      </mesh>
      {/* İç alan */}
      <mesh position={[0, 0.012, 0]} receiveShadow>
        <boxGeometry args={[len - 0.22, 0.012, wid - 0.22]} />
        <primitive object={base} attach="material" />
      </mesh>

      {/* Merkez madalyon (rhombus) */}
      <mesh position={[0, 0.013, 0]} rotation={[0, Math.PI / 4, 0]} receiveShadow>
        <boxGeometry args={[Math.min(len, wid) * 0.45, 0.013, Math.min(len, wid) * 0.45]} />
        <primitive object={pattern} attach="material" />
      </mesh>
      <mesh position={[0, 0.014, 0]} rotation={[0, Math.PI / 4, 0]} receiveShadow>
        <boxGeometry args={[Math.min(len, wid) * 0.30, 0.014, Math.min(len, wid) * 0.30]} />
        <primitive object={accent} attach="material" />
      </mesh>
      <mesh position={[0, 0.015, 0]} rotation={[0, Math.PI / 4, 0]} receiveShadow>
        <boxGeometry args={[Math.min(len, wid) * 0.18, 0.014, Math.min(len, wid) * 0.18]} />
        <primitive object={pattern} attach="material" />
      </mesh>

      {/* Köşe süsleri — 4 küçük baklava */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <mesh
          key={i}
          position={[sx * (len / 2 - 0.22), 0.013, sz * (wid / 2 - 0.22)]}
          rotation={[0, Math.PI / 4, 0]}
          receiveShadow
        >
          <boxGeometry args={[0.16, 0.013, 0.16]} />
          <primitive object={accent} attach="material" />
        </mesh>
      ))}

      {/* Saçaklar — kısa dikdörtgenler, iki ucunda (len ekseninde) */}
      {[-1, 1].map(s => (
        <group key={s}>
          {Array.from({ length: Math.max(8, Math.round(wid / 0.08)) }, (_, i) => {
            const fringeCount = Math.max(8, Math.round(wid / 0.08))
            const zPos = -wid / 2 + (wid / fringeCount) * (i + 0.5)
            return (
              <mesh
                key={`f-${s}-${i}`}
                position={[s * (len / 2 + 0.015), 0.004, zPos]}
                receiveShadow
              >
                <boxGeometry args={[0.03, 0.008, 0.01]} />
                <primitive object={fringe} attach="material" />
              </mesh>
            )
          })}
        </group>
      ))}
    </group>
  )
}
