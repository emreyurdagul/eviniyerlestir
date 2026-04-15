import * as THREE from 'three'
import type { ReactElement } from 'react'

const frame   = new THREE.MeshLambertMaterial({ color: 0x58605c })
const frameDk = new THREE.MeshLambertMaterial({ color: 0x3c4240 })
const glass   = new THREE.MeshLambertMaterial({
  color: 0xbfd8df,
  transparent: true,
  opacity: 0.35,
})
const base    = new THREE.MeshLambertMaterial({ color: 0x7c6848 })
const leaf    = new THREE.MeshLambertMaterial({ color: 0x2e7a2e })
const leafLt  = new THREE.MeshLambertMaterial({ color: 0x4a9a44 })
const pot     = new THREE.MeshLambertMaterial({ color: 0x8a5a38 })

/** Sera — küçük kulübe şekli, cam duvarlar, metal iskelet, içinde bitki ipuçları */
export default function Greenhouse({ dims }: { dims: Record<string, number> }) {
  const w = (dims.width ?? 300) / 100
  const d = (dims.depth ?? 250) / 100
  const wallH = 1.60
  const roofH = 0.70
  const baseH = 0.15

  // Çerçeve kalınlığı
  const f = 0.04

  // İskelet: dört köşe sütunu + yatay üst kirişler + orta dikey bölücüler
  const posts: ReactElement[] = [
    [-w / 2, -d / 2],
    [ w / 2, -d / 2],
    [-w / 2,  d / 2],
    [ w / 2,  d / 2],
  ].map(([px, pz], i) => (
    <mesh key={`p-${i}`} position={[px, wallH / 2 + baseH, pz]} castShadow>
      <boxGeometry args={[f, wallH, f]} />
      <primitive object={frame} attach="material" />
    </mesh>
  ))

  return (
    <group>
      {/* Taban silmesi */}
      <mesh position={[0, baseH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, baseH, d]} />
        <primitive object={base} attach="material" />
      </mesh>

      {/* Köşe sütunlar */}
      {posts}

      {/* Üst çerçeve — duvar üstü (4 kenar) */}
      <mesh position={[0, baseH + wallH + f / 2, -d / 2]} castShadow>
        <boxGeometry args={[w, f, f]} />
        <primitive object={frame} attach="material" />
      </mesh>
      <mesh position={[0, baseH + wallH + f / 2,  d / 2]} castShadow>
        <boxGeometry args={[w, f, f]} />
        <primitive object={frame} attach="material" />
      </mesh>
      <mesh position={[-w / 2, baseH + wallH + f / 2, 0]} castShadow>
        <boxGeometry args={[f, f, d]} />
        <primitive object={frame} attach="material" />
      </mesh>
      <mesh position={[ w / 2, baseH + wallH + f / 2, 0]} castShadow>
        <boxGeometry args={[f, f, d]} />
        <primitive object={frame} attach="material" />
      </mesh>

      {/* Duvar camları (4 kenar) */}
      <mesh position={[0, baseH + wallH / 2,  d / 2 - 0.01]}>
        <boxGeometry args={[w - f * 2, wallH - f, 0.01]} />
        <primitive object={glass} attach="material" />
      </mesh>
      <mesh position={[0, baseH + wallH / 2, -d / 2 + 0.01]}>
        <boxGeometry args={[w - f * 2, wallH - f, 0.01]} />
        <primitive object={glass} attach="material" />
      </mesh>
      <mesh position={[-w / 2 + 0.01, baseH + wallH / 2, 0]}>
        <boxGeometry args={[0.01, wallH - f, d - f * 2]} />
        <primitive object={glass} attach="material" />
      </mesh>
      <mesh position={[ w / 2 - 0.01, baseH + wallH / 2, 0]}>
        <boxGeometry args={[0.01, wallH - f, d - f * 2]} />
        <primitive object={glass} attach="material" />
      </mesh>

      {/* Orta dikey bölücü (ön yüzde) — kapı hissi */}
      <mesh position={[0, baseH + wallH / 2, d / 2 - 0.005]} castShadow>
        <boxGeometry args={[f, wallH, 0.02]} />
        <primitive object={frameDk} attach="material" />
      </mesh>

      {/* Çatı — üçgen prizma (iki eğimli panel + mahya) */}
      <mesh
        position={[0, baseH + wallH + roofH / 2, -d / 4]}
        rotation={[Math.atan2(roofH, d / 2), 0, 0]}
        castShadow
      >
        <boxGeometry args={[w, 0.02, Math.sqrt((d / 2) ** 2 + roofH ** 2)]} />
        <primitive object={glass} attach="material" />
      </mesh>
      <mesh
        position={[0, baseH + wallH + roofH / 2,  d / 4]}
        rotation={[-Math.atan2(roofH, d / 2), 0, 0]}
        castShadow
      >
        <boxGeometry args={[w, 0.02, Math.sqrt((d / 2) ** 2 + roofH ** 2)]} />
        <primitive object={glass} attach="material" />
      </mesh>
      {/* Çatı mahyası */}
      <mesh position={[0, baseH + wallH + roofH, 0]} castShadow>
        <boxGeometry args={[w + 0.02, f, f]} />
        <primitive object={frameDk} attach="material" />
      </mesh>

      {/* İçerideki bitki ipuçları — 3 saksı */}
      {[
        [-w / 3, -d / 4],
        [ w / 3, -d / 4],
        [ 0,      d / 3.5],
      ].map(([px, pz], i) => (
        <group key={`plant-${i}`} position={[px, 0, pz]}>
          <mesh position={[0, baseH + 0.08, 0]} castShadow>
            <cylinderGeometry args={[0.10, 0.08, 0.16, 12]} />
            <primitive object={pot} attach="material" />
          </mesh>
          <mesh position={[0, baseH + 0.22, 0]} castShadow>
            <sphereGeometry args={[0.14, 10, 8]} />
            <primitive object={i % 2 === 0 ? leaf : leafLt} attach="material" />
          </mesh>
          <mesh position={[0.05, baseH + 0.32, 0]} castShadow>
            <sphereGeometry args={[0.08, 8, 6]} />
            <primitive object={leafLt} attach="material" />
          </mesh>
        </group>
      ))}
    </group>
  )
}
