import * as THREE from 'three'

const stone     = new THREE.MeshLambertMaterial({ color: 0xb8ac98 })
const stoneDark = new THREE.MeshLambertMaterial({ color: 0x8f8470 })
const brick     = new THREE.MeshLambertMaterial({ color: 0x9a5a44 })
const mantel    = new THREE.MeshLambertMaterial({ color: 0x6a4a30 })
const firebox   = new THREE.MeshLambertMaterial({ color: 0x191512 })
const metal     = new THREE.MeshLambertMaterial({ color: 0x2a2a2e })
const metalLite = new THREE.MeshLambertMaterial({ color: 0x46464c })
const whiteBody = new THREE.MeshLambertMaterial({ color: 0xf2f2ee })
const glass     = new THREE.MeshLambertMaterial({ color: 0x10161c, transparent: true, opacity: 0.55 })
const log       = new THREE.MeshLambertMaterial({ color: 0x4a3320 })
const flameHot  = new THREE.MeshBasicMaterial({ color: 0xffb838 })
const flameMid  = new THREE.MeshBasicMaterial({ color: 0xff6a1c })
const flameDeep = new THREE.MeshBasicMaterial({ color: 0xd8300f })
const led       = new THREE.MeshBasicMaterial({ color: 0xff7a26 })
const ledBlue   = new THREE.MeshBasicMaterial({ color: 0x3aa0ff })

/**
 * Şömine. Variant'a göre belirgin farklı biçim:
 *  - classic  : taş ayaklar + tuğla kemer, içinde odun ve alev (varsayılan)
 *  - modern   : geniş düz cam panel, alttan parlak alev şeridi
 *  - electric : kompakt sığ duvar ünitesi, LED alev paneli
 */
