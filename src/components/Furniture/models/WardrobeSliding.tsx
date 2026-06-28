import * as THREE from 'three'

const body    = new THREE.MeshLambertMaterial({ color: 0xa89a88 })
const panel   = new THREE.MeshLambertMaterial({ color: 0xd8ccb8 })
const mirror  = new THREE.MeshLambertMaterial({ color: 0xc5d8e0 })
const rail    = new THREE.MeshLambertMaterial({ color: 0x606060 })
const base    = new THREE.MeshLambertMaterial({ color: 0x5a4a38 })

/** Sürgülü dolap — 2 büyük sürgülü panel, üst/alt ray, orta aynalı */
export default function WardrobeSliding({ dims }: { dims: Record<string, number> }) {
  const w = (dims.width ?? 120) / 100
  const d = (dims.depth ?? 60) / 100
  const h = 2.10

  const doorH = h - 0.10
  const doorW = w / 2 - 0.03
  const panelCount = 3 // her sürgü panelinde dekoratif yatay bölüm

  return (
    <group>
      {/* Alt kaide */}
      <mesh position={[0, 0.03, 0]} castShadow>
        <boxGeometry args={[w, 0.06, d]} />
        <primitive object={base} attach="material" />
      </mesh>

      {/* Ana gövde — kaidenin ÜSTÜNE otur (z-fighting önlenir) */}
      <mesh position={[0, 0.06 + (h - 0.06) / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h - 0.06, d]} />
        <primitive object={body} attach="material" />
      </mesh>

      {/* Üst ray */}
      <mesh position={[0, h - 0.02, d / 2 + 0.012]} castShadow>
        <boxGeometry args={[w - 0.02, 0.04, 0.02]} />
        <primitive object={rail} attach="material" />
      </mesh>
      {/* Alt ray */}
      <mesh position={[0, 0.08, d / 2 + 0.012]} castShadow>
        <boxGeometry args={[w - 0.02, 0.03, 0.02]} />
        <primitive object={rail} attach="material" />
      </mesh>

      {/* Sol sürgü paneli */}
      <mesh position={[-w / 4, h / 2, d / 2 + 0.02]} castShadow>
        <boxGeometry args={[doorW, doorH, 0.018]} />
        <primitive object={panel} attach="material" />
      </mesh>
      {/* Sol paneldeki yatay bölümler */}
      {Array.from({ length: panelCount - 1 }, (_, i) => {
        const yFrac = (i + 1) / panelCount
        return (
          <mesh key={`ls-${i}`} position={[-w / 4, 0.05 + doorH * yFrac, d / 2 + 0.030]}>
            <boxGeometry args={[doorW - 0.02, 0.008, 0.006]} />
            <primitive object={rail} attach="material" />
          </mesh>
        )
      })}

      {/* Sağ sürgü paneli — aynalı */}
      <mesh position={[w / 4, h / 2, d / 2 + 0.008]} castShadow>
        <boxGeometry args={[doorW, doorH, 0.012]} />
        <primitive object={panel} attach="material" />
      </mesh>
      <mesh position={[w / 4, h / 2, d / 2 + 0.017]}>
        <boxGeometry args={[doorW - 0.10, doorH - 0.16, 0.006]} />
        <primitive object={mirror} attach="material" />
      </mesh>

      {/* Sol panel tutamaç (yan) */}
      <mesh position={[-0.02, h / 2, d / 2 + 0.035]} castShadow>
        <boxGeometry args={[0.04, 0.35, 0.018]} />
        <primitive object={rail} attach="material" />
      </mesh>
    </group>
  )
}
