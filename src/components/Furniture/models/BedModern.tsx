import * as THREE from 'three'

const frame  = new THREE.MeshLambertMaterial({ color: 0x3a3a3a })
const head   = new THREE.MeshLambertMaterial({ color: 0x4a4a4a })
const sheet  = new THREE.MeshLambertMaterial({ color: 0xecebe7 })
const duvet  = new THREE.MeshLambertMaterial({ color: 0x8a9aab })
const pillow = new THREE.MeshLambertMaterial({ color: 0xf4f0e8 })

/** Modern yatak — alçak platform, panel başlık, minimal */
export default function BedModern({ dims }: { dims: Record<string, number> }) {
  const len = (dims.length ?? 200) / 100
  const wid = (dims.width  ?? 160) / 100

  const frameH = 0.18
  const mattH = 0.22
  const duvetH = 0.08
  const headboardH = 0.50

  return (
    <group>
      {/* Platform — taşan kenar (floating) */}
      <mesh position={[0, frameH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[wid + 0.14, frameH, len + 0.14]} />
        <primitive object={frame} attach="material" />
      </mesh>

      {/* Alçak panel başlık */}
      <mesh position={[0, frameH + headboardH / 2, -(len / 2 - 0.02)]} castShadow>
        <boxGeometry args={[wid + 0.14, headboardH, 0.08]} />
        <primitive object={head} attach="material" />
      </mesh>

      {/* Yatak */}
      <mesh position={[0, frameH + mattH / 2, 0]} castShadow>
        <boxGeometry args={[wid, mattH, len - 0.02]} />
        <primitive object={sheet} attach="material" />
      </mesh>

      {/* Yorgan — düz, modern */}
      <mesh position={[0, frameH + mattH + duvetH / 2, len * 0.12]} castShadow>
        <boxGeometry args={[wid + 0.02, duvetH, len * 0.65]} />
        <primitive object={duvet} attach="material" />
      </mesh>

      {/* 2 düz yastık */}
      {[-wid / 4.2, wid / 4.2].map((px, i) => (
        <mesh
          key={i}
          position={[px, frameH + mattH + 0.06, -(len / 2 - 0.28)]}
          castShadow
        >
          <boxGeometry args={[wid * 0.38, 0.08, 0.36]} />
          <primitive object={pillow} attach="material" />
        </mesh>
      ))}
    </group>
  )
}
