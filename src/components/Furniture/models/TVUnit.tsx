import * as THREE from 'three'

const wood     = new THREE.MeshLambertMaterial({ color: 0x3a2818 })
const woodTop  = new THREE.MeshLambertMaterial({ color: 0x4a3220 })
const handle   = new THREE.MeshLambertMaterial({ color: 0xa08060 })
const screen   = new THREE.MeshLambertMaterial({ color: 0x08080c })
const bezel    = new THREE.MeshLambertMaterial({ color: 0x151515 })
const bezelMid = new THREE.MeshLambertMaterial({ color: 0x2a2a2a })

/**
 * TV Ünitesi — alt dolap (çekmeceler + kapaklar) + duvar panel + TV.
 * length boyutu sehpa uzunluğu; TV ekran boyutu orantılı.
 */
export default function TVUnit({ dims }: { dims: Record<string, number> }) {
  const len = (dims.length ?? 190) / 100
  const cabW = len
  const cabH = 0.44
  const cabD = 0.40
  const screenW = Math.max(0.8, cabW * 0.7)
  const screenH = screenW * 0.56  // 16:9

  // Not: FurnitureItem x-ekseni len, z-ekseni dep map'lediği için:
  // TV önde/arkada değil, len boyunca uzanmalı — yönü düzelt

  return (
    <group>
      {/* Alt dolap */}
      <mesh position={[0, cabH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[cabW, cabH, cabD]} />
        <primitive object={wood} attach="material" />
      </mesh>
      {/* Dolap üst tabla */}
      <mesh position={[0, cabH + 0.015, 0]} castShadow>
        <boxGeometry args={[cabW + 0.02, 0.03, cabD + 0.02]} />
        <primitive object={woodTop} attach="material" />
      </mesh>

      {/* 3 çekmece yüzü (alt) */}
      {[-1, 0, 1].map(i => (
        <group key={i}>
          <mesh position={[i * cabW / 3.2, 0.12, cabD / 2 + 0.008]} castShadow>
            <boxGeometry args={[cabW / 3.5, 0.18, 0.016]} />
            <primitive object={woodTop} attach="material" />
          </mesh>
          {/* Kulp */}
          <mesh position={[i * cabW / 3.2, 0.12, cabD / 2 + 0.020]}>
            <boxGeometry args={[0.12, 0.012, 0.014]} />
            <primitive object={handle} attach="material" />
          </mesh>
        </group>
      ))}
      {/* Üst 2 kapak yüzü */}
      {[-1, 1].map(i => (
        <group key={i}>
          <mesh position={[i * cabW / 4, 0.32, cabD / 2 + 0.008]} castShadow>
            <boxGeometry args={[cabW / 2.3, 0.18, 0.016]} />
            <primitive object={woodTop} attach="material" />
          </mesh>
          <mesh position={[i * cabW / 4 + (i > 0 ? -0.06 : 0.06), 0.32, cabD / 2 + 0.020]}>
            <cylinderGeometry args={[0.014, 0.014, 0.025, 10]} />
            <primitive object={handle} attach="material" />
          </mesh>
        </group>
      ))}

      {/* TV — bezel + ekran */}
      <group position={[0, cabH + 0.08 + screenH / 2 + 0.35, -cabD / 2 + 0.05]}>
        {/* Dış çerçeve */}
        <mesh castShadow>
          <boxGeometry args={[screenW + 0.04, screenH + 0.04, 0.03]} />
          <primitive object={bezel} attach="material" />
        </mesh>
        {/* İç çerçeve */}
        <mesh position={[0, 0, 0.008]}>
          <boxGeometry args={[screenW + 0.015, screenH + 0.015, 0.018]} />
          <primitive object={bezelMid} attach="material" />
        </mesh>
        {/* Ekran */}
        <mesh position={[0, 0, 0.020]}>
          <boxGeometry args={[screenW, screenH, 0.008]} />
          <primitive object={screen} attach="material" />
        </mesh>
        {/* Alt marka şeridi */}
        <mesh position={[0, -(screenH / 2 + 0.015), 0.016]}>
          <boxGeometry args={[0.08, 0.008, 0.005]} />
          <primitive object={handle} attach="material" />
        </mesh>
      </group>

      {/* TV duvar askısı */}
      <mesh position={[0, cabH + 0.35, -cabD / 2 + 0.01]}>
        <boxGeometry args={[0.22, 0.04, 0.02]} />
        <primitive object={bezelMid} attach="material" />
      </mesh>
    </group>
  )
}
