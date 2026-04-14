import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import type { WallOpening } from '../../types'

interface WallWithOpeningsProps {
  wallLength: number        // metre
  wallHeight: number        // metre
  wallThickness: number     // metre
  position: [number, number, number]
  rotation?: [number, number, number]
  material: THREE.Material        // ic cephe
  outerMaterial?: THREE.Material  // dis cephe (yoksa material kullanilir)
  flipInnerOuter?: boolean        // true = +z dis, -z ic (sag ve on duvarlar icin)
  openings: WallOpening[]   // bu duvara ait acikliklar
}

interface WallSegment {
  x: number       // duvar boyunca pozisyon (centre)
  y: number       // yukseklik (centre)
  width: number   // genislik
  height: number  // yukseklik
}

function computeWallSegments(
  wallLengthM: number,
  wallHeightM: number,
  openings: WallOpening[]
): WallSegment[] {
  if (openings.length === 0) {
    return [{ x: 0, y: wallHeightM / 2, width: wallLengthM, height: wallHeightM }]
  }

  const segments: WallSegment[] = []

  // Sort openings by position
  const sorted = [...openings].sort((a, b) => a.positionAlongWall - b.positionAlongWall)

  // Convert openings to metre-space
  const ops = sorted.map(o => {
    const centerX = (o.positionAlongWall - 0.5) * wallLengthM
    const wM = o.widthCm / 100
    const hM = o.heightCm / 100
    const bottomM = o.bottomCm / 100
    return {
      left: centerX - wM / 2,
      right: centerX + wM / 2,
      bottom: bottomM,
      top: bottomM + hM,
      centerX,
      wM,
      hM,
      bottomM,
    }
  })

  // Left edge to first opening
  const leftEdge = -wallLengthM / 2
  const rightEdge = wallLengthM / 2

  let cursor = leftEdge

  for (const op of ops) {
    // Segment before opening (full height)
    if (op.left > cursor + 0.01) {
      const segW = op.left - cursor
      segments.push({
        x: cursor + segW / 2,
        y: wallHeightM / 2,
        width: segW,
        height: wallHeightM,
      })
    }

    // Segment above opening
    if (op.top < wallHeightM - 0.01) {
      segments.push({
        x: op.centerX,
        y: (op.top + wallHeightM) / 2,
        width: op.wM,
        height: wallHeightM - op.top,
      })
    }

    // Segment below opening (for windows)
    if (op.bottomM > 0.01) {
      segments.push({
        x: op.centerX,
        y: op.bottomM / 2,
        width: op.wM,
        height: op.bottomM,
      })
    }

    cursor = op.right
  }

  // Right edge after last opening
  if (cursor < rightEdge - 0.01) {
    const segW = rightEdge - cursor
    segments.push({
      x: cursor + segW / 2,
      y: wallHeightM / 2,
      width: segW,
      height: wallHeightM,
    })
  }

  return segments
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
}: WallWithOpeningsProps) {
  const segments = useMemo(
    () => computeWallSegments(wallLength, wallHeight, openings),
    [wallLength, wallHeight, openings]
  )

  const frameMat = useMemo(() => new THREE.MeshLambertMaterial({ color: 0x8b7355 }), [])
  const outerMat = outerMaterial ?? material

  // BoxGeometry face order: 0:+x, 1:-x, 2:+y, 3:-y, 4:+z, 5:-z
  // For walls: +z and -z are the two large visible faces
  // flipInnerOuter: false → +z = inner, -z = outer (left/back walls)
  //                 true  → +z = outer, -z = inner (right/front walls)
  const materials = useMemo(() => {
    const inner = material
    const outer = outerMat
    const side = material // for thin side edges, use inner
    if (flipInnerOuter) {
      // +z = outer, -z = inner
      return [side, side, side, side, outer, inner]
    } else {
      // +z = inner, -z = outer
      return [side, side, side, side, inner, outer]
    }
  }, [material, outerMat, flipInnerOuter])

  return (
    <group position={position} rotation={rotation}>
      {segments.map((seg, i) => (
        <WallSegmentMesh key={i} seg={seg} wallThickness={wallThickness} materials={materials} />
      ))}

      {/* Door/window frames */}
      {openings.map(op => {
        const centerX = (op.positionAlongWall - 0.5) * wallLength
        const wM = op.widthCm / 100
        const hM = op.heightCm / 100
        const bottomM = op.bottomCm / 100
        const frameW = 0.04
        const cy = bottomM + hM / 2

        return (
          <group key={op.id} position={[centerX, cy, 0]}>
            {/* Left frame */}
            <mesh position={[-wM / 2, 0, 0]} castShadow>
              <boxGeometry args={[frameW, hM, wallThickness + 0.02]} />
              <primitive object={frameMat} attach="material" />
            </mesh>
            {/* Right frame */}
            <mesh position={[wM / 2, 0, 0]} castShadow>
              <boxGeometry args={[frameW, hM, wallThickness + 0.02]} />
              <primitive object={frameMat} attach="material" />
            </mesh>
            {/* Top frame */}
            <mesh position={[0, hM / 2, 0]} castShadow>
              <boxGeometry args={[wM + frameW * 2, frameW, wallThickness + 0.02]} />
              <primitive object={frameMat} attach="material" />
            </mesh>
            {/* Window glass (only for windows) */}
            {op.type === 'window' && (
              <mesh position={[0, 0, 0]}>
                <planeGeometry args={[wM, hM]} />
                <meshLambertMaterial color={0xb0cfdd} transparent opacity={0.25} side={THREE.DoubleSide} />
              </mesh>
            )}
          </group>
        )
      })}
    </group>
  )
}

/** Renders a single wall segment with multi-material (inner/outer faces) */
function WallSegmentMesh({ seg, wallThickness, materials }: {
  seg: WallSegment
  wallThickness: number
  materials: THREE.Material[]
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  useEffect(() => {
    if (!meshRef.current) return
    meshRef.current.material = materials
  }, [materials])

  return (
    <mesh ref={meshRef} position={[seg.x, seg.y, 0]} castShadow receiveShadow>
      <boxGeometry args={[seg.width, seg.height, wallThickness]} />
    </mesh>
  )
}
