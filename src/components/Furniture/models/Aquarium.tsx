import * as THREE from 'three'
import type { ReactElement } from 'react'

const wood     = new THREE.MeshLambertMaterial({ color: 0x8a5a32 })
const woodDark = new THREE.MeshLambertMaterial({ color: 0x5f3d22 })
const woodTrim = new THREE.MeshLambertMaterial({ color: 0x6e4628 })
const frameMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2e })
const glassMat = new THREE.MeshLambertMaterial({ color: 0xbfe4ef, transparent: true, opacity: 0.18 })
const waterMat = new THREE.MeshLambertMaterial({ color: 0x2f86c9, transparent: true, opacity: 0.45 })
const gravelMat = new THREE.MeshLambertMaterial({ color: 0xb9a06a })
const fishA    = new THREE.MeshLambertMaterial({ color: 0xff7a1a })
const fishB    = new THREE.MeshLambertMaterial({ color: 0xf2d12e })
const fishC    = new THREE.MeshLambertMaterial({ color: 0xd63b3b })
const fishD    = new THREE.MeshLambertMaterial({ color: 0x3bb0d6 })

/**
 * Akvaryum — altta ahşap sehpa/dolap (~0.7m), üstünde cam tank.
 * Tankta yarı saydam mavi su, taban çakılı ve birkaç renkli küçük balık.
 * Variant yok. Genişlik = dims.length, toplam yükseklik ~1.2m, derinlik ~0.5m.
 */
export default function Aquarium({ dims }: { dims: Record<string, number>; variant?: string }) {
  const w = (dims.length ?? 120) / 100 // genişlik (m)
  const d = 0.5                        // derinlik (m)

  const standH = 0.7                   // sehpa/dolap yüksekliği
  const tankH = 0.5                    // cam tank yüksekliği → toplam ~1.2m

  const tankW = w * 0.96
  const tankD = d * 0.9
  const tankY = standH + tankH / 2

  const gravelH = 0.05
  const gravelY = standH + gravelH / 2
  const waterH = 0.34
  const waterY = standH + gravelH + waterH / 2

  // Renkli küçük balıklar — su içinde dağılmış (deterministik)
  const fishMats = [fishA, fishB, fishC, fishD, fishA]
  const fish: ReactElement[] = fishMats.map((mat, i) => {
    const theta = (i / fishMats.length) * Math.PI * 2
    const fx = Math.cos(theta) * tankW * 0.3
    const fz = Math.sin(theta) * tankD * 0.25
    const fy = standH + gravelH + 0.06 + (i % 3) * 0.09
    const dir = i % 2 === 0 ? 1 : -1
    return (
      <group key={`fish-${i}`} position={[fx, fy, fz]} rotation={[0, dir > 0 ? 0 : Math.PI, 0]}>
        {/* Gövde (oval) */}
        <mesh scale={[1.6, 1, 1]} castShadow>
          <sphereGeometry args={[0.022, 10, 8]} />
          <primitive object={mat} attach="material" />
        </mesh>
        {/* Kuyruk */}
        <mesh position={[-0.04, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <coneGeometry args={[0.018, 0.03, 8]} />
          <primitive object={mat} attach="material" />
        </mesh>
      </group>
    )
  })

  return (
    <group>
      {/* ─── Sehpa / dolap gövdesi ─── */}
      <mesh position={[0, standH * 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, standH, d]} />
        <primitive object={wood} attach="material" />
      </mesh>
      {/* Dolap kapak ayrım çizgisi */}
      <mesh position={[0, standH * 0.45, d / 2 + 0.006]}>
        <boxGeometry args={[0.012, standH * 0.8, 0.004]} />
        <primitive object={woodDark} attach="material" />
      </mesh>
      {/* Kapı kulpları */}
      <mesh position={[-w * 0.12, standH * 0.5, d / 2 + 0.02]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.05, 8]} />
        <primitive object={woodDark} attach="material" />
      </mesh>
      <mesh position={[w * 0.12, standH * 0.5, d / 2 + 0.02]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.05, 8]} />
        <primitive object={woodDark} attach="material" />
      </mesh>
      {/* Üst tabla (tankın oturduğu kenar) */}
      <mesh position={[0, standH + 0.02, 0]} castShadow receiveShadow>
        <boxGeometry args={[w * 1.02, 0.04, d * 1.02]} />
        <primitive object={woodTrim} attach="material" />
      </mesh>
      {/* Alt süpürgelik */}
      <mesh position={[0, 0.03, 0]} castShadow>
        <boxGeometry args={[w * 0.98, 0.06, d * 0.98]} />
        <primitive object={woodDark} attach="material" />
      </mesh>

      {/* ─── Cam tank ─── */}
      <mesh position={[0, tankY, 0]}>
        <boxGeometry args={[tankW, tankH, tankD]} />
        <primitive object={glassMat} attach="material" />
      </mesh>
      {/* Tank alt çerçevesi */}
      <mesh position={[0, standH + 0.045, 0]} castShadow>
        <boxGeometry args={[tankW * 1.02, 0.05, tankD * 1.02]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      {/* Tank üst çerçevesi */}
      <mesh position={[0, standH + tankH - 0.02, 0]} castShadow>
        <boxGeometry args={[tankW * 1.02, 0.04, tankD * 1.02]} />
        <primitive object={frameMat} attach="material" />
      </mesh>

      {/* ─── Taban çakılı ─── */}
      <mesh position={[0, gravelY, 0]} castShadow receiveShadow>
        <boxGeometry args={[tankW * 0.94, gravelH, tankD * 0.94]} />
        <primitive object={gravelMat} attach="material" />
      </mesh>

      {/* ─── Su (yarı saydam mavi) ─── */}
      <mesh position={[0, waterY, 0]}>
        <boxGeometry args={[tankW * 0.93, waterH, tankD * 0.93]} />
        <primitive object={waterMat} attach="material" />
      </mesh>

      {/* ─── Balıklar ─── */}
      {fish}
    </group>
  )
}
