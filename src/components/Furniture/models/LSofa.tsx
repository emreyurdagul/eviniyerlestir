import * as THREE from 'three'

const fabric      = new THREE.MeshLambertMaterial({ color: 0xc9b896 })
const fabricLight = new THREE.MeshLambertMaterial({ color: 0xd9c9a8 })
const fabricBack  = new THREE.MeshLambertMaterial({ color: 0xb8a582 })
const wood        = new THREE.MeshLambertMaterial({ color: 0x2a1a08 })
const pillow      = new THREE.MeshLambertMaterial({ color: 0x8a6a4a })

/**
 * L koltuk — gerçek L formu:
 *   ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒   ← ana (uzun) kanat: x ekseni boyunca
 *   ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒     oturma + sırtlık (arka duvar)
 *   ░░░░░░░░░░░░░░░░░░
 *               ▒▒▒▒▒▒
 *               ▒▒▒▒▒▒    ← kısa (şezlong) kanat: z ekseninde dışa taşar
 *               ░░░░░░
 *
 * Boyutlandırma:
 *   length → uzun kanadın toplam uzunluğu (x)
 *   width  → kısa kanadın toplam uzunluğu (z)
 *   depth  → oturma derinliği (her iki kanat için ortak)
 */
export default function LSofa({ dims }: { dims: Record<string, number> }) {
  const len = (dims.length ?? 290) / 100   // uzun kanat (x)
  const wid = (dims.width  ?? 200) / 100   // kısa kanat (z)
  const dep = (dims.depth  ??  95) / 100   // oturma derinliği (her iki kanadın da derinliği)

  const sitH  = 0.44
  const backH = 0.54
  const armW  = 0.18
  const armH  = 0.30
  const legH  = 0.08
  const backT = 0.22  // sırtlık kalınlığı

  // Koordinat sistemi: (0,0) oda yerelindeki L'nin bounding box merkezi.
  // Uzun kanat: arka duvarda (z = -dep/2). Kısa kanat: sağa doğru çıkar (x = +len/2 - dep/2 ... x = +len/2).
  // Bounding box: x ∈ [-len/2, +len/2], z ∈ [-dep/2, +wid - dep/2]
  // Köşe bloğu (dep × dep): uzun kanadın sağ ucunda ve kısa kanadın başında paylaşılır.

  // Uzun kanat oturması: uçtan uca len, derinlik dep, arka duvarda
  const longZ  = -(wid / 2 - dep / 2)       // merkezi arka duvarda
  // Kısa kanat oturması: sağ uçta, uzunluk wid, derinlik dep
  const shortX =  (len / 2 - dep / 2)
  // Kısa kanadın uzunluğu: köşe hariç
  const shortLen = wid - dep

  return (
    <group>
      {/* ─── Ayaklar ─── */}
      {[
        // Uzun kanat ayakları
        [-(len / 2 - 0.12), longZ - dep / 2 + 0.12],
        [-(len / 2 - 0.12), longZ + dep / 2 - 0.12],
        [ (len / 2 - 0.12), longZ - dep / 2 + 0.12],
        // Kısa kanat ayakları (köşe hariç)
        [ shortX - dep / 2 + 0.12, longZ + dep / 2 - 0.12 + shortLen],
        [ shortX + dep / 2 - 0.12, longZ + dep / 2 - 0.12 + shortLen],
      ].map(([px, pz], i) => (
        <mesh key={i} position={[px, legH / 2, pz]} castShadow>
          <boxGeometry args={[0.06, legH, 0.06]} />
          <primitive object={wood} attach="material" />
        </mesh>
      ))}

      {/* ─── Uzun kanat ahşap taban ─── */}
      <mesh position={[0, legH + 0.05, longZ]} castShadow receiveShadow>
        <boxGeometry args={[len - 0.02, 0.10, dep - 0.04]} />
        <primitive object={wood} attach="material" />
      </mesh>
      {/* Kısa kanat ahşap taban (köşe hariç) */}
      <mesh position={[shortX, legH + 0.05, longZ + dep / 2 + shortLen / 2]} castShadow receiveShadow>
        <boxGeometry args={[dep - 0.04, 0.10, shortLen - 0.02]} />
        <primitive object={wood} attach="material" />
      </mesh>

      {/* ─── Uzun kanat oturma minderi (köşe hariç) ─── */}
      {(() => {
        const seatW = len - dep - armW  // sol kol + köşe kesilir
        const seatX = -(armW / 2) - (dep / 2)  // sol kol + köşeyi çıkar → merkez
        return (
          <>
            <mesh position={[seatX, sitH - 0.05, longZ + 0.04]} castShadow>
              <boxGeometry args={[seatW, 0.18, dep - 0.12]} />
              <primitive object={fabricLight} attach="material" />
            </mesh>
            <mesh position={[seatX, sitH + 0.04, longZ + 0.04]} castShadow>
              <boxGeometry args={[seatW - 0.03, 0.06, dep - 0.15]} />
              <primitive object={fabric} attach="material" />
            </mesh>
          </>
        )
      })()}

      {/* ─── Köşe (paylaşılan) minder ─── */}
      <mesh position={[shortX, sitH - 0.05, longZ + 0.02]} castShadow>
        <boxGeometry args={[dep - 0.04, 0.18, dep - 0.12]} />
        <primitive object={fabricLight} attach="material" />
      </mesh>
      <mesh position={[shortX, sitH + 0.04, longZ + 0.02]} castShadow>
        <boxGeometry args={[dep - 0.08, 0.06, dep - 0.15]} />
        <primitive object={fabric} attach="material" />
      </mesh>

      {/* ─── Kısa kanat şezlong minderi (köşe hariç) ─── */}
      {shortLen > 0.1 && (
        <>
          <mesh position={[shortX, sitH - 0.05, longZ + dep / 2 + shortLen / 2]} castShadow>
            <boxGeometry args={[dep - 0.12, 0.18, shortLen]} />
            <primitive object={fabricLight} attach="material" />
          </mesh>
          <mesh position={[shortX, sitH + 0.04, longZ + dep / 2 + shortLen / 2]} castShadow>
            <boxGeometry args={[dep - 0.15, 0.06, shortLen - 0.03]} />
            <primitive object={fabric} attach="material" />
          </mesh>
        </>
      )}

      {/* ─── Uzun kanat sırtlığı (arka duvar boyunca) ─── */}
      <mesh position={[0, sitH + backH / 2, longZ - (dep / 2 - backT / 2)]} castShadow>
        <boxGeometry args={[len, backH, backT]} />
        <primitive object={fabricBack} attach="material" />
      </mesh>
      {/* Sırt yastıkları (uzun kanat) */}
      {(() => {
        const pillowCount = Math.max(2, Math.round(len / 0.85))
        const availW = len - armW - dep  // kollar ve köşe hariç
        const startX = -(len / 2 - armW) + 0.02
        const cushW = (availW - 0.04) / pillowCount
        return Array.from({ length: pillowCount }, (_, i) => {
          const cx = startX + cushW / 2 + i * cushW
          return (
            <mesh
              key={`lb-${i}`}
              position={[cx, sitH + backH * 0.55, longZ - (dep / 2 - backT - 0.07)]}
              rotation={[-0.12, 0, 0]}
              castShadow
            >
              <boxGeometry args={[cushW - 0.03, backH * 0.80, 0.13]} />
              <primitive object={fabricLight} attach="material" />
            </mesh>
          )
        })
      })()}

      {/* ─── Kısa kanat sırtlığı (sağ uçta, z ekseni boyunca) ─── */}
      {shortLen > 0.1 && (
        <>
          <mesh position={[shortX + (dep / 2 - backT / 2), sitH + backH / 2, longZ + dep / 2 + shortLen / 2]} castShadow>
            <boxGeometry args={[backT, backH, shortLen]} />
            <primitive object={fabricBack} attach="material" />
          </mesh>
          {/* Sırt yastıkları (kısa kanat) */}
          {(() => {
            const pillowCount = Math.max(1, Math.round(shortLen / 0.70))
            const cushD = (shortLen - 0.06) / pillowCount
            return Array.from({ length: pillowCount }, (_, i) => {
              const cz = longZ + dep / 2 + 0.03 + cushD / 2 + i * cushD
              return (
                <mesh
                  key={`sb-${i}`}
                  position={[shortX + (dep / 2 - backT - 0.07), sitH + backH * 0.55, cz]}
                  rotation={[0, 0, 0.12]}
                  castShadow
                >
                  <boxGeometry args={[0.13, backH * 0.80, cushD - 0.03]} />
                  <primitive object={fabricLight} attach="material" />
                </mesh>
              )
            })
          })()}
        </>
      )}

      {/* ─── Sol kol (uzun kanadın sol ucunda) ─── */}
      <mesh position={[-(len / 2 - armW / 2), sitH - 0.05 + armH / 2 + 0.04, longZ]} castShadow>
        <boxGeometry args={[armW, armH + 0.12, dep - 0.04]} />
        <primitive object={fabric} attach="material" />
      </mesh>
      <mesh position={[-(len / 2 - armW / 2), sitH + armH + 0.02, longZ]} castShadow>
        <boxGeometry args={[armW - 0.02, 0.08, dep - 0.08]} />
        <primitive object={fabricLight} attach="material" />
      </mesh>

      {/* ─── Kısa kanadın serbest ucunda kol (opsiyonel, daha küçük) ─── */}
      {shortLen > 0.1 && (
        <>
          <mesh position={[shortX, sitH - 0.05 + armH / 2 + 0.04, longZ + dep / 2 + shortLen - armW / 2]} castShadow>
            <boxGeometry args={[dep - 0.04, armH + 0.12, armW]} />
            <primitive object={fabric} attach="material" />
          </mesh>
          <mesh position={[shortX, sitH + armH + 0.02, longZ + dep / 2 + shortLen - armW / 2]} castShadow>
            <boxGeometry args={[dep - 0.08, 0.08, armW - 0.02]} />
            <primitive object={fabricLight} attach="material" />
          </mesh>
        </>
      )}

      {/* ─── Dekoratif yastıklar ─── */}
      <mesh position={[-(len / 4), sitH + 0.25, longZ + 0.18]} rotation={[0, 0.2, 0.15]} castShadow>
        <boxGeometry args={[0.34, 0.30, 0.12]} />
        <primitive object={pillow} attach="material" />
      </mesh>
      {shortLen > 0.3 && (
        <mesh position={[shortX - 0.15, sitH + 0.24, longZ + dep / 2 + shortLen * 0.4]} rotation={[0, -0.4, -0.1]} castShadow>
          <boxGeometry args={[0.32, 0.28, 0.11]} />
          <primitive object={pillow} attach="material" />
        </mesh>
      )}
    </group>
  )
}
