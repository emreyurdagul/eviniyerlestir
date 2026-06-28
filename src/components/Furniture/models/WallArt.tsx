import * as THREE from 'three'

const frame   = new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
const mat     = new THREE.MeshLambertMaterial({ color: 0xf0ece0 })
const paintA  = new THREE.MeshLambertMaterial({ color: 0x5a7aa0 })
const paintB  = new THREE.MeshLambertMaterial({ color: 0xc08050 })
const paintC  = new THREE.MeshLambertMaterial({ color: 0xd0c080 })

// Klasik (altın yaldız) varyantı için ek malzemeler
const gold    = new THREE.MeshLambertMaterial({ color: 0xbfa14a })
const goldHi  = new THREE.MeshLambertMaterial({ color: 0xe8d27a })
const sky     = new THREE.MeshLambertMaterial({ color: 0xb9cdd6 })
const ground  = new THREE.MeshLambertMaterial({ color: 0x5f6b3a })

/** Modern — soyut, siyah çerçeveli 3 bloklu kompozisyon (varsayılan). */
function ModernArt({ w, h }: { w: number; h: number }) {
  const frameTh = 0.03
  const depth = 0.04
  return (
    <group>
      {/* Çerçeve (siyah) */}
      <mesh position={[0, 0, -depth / 2]} castShadow>
        <boxGeometry args={[w, h, depth]} />
        <primitive object={frame} attach="material" />
      </mesh>
      {/* Mat paspartu */}
      <mesh position={[0, 0, 0.001]}>
        <boxGeometry args={[w - frameTh * 2, h - frameTh * 2, 0.006]} />
        <primitive object={mat} attach="material" />
      </mesh>
      {/* Soyut kompozisyon — 3 blok */}
      <mesh position={[-w * 0.18, h * 0.10, 0.005]}>
        <boxGeometry args={[w * 0.40, h * 0.45, 0.004]} />
        <primitive object={paintA} attach="material" />
      </mesh>
      <mesh position={[w * 0.15, -h * 0.12, 0.005]}>
        <boxGeometry args={[w * 0.45, h * 0.30, 0.004]} />
        <primitive object={paintB} attach="material" />
      </mesh>
      <mesh position={[w * 0.25, h * 0.22, 0.006]}>
        <boxGeometry args={[w * 0.20, h * 0.18, 0.004]} />
        <primitive object={paintC} attach="material" />
      </mesh>
    </group>
  )
}

/** Klasik — kalın altın yaldız çerçeve + manzara tuvali, köşe süslemeleri. */
function ClassicArt({ w, h }: { w: number; h: number }) {
  const frameTh = 0.055
  const depth = 0.06
  const cw = w - frameTh * 2
  const ch = h - frameTh * 2
  const corner = Math.min(w, h) * 0.10
  // Köşe süsleri
  const corners: Array<[number, number]> = [
    [-w / 2 + corner * 0.5, h / 2 - corner * 0.5],
    [w / 2 - corner * 0.5, h / 2 - corner * 0.5],
    [-w / 2 + corner * 0.5, -h / 2 + corner * 0.5],
    [w / 2 - corner * 0.5, -h / 2 + corner * 0.5],
  ]
  return (
    <group>
      {/* Kalın altın çerçeve gövdesi */}
      <mesh position={[0, 0, -depth / 2]} castShadow>
        <boxGeometry args={[w, h, depth]} />
        <primitive object={gold} attach="material" />
      </mesh>
      {/* Çerçeve iç pahı (açık altın highlight) */}
      <mesh position={[0, 0, 0.004]}>
        <boxGeometry args={[cw + frameTh * 0.8, ch + frameTh * 0.8, 0.012]} />
        <primitive object={goldHi} attach="material" />
      </mesh>
      {/* Tuval — gökyüzü zemini */}
      <mesh position={[0, 0, 0.010]}>
        <boxGeometry args={[cw, ch, 0.006]} />
        <primitive object={sky} attach="material" />
      </mesh>
      {/* Manzara — alt yeşil zemin */}
      <mesh position={[0, -ch * 0.28, 0.013]}>
        <boxGeometry args={[cw, ch * 0.44, 0.004]} />
        <primitive object={ground} attach="material" />
      </mesh>
      {/* Güneş — üst köşede daire */}
      <mesh position={[cw * 0.26, ch * 0.26, 0.014]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[Math.min(cw, ch) * 0.12, Math.min(cw, ch) * 0.12, 0.004, 20]} />
        <primitive object={goldHi} attach="material" />
      </mesh>
      {/* Köşe süslemeleri (yaldız kabaralar) */}
      {corners.map(([cx, cy], i) => (
        <mesh key={`c-${i}`} position={[cx, cy, 0.006]} castShadow>
          <boxGeometry args={[corner, corner, depth * 0.7]} />
          <primitive object={goldHi} attach="material" />
        </mesh>
      ))}
    </group>
  )
}

/** Üçlü Set — yan yana üç ayrı çerçeveli panel (triptik), renkleri uyumlu. */
function TriptychSet({ w, h }: { w: number; h: number }) {
  const frameTh = 0.025
  const depth = 0.04
  const gap = w * 0.04
  const panelW = (w - gap * 2) / 3
  const panelMats = [paintA, paintB, paintC]
  return (
    <group>
      {panelMats.map((art, i) => {
        const px = (i - 1) * (panelW + gap)
        const innerW = panelW - frameTh * 2
        const innerH = h - frameTh * 2
        return (
          <group key={`p-${i}`} position={[px, 0, 0]}>
            {/* Panel çerçevesi (siyah) */}
            <mesh position={[0, 0, -depth / 2]} castShadow>
              <boxGeometry args={[panelW, h, depth]} />
              <primitive object={frame} attach="material" />
            </mesh>
            {/* Mat paspartu */}
            <mesh position={[0, 0, 0.001]}>
              <boxGeometry args={[innerW, innerH, 0.006]} />
              <primitive object={mat} attach="material" />
            </mesh>
            {/* Tek renkli kompozisyon bloğu */}
            <mesh position={[0, -innerH * 0.08, 0.005]}>
              <boxGeometry args={[innerW * 0.86, innerH * 0.70, 0.004]} />
              <primitive object={art} attach="material" />
            </mesh>
            {/* Ortak üst şerit — üç paneli bağlar */}
            <mesh position={[0, innerH * 0.36, 0.006]}>
              <boxGeometry args={[innerW * 0.86, innerH * 0.10, 0.004]} />
              <primitive object={paintC} attach="material" />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

/** Duvar tablosu — variant'a göre soyut modern, altın klasik veya üçlü set. */
export default function WallArt({
  dims,
  variant = 'modern',
}: {
  dims: Record<string, number>
  variant?: string
}) {
  const w = (dims.width ?? 60) / 100
  const h = (dims.height ?? 80) / 100

  if (variant === 'classic') return <ClassicArt w={w} h={h} />
  if (variant === 'set') return <TriptychSet w={w} h={h} />
  return <ModernArt w={w} h={h} />
}
