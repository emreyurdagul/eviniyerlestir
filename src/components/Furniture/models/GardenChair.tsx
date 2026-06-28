import * as THREE from 'three'

const rattan     = new THREE.MeshLambertMaterial({ color: 0x9a7a50 })
const rattanDark = new THREE.MeshLambertMaterial({ color: 0x6a4a28 })
const cushion    = new THREE.MeshLambertMaterial({ color: 0xd8cfb8 })
const metalFrame = new THREE.MeshLambertMaterial({ color: 0x2d2f33 })
const metalSeat  = new THREE.MeshLambertMaterial({ color: 0x3a3d42 })

/** Bahçe sandalyesi — variant'a göre örgü rattan gövde veya ferforje metal. */
export default function GardenChair({
  dims,
  variant = 'rattan',
}: {
  dims: Record<string, number>
  variant?: string
}) {
  const s = (dims.diameter ?? 55) / 55
  const w = 0.55 * s
  const d = 0.55 * s

  const legH = 0.42
  const seatTh = 0.06
  const backH = 0.50

  // ─────────────────────────────────────────────────────────────
  //  METAL — ferforje (dövme demir) bistro: yuvarlak oturak,
  //  açılan ince ayaklar + bağ halkası, kemerli güneşlik sırtlık.
  // ─────────────────────────────────────────────────────────────
  if (variant === 'metal') {
    const seatR = w / 2 - 0.02
    const topInset = seatR * 0.7
    const botSpread = seatR * 0.98
    const postX = seatR * 0.7
    const backZ = -seatR * 0.85
    const archR = postX
    const archCY = 0.90 - archR // kemer tepesi ~0.90

    // İki nokta arası ince metal boru (eğik ayaklar için)
    const tube = (
      a: THREE.Vector3,
      b: THREE.Vector3,
      r: number,
      mat: THREE.Material,
      key: string,
    ) => {
      const dir = new THREE.Vector3().subVectors(b, a)
      const len = dir.length()
      const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5)
      const q = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dir.clone().normalize(),
      )
      return (
        <mesh
          key={key}
          position={[mid.x, mid.y, mid.z]}
          quaternion={[q.x, q.y, q.z, q.w]}
          castShadow
        >
          <cylinderGeometry args={[r, r, len, 10]} />
          <primitive object={mat} attach="material" />
        </mesh>
      )
    }

    const corners: [number, number][] = [
      [1, 1],
      [-1, 1],
      [1, -1],
      [-1, -1],
    ]

    // Sırtlık ışınsal (sunburst) çubukları — kemere değecek şekilde
    const barK = [-0.7, -0.35, 0, 0.35, 0.7]

    return (
      <group>
        {/* Açılan ince ayaklar */}
        {corners.map(([sx, sz], i) =>
          tube(
            new THREE.Vector3(sx * topInset, legH, sz * topInset),
            new THREE.Vector3(sx * botSpread, 0, sz * botSpread),
            0.014,
            metalFrame,
            `leg-${i}`,
          ),
        )}

        {/* Ayakları bağlayan alt halka */}
        <mesh position={[0, 0.13, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[botSpread * 0.82, 0.01, 8, 24]} />
          <primitive object={metalFrame} attach="material" />
        </mesh>

        {/* Yuvarlak metal oturak */}
        <mesh position={[0, legH, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[seatR, seatR, 0.03, 28]} />
          <primitive object={metalSeat} attach="material" />
        </mesh>
        {/* Oturak kenar bordürü */}
        <mesh position={[0, legH + 0.005, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[seatR, 0.013, 8, 28]} />
          <primitive object={metalFrame} attach="material" />
        </mesh>

        {/* Sırtlık dikey direkler */}
        {[1, -1].map((sx, i) => (
          <mesh
            key={`post-${i}`}
            position={[sx * postX, (legH + archCY) / 2, backZ]}
            castShadow
          >
            <cylinderGeometry args={[0.014, 0.014, archCY - legH, 10]} />
            <primitive object={metalFrame} attach="material" />
          </mesh>
        ))}

        {/* Kemerli üst (yarım tor) */}
        <mesh position={[0, archCY, backZ]} castShadow>
          <torusGeometry args={[archR, 0.014, 8, 24, Math.PI]} />
          <primitive object={metalFrame} attach="material" />
        </mesh>

        {/* Işınsal sırtlık çubukları (kemere kadar uzanan) */}
        {barK.map((k, i) => {
          const xi = archR * k
          const top = archCY + Math.sqrt(Math.max(archR * archR - xi * xi, 0))
          const h = top - legH
          return (
            <mesh
              key={`bar-${i}`}
              position={[xi, (legH + top) / 2, backZ]}
              castShadow
            >
              <cylinderGeometry args={[0.007, 0.007, h, 8]} />
              <primitive object={metalFrame} attach="material" />
            </mesh>
          )
        })}

        {/* Dekoratif kıvrım (ferforje) halkaları */}
        {[1, -1].map((sx, i) => (
          <mesh
            key={`scroll-${i}`}
            position={[sx * postX * 0.5, legH + 0.11, backZ - 0.006]}
          >
            <torusGeometry args={[0.04, 0.009, 8, 18]} />
            <primitive object={metalFrame} attach="material" />
          </mesh>
        ))}
      </group>
    )
  }

  // ─────────────────────────────────────────────────────────────
  //  RATTAN (varsayılan) — örgü rattan gövde, kolsuz, dış mekan
  // ─────────────────────────────────────────────────────────────
  return (
    <group>
      {/* Ayaklar */}
      {[
        [ w / 2 - 0.04,  d / 2 - 0.04],
        [-w / 2 + 0.04,  d / 2 - 0.04],
        [ w / 2 - 0.04, -d / 2 + 0.04],
        [-w / 2 + 0.04, -d / 2 + 0.04],
      ].map(([px, pz], i) => (
        <mesh key={`leg-${i}`} position={[px, legH / 2, pz]} castShadow>
          <cylinderGeometry args={[0.022, 0.022, legH, 10]} />
          <primitive object={rattanDark} attach="material" />
        </mesh>
      ))}

      {/* Oturak */}
      <mesh position={[0, legH, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, seatTh, d]} />
        <primitive object={rattan} attach="material" />
      </mesh>
      {/* Minder */}
      <mesh position={[0, legH + seatTh / 2 + 0.035, 0]} castShadow>
        <boxGeometry args={[w - 0.06, 0.06, d - 0.06]} />
        <primitive object={cushion} attach="material" />
      </mesh>

      {/* Sırt çerçevesi */}
      <mesh position={[0, legH + backH / 2, -d / 2 + 0.04]} castShadow>
        <boxGeometry args={[w, backH, 0.05]} />
        <primitive object={rattan} attach="material" />
      </mesh>
      {/* Sırt — yatay rattan çubukları */}
      {[0.10, 0.22, 0.34, 0.46].map((h, i) => (
        <mesh key={`b-${i}`} position={[0, legH + h, -d / 2 + 0.065]} castShadow>
          <boxGeometry args={[w - 0.05, 0.015, 0.015]} />
          <primitive object={rattanDark} attach="material" />
        </mesh>
      ))}

      {/* Ön birleştirici çubuklar (alt) */}
      <mesh position={[0, 0.10, d / 2 - 0.04]}>
        <boxGeometry args={[w - 0.05, 0.02, 0.02]} />
        <primitive object={rattanDark} attach="material" />
      </mesh>
      <mesh position={[0, 0.10, -d / 2 + 0.04]}>
        <boxGeometry args={[w - 0.05, 0.02, 0.02]} />
        <primitive object={rattanDark} attach="material" />
      </mesh>
    </group>
  )
}
