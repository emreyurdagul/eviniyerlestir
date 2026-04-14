import * as THREE from 'three'

const wood   = new THREE.MeshLambertMaterial({ color: 0xb89a68 })
const woodDk = new THREE.MeshLambertMaterial({ color: 0x8a7050 })

/** Merdiven kitaplık — üste doğru daralan açık raflar, yaslanan form */
export default function ShelfLadder({ dims }: { dims: Record<string, number> }) {
  const w = (dims.width ?? 80) / 100
  const h = (dims.height ?? 180) / 100
  const shelfCount = 4
  const gap = h / shelfCount

  return (
    <group>
      {/* İki yan dikme — hafif geriye eğimli (ladder) */}
      {[-1, 1].map(s => (
        <mesh
          key={s}
          position={[s * (w / 2 - 0.02), h / 2, -0.04]}
          rotation={[-0.08, 0, 0]}
          castShadow
        >
          <boxGeometry args={[0.035, h + 0.04, 0.035]} />
          <primitive object={woodDk} attach="material" />
        </mesh>
      ))}

      {/* Raflar — altta geniş üstte dar */}
      {Array.from({ length: shelfCount }, (_, i) => {
        const y = gap * (i + 0.5)
        const levelFactor = 1 - i * 0.15   // alt = 1, üst = 0.55
        const sw = w * levelFactor
        const sd = 0.30 * levelFactor
        return (
          <group key={i}>
            {/* Raf tabla */}
            <mesh position={[0, y, -0.05 + (i * 0.02)]} castShadow>
              <boxGeometry args={[sw - 0.08, 0.025, sd]} />
              <primitive object={wood} attach="material" />
            </mesh>
            {/* Raf altı dekoratif şerit */}
            <mesh position={[0, y - 0.02, -0.05 + (i * 0.02)]}>
              <boxGeometry args={[sw - 0.10, 0.008, sd - 0.02]} />
              <primitive object={woodDk} attach="material" />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
