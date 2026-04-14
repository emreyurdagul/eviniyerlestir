import * as THREE from 'three'

const fabric      = new THREE.MeshLambertMaterial({ color: 0xa8a59a })
const fabricLight = new THREE.MeshLambertMaterial({ color: 0xbab7ab })
const fabricBack  = new THREE.MeshLambertMaterial({ color: 0x908d82 })
const wood        = new THREE.MeshLambertMaterial({ color: 0x2a1a08 })
const pillow      = new THREE.MeshLambertMaterial({ color: 0x5a504a })

/** L koltuk — Şezlonglu (chaise). Uzun kanat normal oturma, kısa kanat
 *  uzun minderli şezlong (sırtlıksız, açık kol). */
export default function LSofaChaise({ dims }: { dims: Record<string, number> }) {
  const len = (dims.length ?? 290) / 100
  const wid = (dims.width  ?? 200) / 100
  const dep = (dims.depth  ??  95) / 100

  const sitH = 0.42
  const backH = 0.52
  const armW = 0.16
  const armH = 0.28
  const legH = 0.08
  const backT = 0.20

  const longZ = -(wid / 2 - dep / 2)
  const shortX = (len / 2 - dep / 2)
  const shortLen = wid - dep

  return (
    <group>
      {/* Ayaklar */}
      {[
        [-(len / 2 - 0.12), longZ - dep / 2 + 0.12],
        [-(len / 2 - 0.12), longZ + dep / 2 - 0.12],
        [ (len / 2 - 0.12), longZ - dep / 2 + 0.12],
        [ shortX - dep / 2 + 0.12, longZ + dep / 2 + shortLen - 0.12],
        [ shortX + dep / 2 - 0.12, longZ + dep / 2 + shortLen - 0.12],
      ].map(([px, pz], i) => (
        <mesh key={i} position={[px, legH / 2, pz]} castShadow>
          <boxGeometry args={[0.06, legH, 0.06]} />
          <primitive object={wood} attach="material" />
        </mesh>
      ))}

      {/* Uzun kanat taban */}
      <mesh position={[0, legH + 0.05, longZ]} castShadow>
        <boxGeometry args={[len - 0.02, 0.10, dep - 0.04]} />
        <primitive object={wood} attach="material" />
      </mesh>
      {/* Kısa şezlong taban */}
      <mesh position={[shortX, legH + 0.05, longZ + dep / 2 + shortLen / 2]} castShadow>
        <boxGeometry args={[dep - 0.04, 0.10, shortLen - 0.02]} />
        <primitive object={wood} attach="material" />
      </mesh>

      {/* Uzun kanat oturma (sol kol + köşe hariç) */}
      {(() => {
        const seatW = len - dep - armW
        const seatX = -(armW / 2) - (dep / 2)
        return (
          <>
            <mesh position={[seatX, sitH - 0.06, longZ + 0.02]} castShadow>
              <boxGeometry args={[seatW, 0.18, dep - 0.12]} />
              <primitive object={fabricLight} attach="material" />
            </mesh>
            <mesh position={[seatX, sitH + 0.04, longZ + 0.02]} castShadow>
              <boxGeometry args={[seatW - 0.03, 0.06, dep - 0.15]} />
              <primitive object={fabric} attach="material" />
            </mesh>
          </>
        )
      })()}

      {/* Köşe + şezlong tek parça uzun yataklı minder */}
      <mesh position={[shortX, sitH - 0.06, longZ + (shortLen + dep) / 2 - dep / 2]} castShadow>
        <boxGeometry args={[dep - 0.04, 0.18, shortLen + dep - 0.12]} />
        <primitive object={fabricLight} attach="material" />
      </mesh>
      <mesh position={[shortX, sitH + 0.04, longZ + (shortLen + dep) / 2 - dep / 2]} castShadow>
        <boxGeometry args={[dep - 0.08, 0.06, shortLen + dep - 0.15]} />
        <primitive object={fabric} attach="material" />
      </mesh>

      {/* Uzun kanat sırtlığı */}
      <mesh position={[0, sitH + backH / 2, longZ - (dep / 2 - backT / 2)]} castShadow>
        <boxGeometry args={[len, backH, backT]} />
        <primitive object={fabricBack} attach="material" />
      </mesh>
      {/* Sırt yastıkları (uzun kanat) */}
      {(() => {
        const pillowCount = Math.max(2, Math.round(len / 0.85))
        const availW = len - armW - dep
        const startX = -(len / 2 - armW) + 0.02
        const cushW = (availW - 0.04) / pillowCount
        return Array.from({ length: pillowCount }, (_, i) => {
          const cx = startX + cushW / 2 + i * cushW
          return (
            <mesh
              key={`lb-${i}`}
              position={[cx, sitH + backH * 0.54, longZ - (dep / 2 - backT - 0.06)]}
              rotation={[-0.10, 0, 0]}
              castShadow
            >
              <boxGeometry args={[cushW - 0.03, backH * 0.80, 0.12]} />
              <primitive object={fabricLight} attach="material" />
            </mesh>
          )
        })
      })()}

      {/* Şezlong yanında alçak arka destek (sağ tarafta sadece yarım yükseklik) */}
      {shortLen > 0.1 && (
        <mesh
          position={[shortX + (dep / 2 - backT / 2), sitH + backH * 0.25, longZ + dep / 2 + shortLen / 2]}
          castShadow
        >
          <boxGeometry args={[backT, backH * 0.5, shortLen]} />
          <primitive object={fabricBack} attach="material" />
        </mesh>
      )}

      {/* Sol kol (uzun kanadın sol ucu) */}
      <mesh position={[-(len / 2 - armW / 2), sitH - 0.05 + armH / 2 + 0.04, longZ]} castShadow>
        <boxGeometry args={[armW, armH + 0.10, dep - 0.04]} />
        <primitive object={fabric} attach="material" />
      </mesh>
      <mesh position={[-(len / 2 - armW / 2), sitH + armH + 0.02, longZ]} castShadow>
        <boxGeometry args={[armW - 0.02, 0.06, dep - 0.08]} />
        <primitive object={fabricLight} attach="material" />
      </mesh>

      {/* Dekoratif yastık */}
      <mesh position={[-(len / 4), sitH + 0.22, longZ + 0.18]} rotation={[0, 0.2, 0.15]} castShadow>
        <boxGeometry args={[0.34, 0.28, 0.11]} />
        <primitive object={pillow} attach="material" />
      </mesh>
    </group>
  )
}
