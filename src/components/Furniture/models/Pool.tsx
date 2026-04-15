import * as THREE from 'three'

const deck   = new THREE.MeshLambertMaterial({ color: 0xe2ded2 })
const deckDk = new THREE.MeshLambertMaterial({ color: 0xb4ac96 })
const wall   = new THREE.MeshLambertMaterial({ color: 0x88b4d4 })
const floor  = new THREE.MeshLambertMaterial({ color: 0x3c7eaa })
const water  = new THREE.MeshLambertMaterial({
  color: 0x4aa8d8,
  transparent: true,
  opacity: 0.55,
})
const ladder = new THREE.MeshLambertMaterial({ color: 0xc0c4c8 })

/** Yüzme havuzu — deck + kenar taşı + şeffaf mavi su yüzeyi. Origin alt-orta. */
export default function Pool({ dims }: { dims: Record<string, number> }) {
  const l = (dims.length ?? 800) / 100
  const w = (dims.width ?? 400) / 100
  const depth = (dims.depth ?? 150) / 100

  const deckW = 0.20          // etrafındaki kenar taşı genişliği
  const deckH = 0.10          // deck kalınlığı
  const rimH  = 0.04          // su yüzeyinin üstte görünmesini sağlayan hafif pervaz

  // Havuz çukuru: deck'in içinde (l x w), derinlik deckH'nin altına iner
  const pl = l - deckW * 2
  const pw = w - deckW * 2
  const poolFloorY = deckH - depth   // deck üstü 0'da; taban aşağıda

  return (
    <group>
      {/* Deck — dört kenar çerçeve (kenar taşı) */}
      {/* Üst kenar */}
      <mesh position={[0, deckH / 2, w / 2 - deckW / 2]} castShadow receiveShadow>
        <boxGeometry args={[l, deckH, deckW]} />
        <primitive object={deck} attach="material" />
      </mesh>
      {/* Alt kenar */}
      <mesh position={[0, deckH / 2, -w / 2 + deckW / 2]} castShadow receiveShadow>
        <boxGeometry args={[l, deckH, deckW]} />
        <primitive object={deck} attach="material" />
      </mesh>
      {/* Sol kenar */}
      <mesh
        position={[-l / 2 + deckW / 2, deckH / 2, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[deckW, deckH, w - deckW * 2]} />
        <primitive object={deck} attach="material" />
      </mesh>
      {/* Sağ kenar */}
      <mesh
        position={[l / 2 - deckW / 2, deckH / 2, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[deckW, deckH, w - deckW * 2]} />
        <primitive object={deck} attach="material" />
      </mesh>

      {/* Deck iç hattı (koyu taş bant) */}
      <mesh position={[0, deckH + 0.001, w / 2 - deckW + 0.02]}>
        <boxGeometry args={[pl, 0.004, 0.04]} />
        <primitive object={deckDk} attach="material" />
      </mesh>
      <mesh position={[0, deckH + 0.001, -w / 2 + deckW - 0.02]}>
        <boxGeometry args={[pl, 0.004, 0.04]} />
        <primitive object={deckDk} attach="material" />
      </mesh>

      {/* Havuz tabanı */}
      <mesh position={[0, poolFloorY + 0.005, 0]} receiveShadow>
        <boxGeometry args={[pl, 0.01, pw]} />
        <primitive object={floor} attach="material" />
      </mesh>

      {/* Havuz duvarları (iç) */}
      <mesh
        position={[0, poolFloorY + depth / 2, w / 2 - deckW + 0.005]}
      >
        <boxGeometry args={[pl, depth, 0.02]} />
        <primitive object={wall} attach="material" />
      </mesh>
      <mesh
        position={[0, poolFloorY + depth / 2, -w / 2 + deckW - 0.005]}
      >
        <boxGeometry args={[pl, depth, 0.02]} />
        <primitive object={wall} attach="material" />
      </mesh>
      <mesh
        position={[-l / 2 + deckW - 0.005, poolFloorY + depth / 2, 0]}
      >
        <boxGeometry args={[0.02, depth, pw]} />
        <primitive object={wall} attach="material" />
      </mesh>
      <mesh
        position={[l / 2 - deckW + 0.005, poolFloorY + depth / 2, 0]}
      >
        <boxGeometry args={[0.02, depth, pw]} />
        <primitive object={wall} attach="material" />
      </mesh>

      {/* Su yüzeyi — deck üst seviyesinde, şeffaf mavi */}
      <mesh position={[0, deckH - 0.01, 0]}>
        <boxGeometry args={[pl - 0.02, rimH, pw - 0.02]} />
        <primitive object={water} attach="material" />
      </mesh>

      {/* Merdiven (dar kenarda, 3 basamak) */}
      <group position={[l / 2 - deckW - 0.25, 0, 0]}>
        {[0, 1, 2].map(i => (
          <mesh
            key={i}
            position={[i * 0.12, deckH - 0.03 - i * 0.12, 0]}
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
