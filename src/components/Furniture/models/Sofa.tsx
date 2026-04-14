import * as THREE from 'three'

const fabric      = new THREE.MeshLambertMaterial({ color: 0xc9b896 })
const fabricLight = new THREE.MeshLambertMaterial({ color: 0xd9c9a8 })
const fabricBack  = new THREE.MeshLambertMaterial({ color: 0xb8a582 })
const wood        = new THREE.MeshLambertMaterial({ color: 0x2a1a08 })
const pillow      = new THREE.MeshLambertMaterial({ color: 0x8a6a4a })

/**
 * 3'lü koltuk — gerçek koltuk proporsiyonlarıyla:
 *  - Alt ahşap taban + küçük ayaklar
 *  - Tek parça oturak minderi (3'e bölünmüş hatlarla)
 *  - Arka sırtlıkta 3 ayrı yastık
 *  - İki yanda dolgun yuvarlanmış kol (yastıklı)
 *  - Sağa/arkaya 2 dekoratif yastık
 */
export default function Sofa({ dims }: { dims: Record<string, number> }) {
  const len = (dims.length ?? 240) / 100
  const dep = 0.92              // toplam derinlik
  const sitH = 0.44             // oturma yüksekliği
  const backH = 0.56            // sırtlık yüksekliği (oturma yüzeyinden)
  const armW = 0.18             // kol kalınlığı
  const armH = 0.30             // kol yüksekliği (oturma yüzeyinden)
  const legH = 0.08             // ayak yüksekliği

  const seatW  = len - armW * 2
  const seatD  = dep - 0.12
  const seatZ  = 0.04           // sırtlıktan önde
  const backZ  = -(dep / 2 - 0.12)

  return (
    <group>
      {/* ─── Ayaklar ─── */}
      {[
        [-(len / 2 - 0.12), -(dep / 2 - 0.12)],
        [ (len / 2 - 0.12), -(dep / 2 - 0.12)],
        [-(len / 2 - 0.12),  (dep / 2 - 0.12)],
        [ (len / 2 - 0.12),  (dep / 2 - 0.12)],
      ].map(([px, pz], i) => (
        <mesh key={i} position={[px, legH / 2, pz]} castShadow>
          <boxGeometry args={[0.06, legH, 0.06]} />
          <primitive object={wood} attach="material" />
        </mesh>
      ))}

      {/* ─── Alt taban (ahşap çerçeve) ─── */}
      <mesh position={[0, legH + 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[len - 0.02, 0.10, dep - 0.04]} />
        <primitive object={wood} attach="material" />
      </mesh>

      {/* ─── Oturma minderi (tek parça) ─── */}
      <mesh position={[0, sitH - 0.05, seatZ]} castShadow>
        <boxGeometry args={[seatW, 0.18, seatD]} />
        <primitive object={fabricLight} attach="material" />
      </mesh>
      {/* Oturma minderi üst yuvarlatma (kabarık) */}
      <mesh position={[0, sitH + 0.04, seatZ]} castShadow>
        <boxGeometry args={[seatW - 0.03, 0.06, seatD - 0.03]} />
        <primitive object={fabric} attach="material" />
      </mesh>
      {/* 3'e ayrılmış dikiş çizgileri */}
      {[1, 2].map(i => {
        const x = -seatW / 2 + (seatW / 3) * i
        return (
          <mesh key={i} position={[x, sitH + 0.08, seatZ]}>
            <boxGeometry args={[0.012, 0.012, seatD - 0.06]} />
            <primitive object={wood} attach="material" />
          </mesh>
        )
      })}

      {/* ─── Sırtlık gövdesi ─── */}
      <mesh position={[0, sitH + backH / 2, backZ]} castShadow>
        <boxGeometry args={[seatW, backH, 0.22]} />
        <primitive object={fabricBack} attach="material" />
      </mesh>
      {/* 3 ayrı sırt yastığı */}
      {[0, 1, 2].map(i => {
        const cushW = (seatW - 0.06) / 3
        const cx = -seatW / 2 + 0.03 + cushW / 2 + i * cushW
        return (
          <mesh key={i} position={[cx, sitH + backH * 0.55, backZ + 0.14]} rotation={[-0.12, 0, 0]} castShadow>
            <boxGeometry args={[cushW - 0.02, backH * 0.82, 0.14]} />
            <primitive object={fabricLight} attach="material" />
          </mesh>
        )
      })}

      {/* ─── Kollar (her iki yanda) ─── */}
      {[-1, 1].map(s => (
        <group key={s}>
          {/* Kol gövdesi */}
          <mesh position={[s * (len / 2 - armW / 2), sitH - 0.05 + armH / 2 + 0.04, 0]} castShadow>
            <boxGeometry args={[armW, armH + 0.12, dep - 0.04]} />
            <primitive object={fabric} attach="material" />
          </mesh>
          {/* Kol üstü yuvarlatma (minder) */}
          <mesh position={[s * (len / 2 - armW / 2), sitH + armH + 0.02, 0]} castShadow>
            <boxGeometry args={[armW - 0.02, 0.08, dep - 0.08]} />
            <primitive object={fabricLight} attach="material" />
          </mesh>
        </group>
      ))}

      {/* ─── Dekoratif yastıklar ─── */}
      <mesh position={[-seatW * 0.3, sitH + 0.25, seatZ + 0.18]} rotation={[0, 0.2, 0.15]} castShadow>
        <boxGeometry args={[0.34, 0.30, 0.12]} />
        <primitive object={pillow} attach="material" />
      </mesh>
      <mesh position={[seatW * 0.28, sitH + 0.22, seatZ + 0.20]} rotation={[0, -0.3, -0.1]} castShadow>
        <boxGeometry args={[0.32, 0.28, 0.11]} />
        <primitive object={pillow} attach="material" />
      </mesh>
    </group>
  )
}
