import * as THREE from 'three'

const body    = new THREE.MeshLambertMaterial({ color: 0xe8e8e6 })
const door    = new THREE.MeshLambertMaterial({ color: 0xdcdcda })
const line    = new THREE.MeshLambertMaterial({ color: 0xb0b0ae })
const handle  = new THREE.MeshLambertMaterial({ color: 0x909090 })
const display = new THREE.MeshLambertMaterial({ color: 0x151515 })

/** Side-by-side buzdolabı — iki yandan açılan büyük dolap */
export default function FridgeSideBySide({ dims }: { dims: Record<string, number> }) {
  const w = Math.max(0.85, (dims.width ?? 90) / 100)  // daha geniş
  const dep = (dims.depth ?? 70) / 100
  const h = 1.85
  const halfW = w / 2

  return (
    <group>
      {/* Ana gövde */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, dep]} />
        <primitive object={body} attach="material" />
      </mesh>

      {/* İki kapı */}
      {[-1, 1].map(s => (
        <group key={s}>
          <mesh position={[s * halfW / 2, h / 2, dep / 2 + 0.008]} castShadow>
            <boxGeometry args={[halfW - 0.015, h - 0.04, 0.018]} />
            <primitive object={door} attach="material" />
          </mesh>
          {/* Dikey kulp (dış kenarda) */}
          <mesh position={[s * (halfW - 0.05), h / 2, dep / 2 + 0.040]} castShadow>
            <boxGeometry args={[0.028, h - 0.25, 0.028]} />
            <primitive object={handle} attach="material" />
          </mesh>
        </group>
      ))}

      {/* Orta dikey ayırıcı */}
      <mesh position={[0, h / 2, dep / 2 + 0.010]}>
        <boxGeometry args={[0.008, h - 0.04, 0.008]} />
        <primitive object={line} attach="material" />
      </mesh>

      {/* Su/buz dispensers (sol kapıda) */}
      <mesh position={[-halfW / 2 - 0.05, h * 0.7, dep / 2 + 0.020]}>
        <boxGeometry args={[0.18, 0.24, 0.012]} />
        <primitive object={display} attach="material" />
      </mesh>
      <mesh position={[-halfW / 2 - 0.05, h * 0.76, dep / 2 + 0.026]}>
        <boxGeometry args={[0.14, 0.06, 0.005]} />
        <primitive object={handle} attach="material" />
      </mesh>
    </group>
  )
}
