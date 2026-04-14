import * as THREE from 'three'

const matBody  = new THREE.MeshLambertMaterial({ color: 0xf4f4f2 })
const matDoor  = new THREE.MeshLambertMaterial({ color: 0xebebea })
const matGlass = new THREE.MeshLambertMaterial({ color: 0x181818 })
const matRing  = new THREE.MeshLambertMaterial({ color: 0x909090 })
const matPanel = new THREE.MeshLambertMaterial({ color: 0xdddddd })
const matVent  = new THREE.MeshLambertMaterial({ color: 0xcccccc })

export default function Dryer({ dims: _dims }: { dims: Record<string, number> }) {
  return (
    <group>
      {/* Gövde */}
      <mesh position={[0, 0.435, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.60, 0.87, 0.60]} />
        <primitive object={matBody} attach="material" />
      </mesh>

      {/* Kapı yüzü */}
      <mesh position={[0, 0.40, 0.305]}>
        <boxGeometry args={[0.56, 0.76, 0.012]} />
        <primitive object={matDoor} attach="material" />
      </mesh>

      {/* Porthole halka */}
      <mesh position={[0, 0.40, 0.314]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.20, 0.20, 0.008, 24]} />
        <primitive object={matRing} attach="material" />
      </mesh>

      {/* Porthole cam */}
      <mesh position={[0, 0.40, 0.318]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.01, 24]} />
        <primitive object={matGlass} attach="material" />
      </mesh>

      {/* Kontrol paneli */}
      <mesh position={[0, 0.815, 0.305]}>
        <boxGeometry args={[0.54, 0.07, 0.012]} />
        <primitive object={matPanel} attach="material" />
      </mesh>

      {/* Sağ yüz ventilasyon ızgaraları */}
      {[-0.06, 0, 0.06].map((zOff, i) => (
        <mesh key={i} position={[0.305, 0.40 + zOff, 0]}>
          <boxGeometry args={[0.005, 0.04, 0.30]} />
          <primitive object={matVent} attach="material" />
        </mesh>
      ))}
    </group>
  )
}
