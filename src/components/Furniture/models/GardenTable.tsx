import * as THREE from 'three'

const metal    = new THREE.MeshLambertMaterial({ color: 0x3a3a3a })
const glass    = new THREE.MeshLambertMaterial({ color: 0xcfe4e8, transparent: true, opacity: 0.55 })
const wood     = new THREE.MeshLambertMaterial({ color: 0x8a6a40 })
const woodDark = new THREE.MeshLambertMaterial({ color: 0x6b4f2e })

/** Bahçe masası — variant'a göre yuvarlak cam üstlü veya kare ahşap */
export default function GardenTable({
  dims,
  variant = 'round',
}: {
  dims: Record<string, number>
  variant?: string
}) {
  const diameter = (dims.diameter ?? 90) / 100
  const r = diameter / 2
  const topH = 0.74
  const topTh = 0.04

  // ── 'square' → Köşeli / Kare ahşap masa ──
  // Dört ahşap ayak, kenar kuşakları (apron) ve masif kare tabla.
  if (variant === 'square') {
    const side = diameter            // tam kenar (bbox: diameter)
    const half = side / 2
    const inset = Math.min(0.08, side * 0.12)
    const legSize = 0.06
    const legH = topH - topTh        // tabla ayakların üstüne oturur
    const off = half - inset         // ayak merkez ofseti
    const apronY = legH - 0.09
    const apronH = 0.07
    const apronTh = 0.035
    const apronLen = side - 2 * inset - legSize

    const legPos: Array<[number, number]> = [
      [ off,  off],
      [ off, -off],
      [-off,  off],
      [-off, -off],
    ]

    return (
      <group>
        {/* Ayaklar */}
        {legPos.map(([x, z], i) => (
          <mesh key={i} position={[x, legH / 2, z]} castShadow>
            <boxGeometry args={[legSize, legH, legSize]} />
            <primitive object={woodDark} attach="material" />
          </mesh>
        ))}
        {/* Kenar kuşakları — X ekseni boyunca (ön/arka) */}
        <mesh position={[0, apronY, off]} castShadow>
          <boxGeometry args={[apronLen, apronH, apronTh]} />
          <primitive object={woodDark} attach="material" />
        </mesh>
        <mesh position={[0, apronY, -off]} castShadow>
          <boxGeometry args={[apronLen, apronH, apronTh]} />
          <primitive object={woodDark} attach="material" />
        </mesh>
        {/* Kenar kuşakları — Z ekseni boyunca (sol/sağ) */}
        <mesh position={[off, apronY, 0]} castShadow>
          <boxGeometry args={[apronTh, apronH, apronLen]} />
          <primitive object={woodDark} attach="material" />
        </mesh>
        <mesh position={[-off, apronY, 0]} castShadow>
          <boxGeometry args={[apronTh, apronH, apronLen]} />
          <primitive object={woodDark} attach="material" />
        </mesh>
        {/* Masif kare tabla */}
        <mesh position={[0, topH - topTh / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[side, topTh, side]} />
          <primitive object={wood} attach="material" />
        </mesh>
      </group>
    )
  }

  // ── 'round' (varsayılan) → Yuvarlak / Cam üstlü masa ──
  return (
    <group>
      {/* Merkez sütun */}
      <mesh position={[0, (topH - topTh) / 2, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, topH - topTh, 12]} />
        <primitive object={metal} attach="material" />
      </mesh>
      {/* Taban */}
      <mesh position={[0, 0.025, 0]} castShadow>
        <cylinderGeometry args={[r * 0.45, r * 0.48, 0.05, 20]} />
        <primitive object={metal} attach="material" />
      </mesh>
      {/* Ahşap çerçeve */}
      <mesh position={[0, topH - topTh / 2 - 0.005, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[r, r, 0.03, 28]} />
        <primitive object={wood} attach="material" />
      </mesh>
      {/* Cam üst */}
      <mesh position={[0, topH + 0.005, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[r - 0.04, r - 0.04, 0.012, 28]} />
        <primitive object={glass} attach="material" />
      </mesh>
    </group>
  )
}
