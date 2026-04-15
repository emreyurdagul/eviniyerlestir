/**
 * RoofMesh — bir katın odalarının üstüne çatı çizer.
 *
 * Stratejisi:
 *   - Kat'taki tüm odaların bounding box'ını birleştir (dış cephe footprint)
 *   - roofType'a göre uygun 3D geometri üret:
 *     - 'flat'    → basit dikdörtgen plate (düz çatı/teras)
 *     - 'gable'   → üçgen iki eğimli (beşik çatı)
 *     - 'hip'     → 4 yönlü piramit (dört eğimli)
 *     - 'mansard' → iki kademeli (alt dik + üst düz)
 *
 * Çatı her zaman en dış bbox'u kaplar — iç odaların detaylı formunu takip
 * etmez (kompleks GI hesabından kaçınır, standart mimari yaklaşım).
 *
 * Y pozisyonu: kat.baseY + kat.ceilingHeight (katın tavanının hemen üstü).
 * Parent <group> App.tsx'te zaten baseY'ye konumlu, bu yüzden burada sadece
 * ceilingHeight kadar yukarı çıkıyoruz (lokal Y).
 */

import { useMemo } from 'react'
import * as THREE from 'three'
import type { Room, RoofType } from '../../types'

interface RoofMeshProps {
  rooms: Room[]           // Bu kattaki odalar
  roofType: RoofType
  ceilingHeight: number   // Katın tavan yüksekliği (lokal Y ofseti)
}

const TILE_COLOR    = 0x8b3a2a   // kiremit kırmızısı
const TILE_DARK     = 0x6a2a1a   // koyu kiremit
const FLAT_COLOR    = 0x8a8a88   // düz çatı gri
const EAVE_COLOR    = 0xe8e4dc   // saçak krem

// Module-level materials (churn önle)
const tileMat    = new THREE.MeshLambertMaterial({ color: TILE_COLOR })
const tileDkMat  = new THREE.MeshLambertMaterial({ color: TILE_DARK })
const flatMat    = new THREE.MeshLambertMaterial({ color: FLAT_COLOR })
const eaveMat    = new THREE.MeshLambertMaterial({ color: EAVE_COLOR })

/**
 * Odalar listesinden birleşik bounding box (dış cephe) hesapla.
 * Rotasyon yok sayılır — basitleştirilmiş axis-aligned box.
 */
function computeBoundingBox(rooms: Room[]): { minX: number; maxX: number; minZ: number; maxZ: number; center: [number, number] } | null {
  if (rooms.length === 0) return null
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity
  for (const r of rooms) {
    const halfW = r.widthCm / 200
    const halfL = r.lengthCm / 200
    const [cx, cz] = r.position
    if (cx - halfW < minX) minX = cx - halfW
    if (cx + halfW > maxX) maxX = cx + halfW
    if (cz - halfL < minZ) minZ = cz - halfL
    if (cz + halfL > maxZ) maxZ = cz + halfL
  }
  return { minX, maxX, minZ, maxZ, center: [(minX + maxX) / 2, (minZ + maxZ) / 2] }
}

