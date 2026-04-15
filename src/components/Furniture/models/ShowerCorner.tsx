import * as THREE from 'three'

const glass     = new THREE.MeshLambertMaterial({ color: 0xb8d8e0, transparent: true, opacity: 0.35 })
const frameMat  = new THREE.MeshLambertMaterial({ color: 0xc8c8cc })
const trayMat   = new THREE.MeshLambertMaterial({ color: 0xeaeae4 })
const chrome    = new THREE.MeshLambertMaterial({ color: 0xb0b0b4 })
const tile      = new THREE.MeshLambertMaterial({ color: 0xcdd8dc })

/** Duşakabin — köşe tipi yuvarlatılmış, çeyrek daire cam */
export default function ShowerCorner({ dims }: { dims: Record<string, number> }) {
  const w = (dims.width ?? 90) / 100
  const d = (dims.depth ?? 90) / 100
  const h = 2.00

  // Yaklaşık çeyrek daire etkisi — iki açılı cam panel
  return (
    <group>
      {/* Köşe teknesi (çeyrek daire yaklaşık kare) */}
      <mesh position={[0, 0.04, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[w / 2, w / 2, 0.08, 24, 1, false, 0, Math.PI / 2]} />
        <primitive object={trayMat} attach="material" />
      </mesh>

      {/* Arka duvar (fayans) */}
      <mesh position={[0, h / 2, -d / 2 + 0.02]} receiveShadow>
        <boxGeometry args={[w, h, 0.03]} />
        <primitive object={tile} attach="material" />
      </mesh>
      <mesh position={[-w / 2 + 0.02, h / 2, 0]} receiveShadow>
        <boxGeometry args={[0.03, h, d]} />
        <primitive object={tile} attach="material" />
      </mesh>

      {/* Açılı cam panel 1 */}
      <mesh position={[0.10, h / 2, d / 2 - 0.10]} rotation={[0, -0.4, 0]}>
        <boxGeometry args={[w * 0.80, h - 0.10, 0.01]} />
        <primitive object={glass} attach="material" />
      </mesh>
      {/* Açılı cam panel 2 */}
      <mesh position={[w / 2 - 0.10, 0.40 + h / 2 - 0.40, 0.10]} rotation={[0, -Math.PI / 2 + 0.4, 0]}>
        <boxGeometry args={[d * 0.80, h - 0.10, 0.01]} />
        <primitive object={glass} attach="material" />
      </mesh>

      {/* Üst çerçeve köşe */}
      <mesh position={[0.10, h, d / 2 - 0.10]} rotation={[0, -0.4, 0]} castShadow>
        <boxGeometry args={[w * 0.80, 0.04, 0.03]} />
        <primitive object={frameMat} attach="material" />
      </mesh>

      {/* Duş başlığı */}
      <mesh position={[-w / 3, h - 0.30, -d / 2 + 0.06]} rotation={[Math.PI / 2.6, 0, 0]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.30, 10]} />
        <primitive object={chrome} attach="material" />
      </mesh>
      <mesh position={[-w / 3, h - 0.42, -d / 2 + 0.16]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.03, 16]} />
        <primitive object={chrome} attach="material" />
      </mesh>

      {/* Batarya */}
      <mesh position={[-w / 3, 1.10, -d / 2 + 0.08]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.12, 12]} />
        <primitive object={chrome} attach="material" />
      </mesh>
    </group>
  )
}
