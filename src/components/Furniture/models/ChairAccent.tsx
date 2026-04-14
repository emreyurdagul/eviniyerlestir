import * as THREE from 'three'

const fabric   = new THREE.MeshLambertMaterial({ color: 0x3a5a6a })
const fabricL  = new THREE.MeshLambertMaterial({ color: 0x4a6a7a })
const legMetal = new THREE.MeshLambertMaterial({ color: 0xb89860 })

/** Aksesuar sandalye — kolsuz, eğrisel sırt, altın metal ayaklar */
export default function ChairAccent({ dims }: { dims: Record<string, number> }) {
  const s = (dims.diameter ?? 90) / 100
  const dep = s * 0.82
  const len = s * 0.82

  const sitH = 0.44
  const backH = 0.52
  const legH = 0.16

  return (
    <group>
      {/* Metal ayaklar (X pattern) */}
      {[
        [-(len / 2 - 0.08), -(dep / 2 - 0.08),  0.12,  0.10],
        [ (len / 2 - 0.08), -(dep / 2 - 0.08), -0.12,  0.10],
        [-(len / 2 - 0.08),  (dep / 2 - 0.08),  0.12, -0.10],
        [ (len / 2 - 0.08),  (dep / 2 - 0.08), -0.12, -0.10],
      ].map(([px, pz, rx, rz], i) => (
        <mesh key={i} position={[px as number, legH / 2, pz as number]} rotation={[rz as number * 0.2, 0, rx as number * 0.2]} castShadow>
          <cylinderGeometry args={[0.014, 0.010, legH, 10]} />
          <primitive object={legMetal} attach="material" />
        </mesh>
      ))}

      {/* Oturma minderi (kalın, yuvarlak köşeli) */}
      <mesh position={[0, legH + 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[len, 0.16, dep]} />
        <primitive object={fabric} attach="material" />
      </mesh>
      <mesh position={[0, legH + 0.18, 0]} castShadow>
        <boxGeometry args={[len - 0.04, 0.06, dep - 0.04]} />
        <primitive object={fabricL} attach="material" />
      </mesh>

      {/* Eğrisel sırtlık — iki yana yatık */}
      <mesh position={[0, sitH + backH / 2 - 0.02, -(dep / 2 - 0.04)]} rotation={[-0.12, 0, 0]} castShadow>
        <boxGeometry args={[len, backH, 0.08]} />
        <primitive object={fabric} attach="material" />
      </mesh>
      {/* Sırtlığın üst kavisli ucu */}
      <mesh position={[0, sitH + backH - 0.02, -(dep / 2 - 0.07)]} rotation={[-0.18, 0, 0]} castShadow>
        <boxGeometry args={[len - 0.04, 0.08, 0.08]} />
        <primitive object={fabricL} attach="material" />
      </mesh>
    </group>
  )
}
