import * as THREE from 'three'

const wood     = new THREE.MeshLambertMaterial({ color: 0xb09870 })
const woodDk   = new THREE.MeshLambertMaterial({ color: 0x8a7048 })
const book1    = new THREE.MeshLambertMaterial({ color: 0xa04040 })
const book2    = new THREE.MeshLambertMaterial({ color: 0x3e6a8e })
const book3    = new THREE.MeshLambertMaterial({ color: 0xc4a070 })
const book4    = new THREE.MeshLambertMaterial({ color: 0x405a3e })

/** Kitaplık — yan + üst + alt çerçeve, raflar, rastgele kitap dolguları */
export default function Shelf({ dims }: { dims: Record<string, number> }) {
  const w = (dims.width ?? 80) / 100
  const h = (dims.height ?? 180) / 100
  const d = 0.32
  const shelfCount = Math.max(2, Math.floor(h / 0.38))
  const shelfGap = h / (shelfCount + 1)

  // Rastgele ama deterministik (kitaplar sabit görünür)
  const rand = (seed: number) => Math.abs(Math.sin(seed * 12.9898 + 78.233) * 43758.5453) % 1

  return (
    <group>
      {/* Sol yan */}
      <mesh position={[-w / 2 + 0.015, h / 2, 0]} castShadow>
        <boxGeometry args={[0.03, h, d]} />
        <primitive object={woodDk} attach="material" />
      </mesh>
      {/* Sağ yan */}
      <mesh position={[w / 2 - 0.015, h / 2, 0]} castShadow>
        <boxGeometry args={[0.03, h, d]} />
        <primitive object={woodDk} attach="material" />
      </mesh>
      {/* Arka panel */}
      <mesh position={[0, h / 2, -d / 2 + 0.004]}>
        <boxGeometry args={[w - 0.06, h - 0.04, 0.008]} />
        <primitive object={wood} attach="material" />
      </mesh>
      {/* Üst + alt */}
      <mesh position={[0, h - 0.01, 0]} castShadow>
        <boxGeometry args={[w, 0.03, d]} />
        <primitive object={woodDk} attach="material" />
      </mesh>
      <mesh position={[0, 0.015, 0]} castShadow>
        <boxGeometry args={[w, 0.03, d]} />
        <primitive object={woodDk} attach="material" />
      </mesh>

      {/* İç raflar + kitaplar */}
      {Array.from({ length: shelfCount }, (_, i) => {
        const y = shelfGap * (i + 1)
        return (
          <group key={i}>
            {/* Raf */}
            <mesh position={[0, y, 0]} castShadow>
              <boxGeometry args={[w - 0.04, 0.02, d - 0.02]} />
              <primitive object={wood} attach="material" />
            </mesh>
            {/* Kitaplar — her rafta 4-8 kitap */}
            {(() => {
              const bookMats = [book1, book2, book3, book4]
              const totalBooks = 5 + Math.floor(rand(i * 7) * 4)
              const usedW = w - 0.08
              let cursor = -usedW / 2
              const books: React.ReactNode[] = []
              for (let b = 0; b < totalBooks; b++) {
                const bw = 0.025 + rand(i * 31 + b) * 0.04
                if (cursor + bw > usedW / 2) break
                const bh = 0.18 + rand(i * 17 + b * 3) * 0.12
                const mat = bookMats[(i * 3 + b) % 4]
                const tilt = b === totalBooks - 1 ? 0.15 : 0
                books.push(
                  <mesh
                    key={`b-${i}-${b}`}
                    position={[cursor + bw / 2, y + 0.01 + bh / 2, 0]}
                    rotation={[0, 0, tilt]}
                    castShadow
                  >
                    <boxGeometry args={[bw, bh, d * 0.6]} />
                    <primitive object={mat} attach="material" />
                  </mesh>
                )
                cursor += bw + 0.003
              }
              return books
            })()}
          </group>
        )
      })}
    </group>
  )
}
