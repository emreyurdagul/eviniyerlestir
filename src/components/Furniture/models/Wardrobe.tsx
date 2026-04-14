import * as THREE from 'three'

const body     = new THREE.MeshLambertMaterial({ color: 0xb89a68 })
const door     = new THREE.MeshLambertMaterial({ color: 0xd4b88a })
const doorEdge = new THREE.MeshLambertMaterial({ color: 0x9a7e58 })
const handle   = new THREE.MeshLambertMaterial({ color: 0xc0c0c0 })
const base     = new THREE.MeshLambertMaterial({ color: 0x6a4a2a })

/**
 * Gardrop — genişliğe göre dinamik kapı sayısı (her ~55cm = 1 kapı),
 * üst silme, alt kaide, dikey kulplar, kapı çerçevesi dikiş çizgileri.
 */
export default function Wardrobe({ dims }: { dims: Record<string, number> }) {
  const w = (dims.width ?? 120) / 100
  const d = (dims.depth ?? 60) / 100
  const h = 2.10

  const doorCount = Math.max(2, Math.round(w / 0.55))
  const doorW = (w - 0.04) / doorCount
  const baseH = 0.08
  const topH = 0.05

  return (
    <group>
      {/* ─── Alt kaide ─── */}
      <mesh position={[0, baseH / 2, 0]} castShadow>
        <boxGeometry args={[w, baseH, d]} />
        <primitive object={base} attach="material" />
      </mesh>

      {/* ─── Ana gövde ─── */}
      <mesh position={[0, baseH + (h - baseH - topH) / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h - baseH - topH, d]} />
        <primitive object={body} attach="material" />
      </mesh>

      {/* ─── Üst silme (taç) ─── */}
      <mesh position={[0, h - topH / 2, 0]} castShadow>
        <boxGeometry args={[w + 0.06, topH, d + 0.04]} />
        <primitive object={base} attach="material" />
      </mesh>

      {/* ─── Kapılar ─── */}
      {Array.from({ length: doorCount }, (_, i) => {
        const cx = -(w / 2) + 0.02 + doorW / 2 + i * doorW
        const doorY = baseH + (h - baseH - topH) / 2
        const doorH = h - baseH - topH - 0.04
        const handleX = cx + (i % 2 === 0 ? doorW / 2 - 0.04 : -doorW / 2 + 0.04)
        return (
          <group key={i}>
            {/* Kapı paneli */}
            <mesh position={[cx, doorY, d / 2 + 0.008]} castShadow>
              <boxGeometry args={[doorW - 0.015, doorH, 0.018]} />
              <primitive object={door} attach="material" />
            </mesh>
            {/* Kapı iç dikdörtgen detay */}
            <mesh position={[cx, doorY, d / 2 + 0.019]}>
              <boxGeometry args={[doorW - 0.12, doorH - 0.20, 0.004]} />
              <primitive object={doorEdge} attach="material" />
            </mesh>
            <mesh position={[cx, doorY, d / 2 + 0.021]}>
              <boxGeometry args={[doorW - 0.16, doorH - 0.24, 0.003]} />
              <primitive object={door} attach="material" />
            </mesh>
            {/* Kapı ayırıcı çizgi */}
            {i < doorCount - 1 && (
              <mesh position={[cx + doorW / 2, doorY, d / 2 + 0.012]}>
                <boxGeometry args={[0.008, doorH, 0.008]} />
                <primitive object={doorEdge} attach="material" />
              </mesh>
            )}
            {/* Dikey kulp */}
            <mesh position={[handleX, doorY, d / 2 + 0.030]} castShadow>
              <boxGeometry args={[0.025, 0.18, 0.025]} />
              <primitive object={handle} attach="material" />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