export default function Fireplace({ dims, variant = 'classic' }: { dims: Record<string, number>; variant?: string }) {
  const w = (dims.width ?? 120) / 100

  // Parlak alev konileri üretici (alev/LED için MeshBasicMaterial)
  const flames = (fw: number, baseY: number, count: number, scale: number) =>
    Array.from({ length: count }, (_, i) => {
      const x = -fw / 2 + (i + 0.5) * (fw / count)
      const h = scale * (0.62 + ((i * 5) % 4) * 0.13)
      const mat = i % 3 === 0 ? flameDeep : i % 2 === 0 ? flameMid : flameHot
      return (
        <mesh key={`fl-${i}`} position={[x, baseY + h / 2, 0]}>
          <coneGeometry args={[scale * 0.085, h, 8]} />
          <primitive object={mat} attach="material" />
        </mesh>
      )
    })

  // ───────────────────────── modern: geniş cam panel + alttan alev şeridi ─────────────────────────
  if (variant === 'modern') {
    const H = 1.05
    const dep = 0.36
    return (
      <group>
        <mesh position={[0, H / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[w, H, dep]} />
          <primitive object={metal} attach="material" />
        </mesh>
        {/* Koyu iç kavite */}
        <mesh position={[0, H / 2, dep / 2 - 0.06]}>
          <boxGeometry args={[w - 0.1, H - 0.12, 0.04]} />
          <primitive object={firebox} attach="material" />
        </mesh>
        {/* Alttan parlak alev şeridi */}
        <mesh position={[0, 0.09, dep / 2 - 0.07]}>
          <boxGeometry args={[w - 0.18, 0.045, 0.03]} />
          <primitive object={led} attach="material" />
        </mesh>
        <group position={[0, 0, dep / 2 - 0.085]}>{flames(w - 0.22, 0.11, 9, 0.6)}</group>
        {/* Üst havalandırma şeridi */}
        <mesh position={[0, H - 0.04, dep / 2 + 0.003]}>
          <boxGeometry args={[w - 0.1, 0.03, 0.02]} />
          <primitive object={metalLite} attach="material" />
        </mesh>
        {/* Düz cam panel (yarı saydam) */}
        <mesh position={[0, H / 2, dep / 2 + 0.006]}>
          <boxGeometry args={[w - 0.06, H - 0.08, 0.02]} />
          <primitive object={glass} attach="material" />
        </mesh>
      </group>
    )
  }

  // ───────────────────────── electric: kompakt sığ duvar ünitesi, LED alev ─────────────────────────
  if (variant === 'electric') {
    const H = 0.55
    const dep = 0.18
    return (
      <group>
        <mesh position={[0, H / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[w, H, dep]} />
          <primitive object={whiteBody} attach="material" />
        </mesh>
        {/* Koyu iç panel */}
        <mesh position={[0, H / 2, dep / 2 - 0.04]}>
          <boxGeometry args={[w - 0.1, H - 0.1, 0.03]} />
          <primitive object={firebox} attach="material" />
        </mesh>
        {/* LED mavi taban parıltısı */}
        <mesh position={[0, H * 0.22, dep / 2 - 0.05]}>
          <boxGeometry args={[w - 0.14, 0.025, 0.02]} />
          <primitive object={ledBlue} attach="material" />
        </mesh>
        <group position={[0, 0, dep / 2 - 0.05]}>{flames(w - 0.18, H * 0.24, 7, 0.4)}</group>
        {/* Düz cam ön kapak */}
        <mesh position={[0, H / 2, dep / 2 + 0.004]}>
          <boxGeometry args={[w - 0.05, H - 0.05, 0.015]} />
          <primitive object={glass} attach="material" />
        </mesh>
      </group>
    )
  }

  // ───────────────────────── classic (varsayılan): taş + tuğla kemer, alev ─────────────────────────
  const H = 1.15
  const dep = 0.4
  const hearthH = 0.12
  const openW = w * 0.55
  const openH = H * 0.48
  const pillarW = (w - openW) / 2
  const archCy = hearthH + openH
  const ar = openW / 2 + 0.04

  return (
    <group>
      {/* Ocak tabanı */}
      <mesh position={[0, hearthH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, hearthH, dep]} />
        <primitive object={stoneDark} attach="material" />
      </mesh>
      {/* Yan taş ayaklar */}
      {[-1, 1].map((s) => (
        <mesh key={`p-${s}`} position={[s * (w / 2 - pillarW / 2), H / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[pillarW, H, dep]} />
          <primitive object={stone} attach="material" />
        </mesh>
      ))}
      {/* Üst raf (mantel) */}
      <mesh position={[0, H + 0.07, 0.02]} castShadow>
        <boxGeometry args={[w + 0.12, 0.14, dep + 0.1]} />
        <primitive object={mantel} attach="material" />
      </mesh>
      {/* Koyu ocak arkalığı */}
      <mesh position={[0, hearthH + (H - hearthH) / 2, -dep / 2 + 0.05]}>
        <boxGeometry args={[openW, H - hearthH, 0.04]} />
        <primitive object={firebox} attach="material" />
      </mesh>
      {/* Tuğla kemer (voussoir taşları) */}
      {Array.from({ length: 9 }, (_, i) => {
        const a = (Math.PI * i) / 8
        return (
          <mesh
            key={`a-${i}`}
            position={[Math.cos(a) * ar, archCy + Math.sin(a) * ar * 0.6, dep / 2 - 0.06]}
            rotation={[0, 0, a - Math.PI / 2]}
            castShadow
          >
            <boxGeometry args={[0.08, 0.13, dep * 0.7]} />
            <primitive object={brick} attach="material" />
          </mesh>
        )
      })}
      {/* Odunlar */}
      {[0.04, -0.05].map((dz, i) => (
        <mesh
          key={`log-${i}`}
          position={[0, hearthH + 0.05 + i * 0.015, dz]}
          rotation={[0, i * 0.4, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[0.04, 0.04, openW * 0.72, 10]} />
          <primitive object={log} attach="material" />
        </mesh>
      ))}
      {/* Alevler */}
      <group position={[0, 0, 0.02]}>{flames(openW * 0.8, hearthH + 0.09, 5, 0.75)}</group>
    </group>
  )
}
