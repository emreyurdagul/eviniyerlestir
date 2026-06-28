import * as THREE from 'three'
import type { ReactElement } from 'react'

const wood     = new THREE.MeshLambertMaterial({ color: 0x6a4830 })
const woodLite = new THREE.MeshLambertMaterial({ color: 0x8a6046 })
const book1    = new THREE.MeshLambertMaterial({ color: 0x7a3030 })
const book2    = new THREE.MeshLambertMaterial({ color: 0x2a5070 })
const book3    = new THREE.MeshLambertMaterial({ color: 0x506030 })
const deco     = new THREE.MeshLambertMaterial({ color: 0xc8b090 })
// Cam kapılı varyant için ek malzemeler
const glassMat  = new THREE.MeshLambertMaterial({ color: 0xbfe0ef, transparent: true, opacity: 0.3 })
const frameMat  = new THREE.MeshLambertMaterial({ color: 0x3a2a1e })
const handleMat = new THREE.MeshLambertMaterial({ color: 0xb8b8c0 })

/**
 * Ofis kitaplığı — dar, uzun, açık raflı; ShelfCube'dan farklı: tek kolon, dolap benzeri.
 * Varyantlar (geometri varyant id'sine göre dallanır):
 *   - '3shelf' → az (3) raflı, geniş aralıklı, daha sade açık kitaplık
 *   - '5shelf' → standart uzun, sık raflı açık kitaplık (orijinal davranış)
 *   - 'glass'  → üst bölmesi iki cam kapı + çerçeve + kulp ile kapalı vitrinli kitaplık
 */
