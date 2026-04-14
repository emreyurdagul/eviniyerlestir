import * as THREE from 'three'

const wood    = new THREE.MeshLambertMaterial({ color: 0xe8dcc8 })
const woodDk  = new THREE.MeshLambertMaterial({ color: 0xa89880 })
const handle  = new THREE.MeshLambertMaterial({ color: 0x303030 })
const screen  = new THREE.MeshLambertMaterial({ color: 0x08080c })
const bezel   = new THREE.MeshLambertMaterial({ color: 0x121212 })

/** Floating TV ünitesi — duvar montajlı, uzun alçak dolap + TV */
export default function TVUnitFloating({ dims }: { dims: Record<string, number> }) {
  const len = (dims.length ?? 190) / 100
  const cabH = 0.22
  const cabD = 0.30
  const screenW = Math.max(0.8, len * 0.75)
  const screenH = screenW * 0.56

  return (
    <group>
      {/* Dolap — duvardan 40cm yukarıda (floating) */}
      <group position={[0, 0.48, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[len, cabH, cabD]} />
          <primitive object={wood} attach="material" />
        </mesh>
        {/* Alt dekoratif şerit */}
        <mesh position={[0, -cabH / 2, 0]}>
          <boxGeometry args={[len + 0.01, 0.008, cabD + 0.01]} />
          <primitive object={woodDk} attach="material" />
        </mesh>
        {/* Yatay kulp şeridi (tüm uzunlukta) */}
        <mesh position={[0, -0.04, cabD / 2 + 0.005]}>
          <boxGeometry args={[len - 0.08, 0.015, 0.008]} />
          <primitive object={handle} attach="material" />
        </mesh>
        {/* Kapı ayırıcı çizgisi (ortada) */}
        <mesh position={[0, 0, cabD / 2 + 0.006]}>
          <boxGeometry args={[0.006, cabH - 0.04, 0.003]} />
          <primitive object={woodDk} attach="material" />
        </mesh>
      </group>

      {/* TV — dolabın üstünde, duvardan yükselir */}
      <group position={[0, 1.10 + screenH / 2, -cabD / 2 + 0.04]}>
        <mesh castShadow>
          <boxGeometry args={[screenW + 0.03, screenH + 0.03, 0.025]} />
          <primitive object={bezel} attach="material" />
        </mesh>
        <mesh position={[0, 0, 0.015]}>
          <boxGeometry args={[screenW, screenH, 0.005]} />
          <primitive object={screen} attach="material" />
        </mesh>
      </group>
    </group>
  )
}
