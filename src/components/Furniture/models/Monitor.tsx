import * as THREE from 'three'

const bezel  = new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
const screen = new THREE.MeshLambertMaterial({ color: 0x2a4a6a })
const stand  = new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
const base   = new THREE.MeshLambertMaterial({ color: 0x3a3a3a })

/** Monitör — masa üstü LCD, stand + ayak */
export default function Monitor({ dims }: { dims: Record<string, number> }) {
  // 24–32 inç aralığı; varsayılan 27 inç ~ 61 cm genişlik
  const diag = (dims.diagonal ?? 27)   // inç
  // Tek inç = 2.54 cm, 16:9 için genişlik ≈ diag * 2.54 * 0.87
  const panelW = (diag * 2.54 * 0.87) / 100
  const panelH = panelW * 9 / 16
  const panelT = 0.025

  const baseY = 0.02
  const standH = panelH * 0.6
  const panelCenterY = baseY + standH + panelH / 2

  return (
    <group>
      {/* Taban — oval */}
      <mesh position={[0, baseY / 2 + 0.005, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.12, 0.14, baseY, 18]} />
        <primitive object={base} attach="material" />
      </mesh>
      <mesh position={[0, baseY + 0.005, 0]} castShadow>
        <boxGeometry args={[0.26, 0.02, 0.18]} />
        <primitive object={base} attach="material" />
      </mesh>

      {/* Stand kolu */}
      <mesh position={[0, baseY + standH / 2, 0]} castShadow>
        <boxGeometry args={[0.04, standH, 0.06]} />
        <primitive object={stand} attach="material" />
      </mesh>

      {/* Monitör arkası / çerçeve */}
      <mesh position={[0, panelCenterY, -0.005]} castShadow>
        <boxGeometry args={[panelW, panelH, panelT]} />
        <primitive object={bezel} attach="material" />
      </mesh>

      {/* Ekran (önde ince katman) */}
      <mesh position={[0, panelCenterY, panelT / 2 + 0.001]}>
        <boxGeometry args={[panelW - 0.025, panelH - 0.025, 0.002]} />
        <primitive object={screen} attach="material" />
      </mesh>

      {/* Alt bezel logo şeridi */}
      <mesh position={[0, panelCenterY - panelH / 2 + 0.012, panelT / 2 + 0.002]}>
        <boxGeometry args={[panelW * 0.1, 0.008, 0.001]} />
        <primitive object={stand} attach="material" />
      </mesh>
    </group>
  )
}
