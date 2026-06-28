import * as THREE from 'three'

const rod     = new THREE.MeshLambertMaterial({ color: 0x8a7050 })
const fabric  = new THREE.MeshLambertMaterial({ color: 0xc0a890, side: THREE.DoubleSide })
const fabricL = new THREE.MeshLambertMaterial({ color: 0xd8c4a8, side: THREE.DoubleSide })
const slat    = new THREE.MeshLambertMaterial({ color: 0xe2d8c6, side: THREE.DoubleSide })
const metal   = new THREE.MeshLambertMaterial({ color: 0x8c8c8c })
const cord     = new THREE.MeshLambertMaterial({ color: 0xb0a080 })

/**
 * Perde — variant'a göre belirgin farklı geometri:
 *  - pleated: kornişli, dalgalı pleated kumaş panelleri (klasik)
 *  - flat:    kornişli, iki yana düz dökümlü pürüzsüz paneller
 *  - shades:  üst rulo + yatay stor lamelleri (venedik tipi)
 */
export default function Curtain({
  dims,
  variant = 'pleated',
}: { dims: Record<string, number>; variant?: string }) {
  const w = (dims.width ?? 180) / 100
  const h = (dims.height ?? 220) / 100

  // Korniş çubuğu + topuz uçları (pleated & flat ortak)
  const cornice = (
    <>
      {/* Korniş çubuğu */}
      <mesh position={[0, h - 0.04, 0.02]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.020, 0.020, w + 0.16, 10]} />
        <primitive object={rod} attach="material" />
      </mesh>
      {/* Korniş uçları */}
      <mesh position={[ (w + 0.16) / 2 + 0.01, h - 0.04, 0.02]}>
        <sphereGeometry args={[0.035, 12, 10]} />
        <primitive object={rod} attach="material" />
      </mesh>
      <mesh position={[-(w + 0.16) / 2 - 0.01, h - 0.04, 0.02]}>
        <sphereGeometry args={[0.035, 12, 10]} />
        <primitive object={rod} attach="material" />
      </mesh>
    </>
  )

  /* ── Düz dökümlü perde: iki yana ayrılmış pürüzsüz paneller ─────────── */
  if (variant === 'flat') {
    const gap = 0.04
    const panelW = w / 2 - gap / 2
    const panelH = h - 0.10
    const cy = panelH / 2 + 0.04
    const sideX = panelW / 2 + gap / 2
    return (
      <group>
        {cornice}
        {([-1, 1] as const).map((s) => (
          <group key={`fp-${s}`}>
            {/* Düz, dalgasız ana panel */}
            <mesh position={[s * sideX, cy, 0.01]} castShadow>
              <boxGeometry args={[panelW, panelH, 0.02]} />
              <primitive object={s < 0 ? fabric : fabricL} attach="material" />
            </mesh>
            {/* İnce dikey döküm çizgileri */}
            {Array.from({ length: 2 }, (_, i) => {
              const fx = s * sideX + (i - 0.5) * (panelW / 3)
              return (
                <mesh key={`ff-${s}-${i}`} position={[fx, cy, 0.022]}>
                  <boxGeometry args={[0.012, panelH - 0.04, 0.006]} />
                  <primitive object={s < 0 ? fabricL : fabric} attach="material" />
                </mesh>
              )
            })}
            {/* Ağırlıklı alt etek */}
            <mesh position={[s * sideX, 0.06, 0.012]} castShadow>
              <boxGeometry args={[panelW, 0.05, 0.024]} />
              <primitive object={fabricL} attach="material" />
            </mesh>
          </group>
        ))}
      </group>
    )
  }

  /* ── Stor: üst rulo + yatay lameller ───────────────────────────────── */
  if (variant === 'shades') {
    const slatGap = 0.05
    const topY = h - 0.12
    const botY = 0.12
    const slatCount = Math.max(6, Math.floor((topY - botY) / slatGap))
    return (
      <group>
        {/* Üst rulo gövdesi */}
        <mesh position={[0, h - 0.05, 0.0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.045, 0.045, w + 0.04, 14]} />
          <primitive object={metal} attach="material" />
        </mesh>
        {/* Üst başlık kutusu */}
        <mesh position={[0, h - 0.05, -0.03]} castShadow>
          <boxGeometry args={[w + 0.06, 0.07, 0.05]} />
          <primitive object={rod} attach="material" />
        </mesh>

        {/* Yatay stor lamelleri */}
        {Array.from({ length: slatCount }, (_, i) => {
          const y = topY - i * slatGap
          return (
            <mesh key={`s-${i}`} position={[0, y, 0]} rotation={[0.28, 0, 0]} castShadow>
              <boxGeometry args={[w - 0.02, 0.046, 0.012]} />
              <primitive object={i % 2 === 0 ? slat : fabricL} attach="material" />
            </mesh>
          )
        })}

        {/* Alt ağırlık çıtası */}
        <mesh position={[0, botY - slatGap, 0]} castShadow>
          <boxGeometry args={[w, 0.045, 0.03]} />
          <primitive object={metal} attach="material" />
        </mesh>

        {/* Yan çekme ipi */}
        <mesh position={[w / 2 + 0.03, (h - 0.05 + botY) / 2, 0.02]}>
          <cylinderGeometry args={[0.004, 0.004, h - 0.20, 6]} />
          <primitive object={cord} attach="material" />
        </mesh>
      </group>
    )
  }

  /* ── Pileli (klasik, varsayılan): dalgalı pleated panelleri ─────────── */
  const pleats = Math.max(10, Math.round(w / 0.12))
  return (
    <group>
      {cornice}

      {/* Perde pleatleri — ince dikey kumaş panelleri */}
      {Array.from({ length: pleats }, (_, i) => {
        const t = (i / (pleats - 1)) - 0.5   // -0.5..0.5
        const x = t * w
        // Dalgalı: z offset sinüs ile
        const z = Math.sin(i * 1.2) * 0.04
        const pw = (w / pleats) * 1.15
        return (
          <mesh
            key={`p-${i}`}
            position={[x, h / 2 - 0.04, z]}
            rotation={[0, Math.sin(i * 0.7) * 0.08, 0]}
            castShadow
          >
            <boxGeometry args={[pw, h - 0.06, 0.015]} />
            <primitive object={i % 2 === 0 ? fabric : fabricL} attach="material" />
          </mesh>
        )
      })}

      {/* Tiebacks (alt hafif bağlama) — görselde bir band */}
      <mesh position={[0, 0.02, 0.06]}>
        <boxGeometry args={[w * 1.02, 0.04, 0.02]} />
        <primitive object={fabricL} attach="material" />
      </mesh>
    </group>
  )
}
