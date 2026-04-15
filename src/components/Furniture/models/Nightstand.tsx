import * as THREE from 'three'

const body   = new THREE.MeshLambertMaterial({ color: 0x8a6a48 })
const top    = new THREE.MeshLambertMaterial({ color: 0x6a4e30 })
const drawer = new THREE.MeshLambertMaterial({ color: 0x9c7a56 })
const handle = new THREE.MeshLambertMaterial({ color: 0x3a3028 })
const leg    = new THREE.MeshLambertMaterial({ color: 0x4a382a })

/**
 * Komodin (nightstand) — yatak yanı, 2 çekmeceli, ~55 cm yükseklik.
 * Origin: alt-orta; ayaklar dahildir.
 */
export default function Nightstand({ dims }: { dims: Record<string, number> }) {
  const w = (dims.width  ?? 50) / 100
  const h = (dims.height ?? 55) / 100
  const d = 0.42

  const legH    = 0.10
  const bodyH   = h - legH
  const topT    = 0.03
  const bodyInH = bodyH - topT

  // 2 çekmece
  const drawerCount = 2
  const drawerGap = 0.015
  const drawerH = (bodyInH - drawerGap * (drawerCount + 1)) / drawerCount

  return (
    <group>
      {/* Ayaklar (4 kısa köşe ayağı) */}
      {[
        [-w / 2 + 0.03, -d / 2 + 0.03],
        [ w / 2 - 0.03, -d / 2 + 0.03],
        [-w / 2 + 0.03,  d / 2 - 0.03],
        [ w / 2 - 0.03,  d / 2 - 0.03],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, legH / 2, z]} castShadow>
          <boxGeometry args={[0.05, legH, 0.05]} />
          <primitive object={leg} attach="material" />
        </mesh>
      ))}

      {/* Gövde */}
      <mesh position={[0, legH + bodyInH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, bodyInH, d]} />
        <primitive object={body} attach="material" />
      </mesh>

      {/* Üst tabla */}
      <mesh position={[0, legH + bodyInH + topT / 2, 0]} castShadow>
        <boxGeometry args={[w + 0.02, topT, d + 0.02]} />
        <primitive object={top} attach="material" />
      </mesh>

      {/* Çekmeceler (önde) */}
      {Array.from({ length: drawerCount }).map((_, i) => {
        const dy = legH + drawerGap + drawerH / 2 + i * (drawerH + drawerGap)
        return (
          <group key={i}>
            {/* Çekmece yüzü */}
            <mesh position={[0, dy, d / 2 + 0.002]} castShadow>
              <boxGeometry args={[w - 0.03, drawerH, 0.012]} />
              <primitive object={drawer} attach="material" />
            </mesh>
            {/* Kulp (yatay çubuk) */}
            <mesh position={[0, dy, d / 2 + 0.018]} castShadow>
              <boxGeometry args={[w * 0.35, 0.022, 0.022]} />
              <primitive object={handle} attach="material" />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
