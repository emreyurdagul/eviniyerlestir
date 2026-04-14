import * as THREE from 'three'

const body   = new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
const door   = new THREE.MeshLambertMaterial({ color: 0x333333 })
const line   = new THREE.MeshLambertMaterial({ color: 0x606060 })
const handle = new THREE.MeshLambertMaterial({ color: 0xa0a0a0 })

/** French-door buzdolabı — üst çift kapı + alt freezer çekmecesi */
export default function FridgeFrench({ dims }: { dims: Record<string, number> }) {
  const w = Math.max(0.85, (dims.width ?? 90) / 100)
  const dep = (dims.depth ?? 70) / 100
  const h = 1.85
  const halfW = w / 2
  const upperH = h * 0.66
  const lowerH = h - upperH - 0.05
  const freezerY = lowerH / 2

  return (
    <group>
      {/* Gövde */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, dep]} />
        <primitive object={body} attach="material" />
      </mesh>

      {/* Üst 2 kapı (french) */}
      {[-1, 1].map(s => (
        <group key={s}>
          <mesh position={[s * halfW / 2, lowerH + 0.03 + upperH / 2, dep / 2 + 0.008]} castShadow>
            <boxGeometry args={[halfW - 0.015, upperH - 0.03, 0.018]} />
            <primitive object={door} attach="material" />
          </mesh>
          {/* Kulp — alt kenarda yatay */}
          <mesh position={[s * halfW / 2, lowerH + 0.08, dep / 2 + 0.030]}>
            <boxGeometry args={[halfW * 0.55, 0.022, 0.022]} />
            <primitive object={handle} attach="material" />
          </mesh>
        </group>
      ))}
      {/* Üst orta dikey çizgi */}
      <mesh position={[0, lowerH + 0.03 + upperH / 2, dep / 2 + 0.010]}>
        <boxGeometry args={[0.006, upperH - 0.04, 0.006]} />
        <primitive object={line} attach="material" />
      </mesh>

      {/* Alt freezer çekmecesi */}
      <mesh position={[0, freezerY, dep / 2 + 0.008]} castShadow>
        <boxGeometry args={[w - 0.015, lowerH - 0.04, 0.018]} />
        <primitive object={door} attach="material" />
      </mesh>
      {/* Freezer kulp — yatay */}
      <mesh position={[0, freezerY + 0.03, dep / 2 + 0.030]}>
        <boxGeometry args={[w * 0.55, 0.022, 0.022]} />
        <primitive object={handle} attach="material" />
      </mesh>
      {/* Üst/alt arası yatay şerit */}
      <mesh position={[0, lowerH + 0.015, dep / 2 + 0.010]}>
        <boxGeometry args={[w, 0.008, 0.006]} />
        <primitive object={line} attach="material" />
      </mesh>
    </group>
  )
}
