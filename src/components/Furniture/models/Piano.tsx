import * as THREE from 'three'
import type { ReactElement } from 'react'

const bodyBlk  = new THREE.MeshLambertMaterial({ color: 0x121212 })
const bodyEdge = new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
const keyWhite = new THREE.MeshLambertMaterial({ color: 0xf2efe6 })
const keyBlack = new THREE.MeshLambertMaterial({ color: 0x080808 })
const brass    = new THREE.MeshLambertMaterial({ color: 0xb9952f })

/** Beyaz tuş şeridi üstüne dizili siyah tuşlar */
function blackKeys(span: number, y: number, z: number, count: number): ReactElement[] {
  return Array.from({ length: count }, (_, i) => {
    const x = -span / 2 + (span / count) * (i + 0.5)
    return (
      <mesh key={`bk-${i}`} position={[x, y, z]} castShadow>
        <boxGeometry args={[(span / count) * 0.45, 0.025, 0.11]} />
        <primitive object={keyBlack} attach="material" />
      </mesh>
    )
  })
}

/**
 * Piyano — sabit boyut (dims yok). Variant'a göre belirgin biçimde farklı geometri:
 *  - upright : dik duvar piyanosu — gövde + klavye kapağı + pedallar (~1.5×1.2×0.65 m)
 *  - grand   : kuyruklu — kavisli/asimetrik gövde + 3 ayak + açık kapak (~1.55×1.05×1.9 m)
 * Siyah parlak gövde + beyaz tuş şeridi.
 */