export default function RoofMesh({ rooms, roofType, ceilingHeight }: RoofMeshProps) {
  const bb = useMemo(() => computeBoundingBox(rooms), [rooms])

  if (!bb || roofType === 'none') return null

  const width  = bb.maxX - bb.minX + 0.4   // 20 cm saçak her kenar
  const depth  = bb.maxZ - bb.minZ + 0.4
  const center: [number, number, number] = [bb.center[0], ceilingHeight, bb.center[1]]

  // Düz çatı — sadece ince bir plaka
  if (roofType === 'flat') {
    return (
      <group position={center}>
        <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
          <boxGeometry args={[width, 0.10, depth]} />
          <primitive object={flatMat} attach="material" />
        </mesh>
      </group>
    )
  }

  // Saçak (alt seviye, her çatı tipi için ortak)
  const eave = (
    <mesh position={[0, 0.02, 0]} receiveShadow>
      <boxGeometry args={[width, 0.04, depth]} />
      <primitive object={eaveMat} attach="material" />
    </mesh>
  )

  // Beşik çatı (gable) — X ekseninde uzanan iki eğimli düzlem
  if (roofType === 'gable') {
    const roofH = Math.min(width, depth) * 0.35  // yükseklik ~ küçük kenarın %35'i
    // Her iki eğimli yüzey için açı hesapla
    const slopeAngle = Math.atan(roofH / (depth / 2))
    const slopeLen   = Math.sqrt((depth / 2) ** 2 + roofH ** 2)

    return (
      <group position={center}>
        {eave}
        {/* Kuzey eğimli yüzey (arka) */}
        <mesh
          position={[0, 0.04 + roofH / 2, -depth / 4]}
          rotation={[-slopeAngle, 0, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[width, 0.08, slopeLen]} />
          <primitive object={tileMat} attach="material" />
        </mesh>
        {/* Güney eğimli yüzey (ön) */}
        <mesh
          position={[0, 0.04 + roofH / 2, depth / 4]}
          rotation={[slopeAngle, 0, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[width, 0.08, slopeLen]} />
          <primitive object={tileMat} attach="material" />
        </mesh>
        {/* Üçgen alınlıklar (kuzey/güney duvar üstündeki boşluğu kapat) */}
        <mesh position={[-width / 2, 0.04 + roofH / 2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0, Math.max(depth, 0.01), roofH * 2, 3, 1]} />
          <primitive object={tileDkMat} attach="material" />
        </mesh>
        <mesh position={[width / 2, 0.04 + roofH / 2, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0, Math.max(depth, 0.01), roofH * 2, 3, 1]} />
          <primitive object={tileDkMat} attach="material" />
        </mesh>
        {/* Çatı omurgası (ridge) */}
        <mesh position={[0, 0.04 + roofH, 0]} castShadow>
          <boxGeometry args={[width + 0.02, 0.04, 0.12]} />
          <primitive object={tileDkMat} attach="material" />
        </mesh>
      </group>
    )
  }

  // Kalkan çatı (hip) — 4 yönlü piramit: dört eğimli yüzey merkeze birleşir
  if (roofType === 'hip') {
    const roofH = Math.min(width, depth) * 0.30
    // ConeGeometry 4 kenarlı piramit olarak kullanılır
    return (
      <group position={center}>
        {eave}
        <mesh position={[0, 0.04 + roofH / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0, Math.sqrt(width * width + depth * depth) / 2, roofH, 4, 1]} />
          <primitive object={tileMat} attach="material" />
        </mesh>
        {/* Piramit tabanını fiiliyatta genişlik/derinlik oranına göre çek */}
      </group>
    )
  }

  // Mansard — alt dik yüzeyler + üst düz taç
  if (roofType === 'mansard') {
    const lowerH = 0.8
    const upperH = 0.3
    const lowerAngle = Math.PI / 4  // 45°
    return (
      <group position={center}>
        {eave}
        {/* Alt dik kısım (4 yön) */}
        <mesh position={[0, 0.04 + lowerH / 2, -depth / 4]} rotation={[-lowerAngle, 0, 0]} castShadow>
          <boxGeometry args={[width, 0.08, depth / 2]} />
          <primitive object={tileDkMat} attach="material" />
        </mesh>
        <mesh position={[0, 0.04 + lowerH / 2, depth / 4]} rotation={[lowerAngle, 0, 0]} castShadow>
          <boxGeometry args={[width, 0.08, depth / 2]} />
          <primitive object={tileDkMat} attach="material" />
        </mesh>
        <mesh position={[-width / 4, 0.04 + lowerH / 2, 0]} rotation={[0, 0, lowerAngle]} castShadow>
          <boxGeometry args={[width / 2, 0.08, depth]} />
          <primitive object={tileDkMat} attach="material" />
        </mesh>
        <mesh position={[width / 4, 0.04 + lowerH / 2, 0]} rotation={[0, 0, -lowerAngle]} castShadow>
          <boxGeometry args={[width / 2, 0.08, depth]} />
          <primitive object={tileDkMat} attach="material" />
        </mesh>
        {/* Üst düz taç */}
        <mesh position={[0, 0.04 + lowerH + upperH / 2, 0]} castShadow>
          <boxGeometry args={[width * 0.65, upperH, depth * 0.65]} />
          <primitive object={flatMat} attach="material" />
        </mesh>
      </group>
    )
  }

  return null
}
