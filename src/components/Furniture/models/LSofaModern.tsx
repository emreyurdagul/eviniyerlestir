import * as THREE from 'three'

const fabric      = new THREE.MeshLambertMaterial({ color: 0x5a6a7a })
const fabricLight = new THREE.MeshLambertMaterial({ color: 0x6a7a8a })
const leg         = new THREE.MeshLambertMaterial({ color: 0x1a1a1a })

/** L koltuk — modern modüler, kolsuz, alçak profil, ince metal ayaklar */
export default function LSofaModern({ dims }: { dims: Record<string, number> }) {
  const len = (dims.length ?? 290) / 100
  const wid = (dims.width  ?? 200) / 100
  const dep = (dims.depth  ??  95) / 100

  const sitH = 0.38
  const backH = 0.42
  const legH = 0.09

  const longZ = -(wid / 2 - dep / 2)
  const shortX = (len / 2 - dep / 2)
  const shortLen = wid - dep

  return (
    <group>
      {/* Metal ayaklar */}
      {[
        [-(len / 2 - 0.10), longZ - dep / 2 + 0.10],
        [-(len / 2 - 0.10), longZ + dep / 2 - 0.10],
        [ (len / 2 - 0.10), longZ - dep / 2 + 0.10],
        [ shortX - dep / 2 + 0.10, longZ + dep / 2 + shortLen - 0.10],
        [ shortX + dep / 2 - 0.10, longZ + dep / 2 + shortLen - 0.10],
      ].map(([px, pz], i) => (
        <mesh key={i} position={[px, legH / 2, pz]} castShadow>
          <cylinderGeometry args={[0.018, 0.018, legH, 8]} />
          <primitive object={leg} attach="material" />
        </mesh>
      ))}

      {/* Uzun kanat oturma kutusu (tek parça) */}
      <mesh position={[0, legH + sitH / 2 - 0.04, longZ]} castShadow>
        <boxGeometry args={[len, sitH, dep - 0.04]} />
        <primitive object={fabric} attach="material" />
      </mesh>
      {/* Kısa kanat oturma kutusu */}
      <mesh position={[shortX, legH + sitH / 2 - 0.04, longZ + dep / 2 + shortLen / 2]} castShadow>
        <boxGeometry args={[dep - 0.04, sitH, shortLen]} />
        <primitive object={fabric} attach="material" />
      </mesh>

      {/* Oturma minderi — uzun kanat */}
      <mesh position={[0, legH + sitH - 0.02, longZ + 0.04]} castShadow>
        <boxGeometry args={[len - 0.04, 0.06, dep - 0.12]} />
        <primitive object={fabricLight} attach="material" />
      </mesh>
      {/* Oturma minderi — kısa kanat */}
      <mesh position={[shortX, legH + sitH - 0.02, longZ + dep / 2 + shortLen / 2]} castShadow>
        <boxGeometry args={[dep - 0.12, 0.06, shortLen - 0.04]} />
        <primitive object={fabricLight} attach="material" />
      </mesh>

      {/* Düz sırtlık — uzun kanat */}
      <mesh position={[0, legH + sitH + backH / 2, longZ - (dep / 2 - 0.08)]} castShadow>
        <boxGeometry args={[len, backH, 0.16]} />
        <primitive object={fabric} attach="material" />
      </mesh>
      {/* Düz sırtlık — kısa kanat */}
      {shortLen > 0.1 && (
        <mesh
          position={[shortX + (dep / 2 - 0.08), legH + sitH + backH / 2, longZ + dep / 2 + shortLen / 2]}
          castShadow
        >
          <boxGeometry args={[0.16, backH, shortLen]} />
          <primitive object={fabric} attach="material" />
        </mesh>
      )}

      {/* Sırt minderleri */}
      <mesh
        position={[0, legH + sitH + backH * 0.48, longZ - (dep / 2 - 0.16)]}
        rotation={[-0.08, 0, 0]}
        castShadow
      >
        <boxGeometry args={[len - dep - 0.08, backH * 0.82, 0.12]} />
        <primitive object={fabricLight} attach="material" />
      </mesh>
      {shortLen > 0.1 && (
        <mesh
          position={[shortX + (dep / 2 - 0.16), legH + sitH + backH * 0.48, longZ + dep / 2 + shortLen / 2]}
          rotation={[0, 0, 0.08]}
          castShadow
        >
          <boxGeometry args={[0.12, backH * 0.82, shortLen - 0.08]} />
          <primitive object={fabricLight} attach="material" />
        </mesh>
      )}
    </group>
  )
}
