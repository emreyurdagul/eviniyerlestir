import * as THREE from 'three'
import type { ReactElement } from 'react'

const leather     = new THREE.MeshLambertMaterial({ color: 0x5a3020 })
const leatherDark = new THREE.MeshLambertMaterial({ color: 0x3a2010 })
const stud        = new THREE.MeshLambertMaterial({ color: 0xb89860 })
const legWood     = new THREE.MeshLambertMaterial({ color: 0x1a0a04 })

/** Chesterfield koltuk — deri, tufted (düğmeli) sırt, rolled kollar, turnaj ayaklar */
export default function SofaChesterfield({ dims }: { dims: Record<string, number> }) {
  const len = (dims.length ?? 240) / 100
  const dep = 0.96
  const sitH = 0.42
  const backH = 0.58
  const armR = 0.18  // rolled kol yarıçapı
  const legH = 0.11

  const seatW = len - armR * 2
  const seatD = dep - 0.12

  return (
    <group>
      {/* Turnaj ayaklar */}
      {[
        [-(len / 2 - 0.14), -(dep / 2 - 0.14)],
        [ (len / 2 - 0.14), -(dep / 2 - 0.14)],
        [-(len / 2 - 0.14),  (dep / 2 - 0.14)],
        [ (len / 2 - 0.14),  (dep / 2 - 0.14)],
      ].map(([px, pz], i) => (
        <mesh key={i} position={[px, legH / 2, pz]} castShadow>
          <cylinderGeometry args={[0.035, 0.025, legH, 10]} />
          <primitive object={legWood} attach="material" />
        </mesh>
      ))}

      {/* Alt taban */}
      <mesh position={[0, legH + 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[len - 0.02, 0.12, dep - 0.04]} />
        <primitive object={leatherDark} attach="material" />
      </mesh>

      {/* Oturma minderleri (2 parça chesterfield) */}
      {[-1, 1].map(i => {
        const cx = (seatW / 4) * i
        return (
          <mesh key={i} position={[cx, sitH - 0.04, 0.02]} castShadow>
            <boxGeometry args={[seatW / 2 - 0.04, 0.16, seatD]} />
            <primitive object={leather} attach="material" />
          </mesh>
        )
      })}

      {/* Arka sırtlık gövdesi */}
      <mesh position={[0, sitH + backH / 2, -(dep / 2 - 0.12)]} castShadow>
        <boxGeometry args={[seatW, backH, 0.22]} />
        <primitive object={leather} attach="material" />
      </mesh>

      {/* Tufted düğme ızgarası (diagonal grid) */}
      {(() => {
        const rows = 3
        const cols = Math.max(4, Math.round(seatW / 0.28))
        const studs: ReactElement[] = []
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const offsetX = (r % 2) * (seatW / cols) * 0.5
            const sx = -seatW / 2 + (seatW / cols) * (c + 0.5) + offsetX
            if (Math.abs(sx) > seatW / 2 - 0.05) continue
            const sy = sitH + backH * (0.25 + r * 0.28)
            studs.push(
              <mesh key={`st-${r}-${c}`} position={[sx, sy, -(dep / 2 - 0.12) + 0.115]} castShadow>
                <sphereGeometry args={[0.025, 10, 8]} />
                <primitive object={stud} attach="material" />
              </mesh>
            )
          }
        }
        return studs
      })()}

      {/* Rolled kollar (silindir) */}
      {[-1, 1].map(s => (
        <group key={s}>
          <mesh
            position={[s * (len / 2 - armR / 2), sitH + armR * 0.3, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            castShadow
          >
            <cylinderGeometry args={[armR, armR, dep - 0.04, 16]} />
            <primitive object={leather} attach="material" />
          </mesh>
          {/* Rolled kolun üst kısmı */}
          <mesh position={[s * (len / 2 - armR / 2), sitH + armR + 0.02, 0]} castShadow>
            <boxGeometry args={[armR * 2 - 0.02, 0.04, dep - 0.08]} />
            <primitive object={leatherDark} attach="material" />
          </mesh>
        </group>
      ))}
    </group>
  )
}
