import * as THREE from 'three'

const frame   = new THREE.MeshLambertMaterial({ color: 0x8a6a40 })
const frameL  = new THREE.MeshLambertMaterial({ color: 0xb09068 })
const mirrorM = new THREE.MeshLambertMaterial({ color: 0xd8e4e8 })
const rimGold = new THREE.MeshLambertMaterial({ color: 0xc9a24b })

/** Duvar aynası — çerçeve biçimi varyanta göre değişir (dikdörtgen / yuvarlak / oval) */
export default function Mirror({
  dims,
  variant = 'rectangle',
}: { dims: Record<string, number>; variant?: string }) {
  const w = (dims.width ?? 60) / 100
  const h = (dims.height ?? 80) / 100

  const frameTh = 0.06
  const depth = 0.04

  // ── Yuvarlak ayna: kusursuz daire, ince altın rengi halka ──────────
  if (variant === 'round') {
    const seg = 44
    const r = Math.min(w, h) / 2
    return (
      <group>
        {/* Arka plaka (çerçeve diski) */}
        <mesh position={[0, 0, -depth / 2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[r, r, depth, seg]} />
          <primitive object={frame} attach="material" />
        </mesh>
        {/* Ayna yüzeyi (daire) */}
        <mesh position={[0, 0, 0.004]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[r - frameTh, r - frameTh, 0.006, seg]} />
          <primitive object={mirrorM} attach="material" />
        </mesh>
        {/* İnce altın çerçeve halkası */}
        <mesh position={[0, 0, 0.008]}>
          <torusGeometry args={[r - frameTh * 0.5, 0.014, 14, seg]} />
          <primitive object={rimGold} attach="material" />
        </mesh>
      </group>
    )
  }

  // ── Oval ayna: dikey uzanan elips (daire grup ölçeği ile gerilir) ──
  if (variant === 'oval') {
    const seg = 48
    // Birim yarıçaplı daire; grup ölçeği X/Y ile elipse dönüşür, Z derinliği korunur.
    return (
      <group scale={[w / 2, h / 2, 1]}>
        {/* Arka plaka (elips disk) */}
        <mesh position={[0, 0, -depth / 2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[1, 1, depth, seg]} />
          <primitive object={frame} attach="material" />
        </mesh>
        {/* Ayna yüzeyi (elips) */}
        <mesh position={[0, 0, 0.004]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.88, 0.88, 0.006, seg]} />
          <primitive object={mirrorM} attach="material" />
        </mesh>
        {/* Açık tonlu çerçeve halkası */}
        <mesh position={[0, 0, 0.008]}>
          <torusGeometry args={[0.94, 0.06, 12, seg]} />
          <primitive object={frameL} attach="material" />
        </mesh>
      </group>
    )
  }

  // ── Dikdörtgen ayna (varsayılan): klasik ahşap çerçeve ─────────────
  return (
    <group>
      {/* Arka plaka (çerçeve) */}
      <mesh position={[0, 0, -depth / 2]} castShadow>
        <boxGeometry args={[w, h, depth]} />
        <primitive object={frame} attach="material" />
      </mesh>
      {/* İç ayna yüzeyi */}
      <mesh position={[0, 0, 0.001]}>
        <boxGeometry args={[w - frameTh * 2, h - frameTh * 2, 0.005]} />
        <primitive object={mirrorM} attach="material" />
      </mesh>
      {/* Çerçeve üst süslü kenar (highlight) */}
      <mesh position={[0, h / 2 - 0.015, 0.002]}>
        <boxGeometry args={[w - 0.02, 0.02, 0.008]} />
        <primitive object={frameL} attach="material" />
      </mesh>
      <mesh position={[0, -h / 2 + 0.015, 0.002]}>
        <boxGeometry args={[w - 0.02, 0.02, 0.008]} />
        <primitive object={frameL} attach="material" />
      </mesh>
    </group>
  )
}
