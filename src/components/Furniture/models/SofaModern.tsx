import * as THREE from 'three'

const fabric      = new THREE.MeshLambertMaterial({ color: 0x7a8a8a })
const fabricLight = new THREE.MeshLambertMaterial({ color: 0x8a9a9a })
const leg         = new THREE.MeshLambertMaterial({ color: 0x2a1a08 })

/** Modern koltuk — düz hatlı, alçak, geniş tek parça sırtlık, ince metal ayaklar */
export default function SofaModern({ dims }: { dims: Record<string, number> }) {
  const len = (dims.length ?? 240) / 100
  const dep = 0.92
  const sitH = 0.38
  const backH = 0.42
  const armW = 0.12
  const legH = 0.10

  const seatW = len - armW * 2

  return (
    <group>
      {/* İnce metal ayaklar */}
      {[
        [-(len / 2 - 0.08), -(dep / 2 - 0.08)],
        [ (len / 2 - 0.08), -(dep / 2 - 0.08)],
        [-(len / 2 - 0.08),  (dep / 2 - 0.08)],
        [ (len / 2 - 0.08),  (dep / 2 - 0.08)],
      ].map(([px, pz], i) => (
        <mesh key={i} position={[px, legH / 2, pz]} castShadow>
          <cylinderGeometry args={[0.018, 0.018, legH, 10]} />
          <primitive object={leg} attach="material" />
        </mesh>
      ))}

      {/* Alt oturma kutusu — tek parça, düz */}
      <mesh position={[0, legH + sitH / 2 - 0.04, 0]} castShadow receiveShadow>
        <boxGeometry args={[len, sitH, dep]} />
        <primitive object={fabric} attach="material" />
      </mesh>
      {/* Oturma minderi */}
      <mesh position={[0, legH + sitH - 0.02, 0.04]} castShadow>
        <boxGeometry args={[seatW - 0.02, 0.08, dep - 0.10]} />
        <primitive object={fabricLight} attach="material" />
      </mesh>

      {/* Tek parça düz sırtlık (alçak) */}
      <mesh position={[0, legH + sitH + backH / 2, -(dep / 2 - 0.10)]} castShadow>
        <boxGeometry args={[len, backH, 0.16]} />
        <primitive object={fabric} attach="material" />
      </mesh>
      {/* Sırt yastığı (tek uzun parça) */}
      <mesh position={[0, legH + sitH + backH * 0.48, -(dep / 2 - 0.20)]} rotation={[-0.08, 0, 0]} castShadow>
        <boxGeometry args={[seatW - 0.04, backH * 0.80, 0.12]} />
        <primitive object={fabricLight} attach="material" />
      </mesh>

      {/* Düz dar kollar */}
      {[-1, 1].map(s => (
        <mesh key={s} position={[s * (len / 2 - armW / 2), legH + sitH / 2 + backH * 0.2, 0]} castShadow>
          <boxGeometry args={[armW, sitH + backH * 0.4, dep - 0.04]} />
          <primitive object={fabric} attach="material" />
        </mesh>
      ))}
    </group>
  )
}
