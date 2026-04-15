/**
 * WallWithOpenings — duvar + açıklıkları (kapı / pencere) 3D olarak render eder.
 *
 * Sorumluluklar (Faz 5 sonrası minimal):
 *   - Duvar segmentlerini hesaplat (`wallSegments.ts`)
 *   - Her segmenti iç/dış materyalle render et (WallSegmentMesh)
 *   - Açıklıklara uygun 3D modelleri seç (`OpeningRenderers.tsx`)
 *
 * Segment matematiği ve açıklık çizimleri ayrı modüllerde — bu dosya sadece
 * orkestrasyon + materyal seçimi yapar.
 */

import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import type { WallOpening } from '../../types'
import { computeWallSegments, type WallSegment } from './wallSegments'
import OpeningByType from './OpeningRenderers'

interface WallWithOpeningsProps {
  wallLength: number        // metre
  wallHeight: number        // metre
  wallThickness: number     // metre
  position: [number, number, number]
  rotation?: [number, number, number]
  material: THREE.Material        // iç cephe
  outerMaterial?: THREE.Material  // dış cephe (yoksa material kullanılır)
  flipInnerOuter?: boolean        // true = +z dış, -z iç (sağ ve ön duvarlar için)
  openings: WallOpening[]
  selectedOpeningId?: string | null
  onSelectOpening?: (id: string) => void
  onWallContextMenu?: (clientX: number, clientY: number) => void
}

export default function WallWithOpenings({
  wallLength,
  wallHeight,
  wallThickness,
  position,
  rotation = [0, 0, 0],
  material,
  outerMaterial,
  flipInnerOuter = false,
  openings,
  selectedOpeningId: _selectedOpeningId,
  onSelectOpening,
  onWallContextMenu,
}: WallWithOpeningsProps) {
  const handleWallContext = onWallContextMenu
    ? (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        const native = e.nativeEvent as MouseEvent | undefined
        const cx = native?.clientX ?? window.__lastPointerX ?? 0
        const cy = native?.clientY ?? window.__lastPointerY ?? 0
        onWallContextMenu(cx, cy)
      }
    : undefined

  const segments = useMemo(
    () => computeWallSegments(wallLength, wallHeight, openings),
    [wallLength, wallHeight, openings]
  )

  const frameMat = useMemo(() => new THREE.MeshLambertMaterial({ color: 0x8b7355 }), [])
  const outerMat = outerMaterial ?? material

  // BoxGeometry face order: 0:+x, 1:-x, 2:+y, 3:-y, 4:+z, 5:-z
  // Duvarlar için +z ve -z iki büyük görünür yüz. +x/-x uç kapakları (köşe).
  // flipInnerOuter: false → +z = iç, -z = dış; true → +z = dış, -z = iç.
  const materials = useMemo(() => {
    const inner = material
    const outer = outerMat
    if (flipInnerOuter) {
      return [outer, outer, outer, outer, outer, inner]
    }
    return [outer, outer, outer, outer, inner, outer]
  }, [material, outerMat, flipInnerOuter])

  return (
    <group position={position} rotation={rotation}>
      {segments.map((seg, i) => (
        <WallSegmentMesh
          key={i}
          seg={seg}
          wallThickness={wallThickness}
          materials={materials}
          onContextMenu={handleWallContext}
        />
      ))}

      {/* Açıklık çerçeveleri ve iç detayları */}
      {openings.map(op => {
        const centerX = (op.positionAlongWall - 0.5) * wallLength
        const wM = op.widthCm / 100
        const hM = op.heightCm / 100
        const bottomM = op.bottomCm / 100
        const frameW = 0.04
        const cy = bottomM + hM / 2
        const wt = wallThickness + 0.02

        return (
          <group
            key={op.id}
            position={[centerX, cy, 0]}
            onPointerDown={onSelectOpening ? (e) => { e.stopPropagation(); onSelectOpening(op.id) } : undefined}
          >
            <OpeningByType type={op.type} wM={wM} hM={hM} frameW={frameW} wt={wt} frameMat={frameMat} />

          </group>
        )
      })}
    </group>
  )
}

/** Tek duvar segmentini çok-materyalli (iç / dış yüzler) bir box olarak render eder. */
function WallSegmentMesh({ seg, wallThickness, materials, onContextMenu }: {
  seg: WallSegment
  wallThickness: number
  materials: THREE.Material[]
  onContextMenu?: (e: ThreeEvent<MouseEvent>) => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  useEffect(() => {
    if (!meshRef.current) return
    meshRef.current.material = materials
  }, [materials])

  return (
    <mesh
      ref={meshRef}
      position={[seg.x, seg.y, 0]}
      castShadow
      receiveShadow
      onContextMenu={onContextMenu}
    >
      <boxGeometry args={[seg.width, seg.height, wallThickness]} />
    </mesh>
  )
}
