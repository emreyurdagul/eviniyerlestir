import * as THREE from 'three'
import type { ReactElement } from 'react'

const deck   = new THREE.MeshLambertMaterial({ color: 0xe2ded2 })
const deckDk = new THREE.MeshLambertMaterial({ color: 0xb4ac96 })
const wall   = new THREE.MeshLambertMaterial({ color: 0x88b4d4 })
const floor  = new THREE.MeshLambertMaterial({ color: 0x3c7eaa })
const water  = new THREE.MeshLambertMaterial({
  color: 0x4aa8d8,
  transparent: true,
  opacity: 0.55,
})
const ladder   = new THREE.MeshLambertMaterial({ color: 0xc0c4c8 })
const laneLine = new THREE.MeshLambertMaterial({ color: 0x14406e })
const rope     = new THREE.MeshLambertMaterial({ color: 0xd9483b })
const block    = new THREE.MeshLambertMaterial({ color: 0x6a6e72 })

const DECK_W = 0.20          // etrafındaki kenar taşı genişliği
const DECK_H = 0.10          // deck kalınlığı
const RIM_H  = 0.04          // su yüzeyinin üstte görünmesini sağlayan hafif pervaz

/** Dikdörtgen havuz kabuğu — deck çerçevesi, iç duvarlar, taban ve su yüzeyi. */
function RectShell({
  l,
  w,
  depth,
}: {
  l: number
  w: number
  depth: number
}): ReactElement {
  // Havuz çukuru: deck'in içinde (l x w), derinlik DECK_H'nin altına iner
  const pl = l - DECK_W * 2
  const pw = w - DECK_W * 2
  const poolFloorY = DECK_H - depth   // deck üstü 0'da; taban aşağıda

  return (
    <>
      {/* Deck — dört kenar çerçeve (kenar taşı) */}
      {/* Üst kenar */}
      <mesh position={[0, DECK_H / 2, w / 2 - DECK_W / 2]} castShadow receiveShadow>
        <boxGeometry args={[l, DECK_H, DECK_W]} />
        <primitive object={deck} attach="material" />
      </mesh>
      {/* Alt kenar */}
      <mesh position={[0, DECK_H / 2, -w / 2 + DECK_W / 2]} castShadow receiveShadow>
        <boxGeometry args={[l, DECK_H, DECK_W]} />
        <primitive object={deck} attach="material" />
      </mesh>
      {/* Sol kenar */}
      <mesh position={[-l / 2 + DECK_W / 2, DECK_H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[DECK_W, DECK_H, w - DECK_W * 2]} />
        <primitive object={deck} attach="material" />
      </mesh>
      {/* Sağ kenar */}
      <mesh position={[l / 2 - DECK_W / 2, DECK_H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[DECK_W, DECK_H, w - DECK_W * 2]} />
        <primitive object={deck} attach="material" />
      </mesh>

      {/* Deck iç hattı (koyu taş bant) */}
      <mesh position={[0, DECK_H + 0.001, w / 2 - DECK_W + 0.02]}>
        <boxGeometry args={[pl, 0.004, 0.04]} />
        <primitive object={deckDk} attach="material" />
      </mesh>
      <mesh position={[0, DECK_H + 0.001, -w / 2 + DECK_W - 0.02]}>
        <boxGeometry args={[pl, 0.004, 0.04]} />
        <primitive object={deckDk} attach="material" />
      </mesh>

      {/* Havuz tabanı */}
      <mesh position={[0, poolFloorY + 0.005, 0]} receiveShadow>
        <boxGeometry args={[pl, 0.01, pw]} />
        <primitive object={floor} attach="material" />
      </mesh>

      {/* Havuz duvarları (iç) */}
      <mesh position={[0, poolFloorY + depth / 2, w / 2 - DECK_W + 0.005]}>
        <boxGeometry args={[pl, depth, 0.02]} />
        <primitive object={wall} attach="material" />
      </mesh>
      <mesh position={[0, poolFloorY + depth / 2, -w / 2 + DECK_W - 0.005]}>
        <boxGeometry args={[pl, depth, 0.02]} />
        <primitive object={wall} attach="material" />
      </mesh>
      <mesh position={[-l / 2 + DECK_W - 0.005, poolFloorY + depth / 2, 0]}>
        <boxGeometry args={[0.02, depth, pw]} />
        <primitive object={wall} attach="material" />
      </mesh>
      <mesh position={[l / 2 - DECK_W + 0.005, poolFloorY + depth / 2, 0]}>
        <boxGeometry args={[0.02, depth, pw]} />
        <primitive object={wall} attach="material" />
      </mesh>

      {/* Su yüzeyi — deck üst seviyesinde, şeffaf mavi */}
      <mesh position={[0, DECK_H - 0.01, 0]}>
        <boxGeometry args={[pl - 0.02, RIM_H, pw - 0.02]} />
        <primitive object={water} attach="material" />
      </mesh>
    </>
  )
}

/**
 * Yüzme havuzu — deck + kenar taşı + şeffaf mavi su yüzeyi. Origin alt-orta.
 * Variant'a göre farklı geometri:
 *  - rectangle: klasik dikdörtgen çukur + köşede 3 basamaklı merdiven.
 *  - kidney:    eğrisel "böbrek" silueti — yumuşak yaylı, daire lobların birleşimi.
 *  - lap:       uzun yüzme kulvarı — taban kulvar çizgileri, yüzey halatları, başlama blokları.
 */
export default function Pool({
  dims,
  variant = 'rectangle',
}: {
  dims: Record<string, number>
  variant?: string
}) {
  const l = (dims.length ?? 800) / 100
  const w = (dims.width ?? 400) / 100
  const depth = (dims.depth ?? 150) / 100

  // ── Böbrek (kidney) — eğrisel yaylı boru, üst üste binen daire loblar ──
  if (variant === 'kidney') {
    const lobeCount = 9
    const rMax = Math.min(w * 0.32, l * 0.24)         // lob yarıçapı
    const bow  = w * 0.22                              // yay (böbrek kıvrımı)
    const halfUsableL = Math.max(rMax, l / 2 - rMax)
    // Derinlik arttıkça "derin uç" (koyu taban dairesi) büyür
    const deepR = Math.min(0.9, 0.5 + depth * 0.14)

    const lobes: ReactElement[] = []
    for (let i = 0; i < lobeCount; i++) {
      const t = (i / (lobeCount - 1)) * 2 - 1          // -1..1
      const r = rMax * (0.82 + 0.18 * (1 - t * t))     // uçlarda biraz incelir
      const x = halfUsableL * t
      const z = bow * (1 - t * t) - bow / 2            // yaylı omurga, ortalanmış
      lobes.push(
        <group key={`k-${i}`} position={[x, 0, z]}>
          {/* Deck/kenar taşı dairesi — üst üste binerek sürekli böbrek yüzeyi */}
          <mesh position={[0, DECK_H / 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[r + DECK_W, r + DECK_W, DECK_H, 28]} />
            <primitive object={deck} attach="material" />
          </mesh>
          {/* Derin uç tonu — su altından görünen koyu taban */}
          <mesh position={[0, DECK_H + 0.004, 0]} receiveShadow>
            <cylinderGeometry args={[r * deepR, r * deepR, 0.012, 28]} />
            <primitive object={floor} attach="material" />
          </mesh>
          {/* Kenar bandı (koyu taş, su ile taş arası geçiş) */}
          <mesh position={[0, DECK_H + 0.006, 0]}>
            <cylinderGeometry args={[r, r, 0.01, 28]} />
            <primitive object={wall} attach="material" />
          </mesh>
          {/* Su yüzeyi — taş kenarın içinde, şeffaf mavi */}
          <mesh position={[0, DECK_H + RIM_H / 2, 0]}>
            <cylinderGeometry args={[r * 0.94, r * 0.94, RIM_H, 28]} />
            <primitive object={water} attach="material" />
          </mesh>
        </group>
      )
    }

    return <group>{lobes}</group>
  }

  // ── Yüzme kulvarı (lap) — dikdörtgen kabuk + kulvar çizgileri/halat/bloklar ──
  if (variant === 'lap') {
    const pl = l - DECK_W * 2
    const pw = w - DECK_W * 2
    const poolFloorY = DECK_H - depth
    const laneCount = Math.max(2, Math.min(6, Math.round(pw / 1.0)))
    const span = pw / laneCount

    const lines: ReactElement[] = []   // tabandaki koyu kulvar çizgileri
    for (let k = 1; k < laneCount; k++) {
      const z = -pw / 2 + k * span
      lines.push(
        <mesh key={`ln-${k}`} position={[0, poolFloorY + 0.013, z]}>
          <boxGeometry args={[pl * 0.95, 0.004, 0.05]} />
          <primitive object={laneLine} attach="material" />
        </mesh>
      )
    }

    const ropes: ReactElement[] = []   // su yüzeyinde kulvar ayırıcı halatlar
    for (let k = 0; k <= laneCount; k++) {
      const z = -pw / 2 + k * span
      ropes.push(
        <mesh
          key={`rp-${k}`}
          position={[0, DECK_H - 0.005, z]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[0.025, 0.025, pl * 0.95, 8]} />
          <primitive object={rope} attach="material" />
        </mesh>
      )
    }

    const blocks: ReactElement[] = []  // kısa kenarda başlama blokları
    for (let j = 0; j < laneCount; j++) {
      const z = -pw / 2 + (j + 0.5) * span
      blocks.push(
        <mesh
          key={`bk-${j}`}
          position={[l / 2 - DECK_W / 2, DECK_H + 0.05, z]}
          castShadow
        >
          <boxGeometry args={[DECK_W * 0.8, 0.10, span * 0.7]} />
          <primitive object={block} attach="material" />
        </mesh>
      )
    }

    return (
      <group>
        <RectShell l={l} w={w} depth={depth} />
        {lines}
        {ropes}
        {blocks}
      </group>
    )
  }

  // ── Dikdörtgen (varsayılan) — klasik çukur + köşede merdiven ──
  return (
    <group>
      <RectShell l={l} w={w} depth={depth} />

      {/* Merdiven (dar kenarda, 3 basamak) */}
      <group position={[l / 2 - DECK_W - 0.25, 0, 0]}>
        {[0, 1, 2].map(i => (
          <mesh
            key={i}
            position={[i * 0.12, DECK_H - 0.03 - i * 0.12, 0]}
            castShadow
          >
            <boxGeometry args={[0.10, 0.02, 0.40]} />
            <primitive object={ladder} attach="material" />
          </mesh>
        ))}
      </group>
    </group>
  )
}
