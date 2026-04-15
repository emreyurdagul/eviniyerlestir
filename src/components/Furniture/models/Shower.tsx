import * as THREE from 'three'

const glass     = new THREE.MeshLambertMaterial({ color: 0xb8d8e0, transparent: true, opacity: 0.35 })
const frameMat  = new THREE.MeshLambertMaterial({ color: 0xc8c8cc })
const trayMat   = new THREE.MeshLambertMaterial({ color: 0xeaeae4 })
const chrome    = new THREE.MeshLambertMaterial({ color: 0xb0b0b4 })
const tile      = new THREE.MeshLambertMaterial({ color: 0xcdd8dc })

/** Duşakabin — düz cam panelli, arka duvarlar fayanslı */
export default function Shower({ dims }: { dims: Record<string, number> }) {
  const w = (dims.width ?? 90) / 100
  const d = (dims.depth ?? 90) / 100
  const h = 2.00

  return (
    <group>
      {/* Duş teknesi */}
      <mesh position={[0, 0.04, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.08, d]} />
        <primitive object={trayMat} attach="material" />
      </mesh>
      {/* Süzgeç */}
      <mesh position={[0, 0.081, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.004, 12]} />
        <primitive object={chrome} attach="material" />
      </mesh>

      {/* Arka duvar (fayans) */}
      <mesh position={[0, h / 2, -d / 2 + 0.02]} receiveShadow>
        <boxGeometry args={[w, h, 0.03]} />
        <primitive object={tile} attach="material" />
      </mesh>
      {/* Sol duvar (fayans) */}
      <mesh position={[-w / 2 + 0.02, h / 2, 0]} receiveShadow>
        <boxGeometry args={[0.03, h, d]} />
        <primitive object={tile} attach="material" />
      </mesh>

      {/* Ön cam panel (sabit) */}
      <mesh position={[w / 4, h / 2, d / 2 - 0.02]}>
        <boxGeometry args={[w / 2, h - 0.10, 0.01]} />
        <primitive object={glass} attach="material" />
      </mesh>
      {/* Yan cam panel (sağ) */}
      <mesh position={[w / 2 - 0.02, h / 2, 0]}>
        <boxGeometry args={[0.01, h - 0.10, d]} />
        <primitive object={glass} attach="material" />
      </mesh>

      {/* Üst çerçeve */}
      <mesh position={[w / 4, h, d / 2 - 0.02]} castShadow>
        <boxGeometry args={[w / 2 + 0.04, 0.04, 0.03]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <mesh position={[w / 2 - 0.02, h, 0]} castShadow>
        <boxGeometry args={[0.03, 0.04, d]} />
        <primitive object={frameMat} attach="material" />
      </mesh>

      {/* Kapı kulbu */}
      <mesh position={[-0.02, h / 2, d / 2 - 0.02]} castShadow>
        <boxGeometry args={[0.04, 0.24, 0.03]} />
        <primitive object={chrome} attach="material" />
      </mesh>

      {/* Duş başlığı (arka duvar üst) */}
      <mesh position={[-w / 4, h - 0.30, -d / 2 + 0.06]} rotation={[Math.PI / 2.6, 0, 0]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.30, 10]} />
        <primitive object={chrome} attach="material" />
      </mesh>
      <mesh position={[-w / 4, h - 0.42, -d / 2 + 0.16]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.03, 16]} />
        <primitive object={chrome} attach="material" />
      </mesh>

      {/* Batarya (karıştırıcı) */}
      <mesh position={[-w / 4, 1.10, -d / 2 + 0.08]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.12, 12]} />
        <primitive object={chrome} attach="material" />
      </mesh>
    </group>
  )
}