export default function Piano({
  dims: _dims,
  variant = 'upright',
}: { dims: Record<string, number>; variant?: string }) {
  // ───────────────────────── grand: kuyruklu piyano ─────────────────────────
  if (variant === 'grand') {
    const legH = 0.72
    const bodyY = legH + 0.11
    // Bas (sol) kenar düz, tiz (sağ) kenar içe kıvrılır → asimetrik kuyruk
    const blocks: { w: number; d: number; z: number }[] = [
      { w: 1.55, d: 0.55, z: 0.65 },
      { w: 1.30, d: 0.55, z: 0.12 },
      { w: 0.85, d: 0.55, z: -0.42 },
      { w: 0.45, d: 0.35, z: -0.80 },
    ]
    return (
      <group>
        {/* Kavisli gövde — öne doğru daralan bloklar */}
        {blocks.map((b, i) => (
          <mesh key={`gb-${i}`} position={[-0.775 + b.w / 2, bodyY, b.z]} castShadow receiveShadow>
            <boxGeometry args={[b.w, 0.22, b.d]} />
            <primitive object={bodyBlk} attach="material" />
          </mesh>
        ))}
        {/* Ayaklar (3 adet) */}
        {([[-0.6, 0.7], [0.6, 0.7], [-0.45, -0.7]] as const).map(([lx, lz], i) => (
          <mesh key={`lg-${i}`} position={[lx, legH / 2, lz]} castShadow>
            <cylinderGeometry args={[0.05, 0.06, legH, 12]} />
            <primitive object={bodyBlk} attach="material" />
          </mesh>
        ))}
        {/* Açık kapak — bas kenardan menteşeli, tiz tarafa doğru yukarı kalkar */}
        <group position={[-0.74, bodyY + 0.12, 0.1]} rotation={[0, 0, 0.8]}>
          <mesh position={[0.72, 0, 0]} castShadow>
            <boxGeometry args={[1.42, 0.025, 1.45]} />
            <primitive object={bodyEdge} attach="material" />
          </mesh>
        </group>
        {/* Kapağı tutan destek çubuğu */}
        <mesh position={[0.15, bodyY + 0.42, 0.4]} rotation={[0, 0, 0.5]} castShadow>
          <cylinderGeometry args={[0.012, 0.012, 0.8, 8]} />
          <primitive object={brass} attach="material" />
        </mesh>
        {/* Klavye kapağı (fallboard) */}
        <mesh position={[0, bodyY + 0.02, 0.84]} castShadow>
          <boxGeometry args={[1.5, 0.06, 0.14]} />
          <primitive object={bodyEdge} attach="material" />
        </mesh>
        {/* Beyaz tuş şeridi + siyah tuşlar */}
        <mesh position={[0, bodyY - 0.05, 0.96]} castShadow>
          <boxGeometry args={[1.42, 0.04, 0.18]} />
          <primitive object={keyWhite} attach="material" />
        </mesh>
        {blackKeys(1.34, bodyY - 0.02, 0.92, 18)}
        {/* Pedal liri */}
        <mesh position={[0, 0.18, 0.78]} castShadow>
          <boxGeometry args={[0.14, 0.30, 0.05]} />
          <primitive object={bodyBlk} attach="material" />
        </mesh>
        {[-0.04, 0, 0.04].map((px, i) => (
          <mesh key={`pd-${i}`} position={[px, 0.06, 0.82]} castShadow>
            <boxGeometry args={[0.025, 0.012, 0.08]} />
            <primitive object={brass} attach="material" />
          </mesh>
        ))}
      </group>
    )
  }

  // ───────────────────────── upright: dik duvar piyanosu ─────────────────────────
  const W = 1.5, H = 1.2, D = 0.65
  const cabD = 0.40
  const cabZ = -D / 2 + cabD / 2
  const cabFront = cabZ + cabD / 2
  const shelfY = 0.72
  return (
    <group>
      {/* Ana gövde */}
      <mesh position={[0, H / 2, cabZ]} castShadow receiveShadow>
        <boxGeometry args={[W, H, cabD]} />
        <primitive object={bodyBlk} attach="material" />
      </mesh>
      {/* Üst kapak çıkıntısı */}
      <mesh position={[0, H - 0.03, cabZ + 0.03]} castShadow>
        <boxGeometry args={[W + 0.04, 0.06, cabD + 0.08]} />
        <primitive object={bodyEdge} attach="material" />
      </mesh>
      {/* Üst ön panel (gloss vurgu) */}
      <mesh position={[0, H * 0.78, cabFront + 0.005]}>
        <boxGeometry args={[W - 0.08, 0.34, 0.01]} />
        <primitive object={bodyEdge} attach="material" />
      </mesh>
      {/* Klavye rafı (öne çıkar) */}
      <mesh position={[0, shelfY, cabFront + 0.13]} castShadow>
        <boxGeometry args={[W - 0.06, 0.08, 0.26]} />
        <primitive object={bodyBlk} attach="material" />
      </mesh>
      {/* Klavye kapağı (fallboard) — rafın arkasında dik */}
      <mesh position={[0, shelfY + 0.16, cabFront + 0.02]} castShadow>
        <boxGeometry args={[W - 0.08, 0.22, 0.04]} />
        <primitive object={bodyEdge} attach="material" />
      </mesh>
      {/* Beyaz tuş şeridi */}
      <mesh position={[0, shelfY + 0.05, cabFront + 0.17]} castShadow>
        <boxGeometry args={[W - 0.14, 0.025, 0.16]} />
        <primitive object={keyWhite} attach="material" />
      </mesh>
      {blackKeys(W - 0.22, shelfY + 0.07, cabFront + 0.14, 18)}
      {/* Pedaller */}
      <mesh position={[0, 0.12, cabFront + 0.04]} castShadow>
        <boxGeometry args={[0.16, 0.20, 0.04]} />
        <primitive object={bodyBlk} attach="material" />
      </mesh>
      {[-0.04, 0, 0.04].map((px, i) => (
        <mesh key={`up-${i}`} position={[px, 0.05, cabFront + 0.09]} castShadow>
          <boxGeometry args={[0.025, 0.012, 0.10]} />
          <primitive object={brass} attach="material" />
        </mesh>
      ))}
    </group>
  )
}