export default function Bookcase({
  dims,
  variant = '5shelf',
}: {
  dims: Record<string, number>
  variant?: string
}) {
  const w = (dims.width ?? 80) / 100
  const h = (dims.height ?? 200) / 100
  const d = 0.30

  // Varyanta göre raf sayısı — '5shelf'/'glass' orijinaldeki gibi yüksekliğe
  // göre hesaplanır, '3shelf' ise sabit 3 bölmeli (geniş aralıklı) durur.
  const shelfCount =
    variant === '3shelf' ? 3 : Math.max(4, Math.round(h / 0.40))
  const sideT = 0.025
  const shelfT = 0.022

  // Yan paneller
  const sides = [-1, 1].map((sx) => (
    <mesh
      key={`side-${sx}`}
      position={[sx * (w / 2 - sideT / 2), h / 2, 0]}
      castShadow
    >
      <boxGeometry args={[sideT, h, d]} />
      <primitive object={wood} attach="material" />
    </mesh>
  ))

  // Alt taban
  const baseMesh = (
    <mesh position={[0, 0.03, 0]} castShadow>
      <boxGeometry args={[w, 0.06, d]} />
      <primitive object={wood} attach="material" />
    </mesh>
  )

  // Üst kapak
  const topMesh = (
    <mesh position={[0, h - 0.015, 0]} castShadow>
      <boxGeometry args={[w, 0.03, d]} />
      <primitive object={wood} attach="material" />
    </mesh>
  )

  // Arka panel
  const back = (
    <mesh position={[0, h / 2, -d / 2 + 0.005]}>
      <boxGeometry args={[w - 0.02, h - 0.04, 0.008]} />
      <primitive object={woodLite} attach="material" />
    </mesh>
  )

  // Raflar + dolgu
  const usableH = h - 0.12
  const gap = usableH / shelfCount
  const shelves: ReactElement[] = []
  const fillers: ReactElement[] = []
  for (let i = 1; i < shelfCount; i++) {
    const y = 0.06 + i * gap
    shelves.push(
      <mesh key={`sh-${i}`} position={[0, y, 0]} castShadow>
        <boxGeometry args={[w - 0.05, shelfT, d - 0.02]} />
        <primitive object={wood} attach="material" />
      </mesh>
    )
  }

  // Cam varyantta üst bölme kapalı kalacağı için dolgu yalnızca alt (açık)
  // bölmelere konur; diğer varyantlarda tüm raflara konur (orijinal davranış).
  const glassDoorBottom = h * 0.42
  for (let i = 0; i < shelfCount; i++) {
    const yBottom = 0.06 + i * gap + shelfT / 2
    if (variant === 'glass' && yBottom > glassDoorBottom) continue
    const seed = (i * 13) % 5
    if (seed === 0) {
      // Kitap dizisi
      const bookCount = 5
      const bookW = (w - 0.12) / bookCount
      for (let b = 0; b < bookCount; b++) {
        const bx = -w / 2 + 0.06 + bookW * (b + 0.5)
        const bh = 0.18 + ((b * 7) % 5) * 0.02
        const mat = [book1, book2, book3][b % 3]
        fillers.push(
          <mesh
            key={`bk-${i}-${b}`}
            position={[bx, yBottom + bh / 2, 0.02]}
            castShadow
          >
            <boxGeometry args={[bookW * 0.85, bh, d * 0.55]} />
            <primitive object={mat} attach="material" />
          </mesh>
        )
      }
    } else if (seed === 1) {
      // Yatık kitap yığını + dekoratif kutu
      fillers.push(
        <mesh
          key={`st-${i}`}
          position={[-w / 4, yBottom + 0.05, 0.02]}
          castShadow
        >
          <boxGeometry args={[w * 0.3, 0.10, d * 0.6]} />
          <primitive object={book1} attach="material" />
        </mesh>
      )
      fillers.push(
        <mesh
          key={`vz-${i}`}
          position={[w / 4, yBottom + 0.09, 0.02]}
          castShadow
        >
          <cylinderGeometry args={[0.06, 0.04, 0.18, 14]} />
          <primitive object={deco} attach="material" />
        </mesh>
      )
    } else if (seed === 2) {
      // Az kitap sola yaslı
      const bookCount = 3
      const bookW = 0.06
      for (let b = 0; b < bookCount; b++) {
        const bx = -w / 2 + 0.08 + bookW * (b + 0.5)
        fillers.push(
          <mesh
            key={`bk2-${i}-${b}`}
            position={[bx, yBottom + 0.12, 0.02]}
            castShadow
          >
            <boxGeometry args={[bookW * 0.85, 0.24, d * 0.55]} />
            <primitive object={[book2, book3, book1][b % 3]} attach="material" />
          </mesh>
        )
      }
    }
  }

  // Cam kapılı varyant — üst bölmeyi kaplayan iki cam kapı (çerçeve + kulp)
  // ve açık/kapalı bölmeyi ayıran yatay ara taban.
  const doors: ReactElement[] = []
  if (variant === 'glass') {
    const doorBottom = glassDoorBottom
    const doorTop = h - 0.05
    const doorH = doorTop - doorBottom
    const doorCY = (doorBottom + doorTop) / 2
    const zFront = d / 2 - 0.006
    const doorW = (w - 0.06) / 2
    const railT = 0.02

    // Açık alt bölme ile cam üst bölmeyi ayıran ara taban
    doors.push(
      <mesh key="divider" position={[0, doorBottom, 0]} castShadow>
        <boxGeometry args={[w - 0.05, 0.03, d - 0.01]} />
        <primitive object={wood} attach="material" />
      </mesh>
    )

    for (const sx of [-1, 1] as const) {
      const cx = sx * (w / 2 - 0.03 - doorW / 2)
      // Cam panel
      doors.push(
        <mesh key={`glass-${sx}`} position={[cx, doorCY, zFront]}>
          <boxGeometry args={[doorW - 2 * railT, doorH - 2 * railT, 0.008]} />
          <primitive object={glassMat} attach="material" />
        </mesh>
      )
      // Çerçeve: üst + alt yatay çıta
      doors.push(
        <mesh
          key={`fr-t-${sx}`}
          position={[cx, doorCY + doorH / 2 - railT / 2, zFront]}
          castShadow
        >
          <boxGeometry args={[doorW, railT, 0.014]} />
          <primitive object={frameMat} attach="material" />
        </mesh>
      )
      doors.push(
        <mesh
          key={`fr-b-${sx}`}
          position={[cx, doorCY - doorH / 2 + railT / 2, zFront]}
          castShadow
        >
          <boxGeometry args={[doorW, railT, 0.014]} />
          <primitive object={frameMat} attach="material" />
        </mesh>
      )
      // Çerçeve: sol + sağ dikme
      doors.push(
        <mesh
          key={`fr-l-${sx}`}
          position={[cx - doorW / 2 + railT / 2, doorCY, zFront]}
          castShadow
        >
          <boxGeometry args={[railT, doorH, 0.014]} />
          <primitive object={frameMat} attach="material" />
        </mesh>
      )
      doors.push(
        <mesh
          key={`fr-r-${sx}`}
          position={[cx + doorW / 2 - railT / 2, doorCY, zFront]}
          castShadow
        >
          <boxGeometry args={[railT, doorH, 0.014]} />
          <primitive object={frameMat} attach="material" />
        </mesh>
      )
      // Kulp — orta dikmeye yakın dikey çubuk
      doors.push(
        <mesh
          key={`hd-${sx}`}
          position={[cx - sx * (doorW / 2 - 0.04), doorCY, zFront + 0.012]}
          castShadow
        >
          <cylinderGeometry args={[0.008, 0.008, 0.16, 10]} />
          <primitive object={handleMat} attach="material" />
        </mesh>
      )
    }
  }

  return (
    <group>
      {sides}
      {baseMesh}
      {topMesh}
      {back}
      {shelves}
      {fillers}
      {doors}
    </group>
  )
}
