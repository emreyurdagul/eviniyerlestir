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
  selectedOpeningId?: string | null
  onSelectOpening?: (id: string) => void
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
  selectedOpeningId,
  onSelectOpening,
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
        const wt = wallThickness + 0.02

        return (
          <group
            key={op.id}
            position={[centerX, cy, 0]}
            onPointerDown={onSelectOpening ? (e) => { e.stopPropagation(); onSelectOpening(op.id) } : undefined}
          >
            {/* ── Standard door ── */}
            {op.type === 'door' && <OpeningDoor wM={wM} hM={hM} frameW={frameW} wt={wt} frameMat={frameMat} />}

            {/* ── Double door ── */}
            {op.type === 'double-door' && <OpeningDoubleDoor wM={wM} hM={hM} frameW={frameW} wt={wt} frameMat={frameMat} />}

            {/* ── Sliding door ── */}
            {op.type === 'sliding-door' && <OpeningSlidingDoor wM={wM} hM={hM} frameW={frameW} wt={wt} frameMat={frameMat} />}

            {/* ── Standard window ── */}
            {op.type === 'window' && <OpeningWindow wM={wM} hM={hM} frameW={frameW} wt={wt} frameMat={frameMat} />}

            {/* ── Panoramic window ── */}
            {op.type === 'panoramic' && <OpeningPanoramic wM={wM} hM={hM} frameW={frameW} wt={wt} frameMat={frameMat} />}

            {/* ── Triple window ── */}
            {op.type === 'triple-window' && <OpeningTripleWindow wM={wM} hM={hM} frameW={frameW} wt={wt} frameMat={frameMat} />}

            {/* ── French balcony ── */}
            {op.type === 'french-balcony' && <OpeningFrenchBalcony wM={wM} hM={hM} frameW={frameW} wt={wt} frameMat={frameMat} />}
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

// ── Shared opening props ──────────────────────────────────────────────────────
interface OpeningProps {
  wM: number
  hM: number
  frameW: number
  wt: number
  frameMat: THREE.Material
}

// Shared singleton materials (created once at module level is fine for static mats,
// but we use module-level refs so React HMR doesn't recreate them on every render)
const glassMat = new THREE.MeshLambertMaterial({ color: 0xb0cfdd, transparent: true, opacity: 0.28, side: THREE.DoubleSide })
const railMat  = new THREE.MeshLambertMaterial({ color: 0xaaaaaa })
// Note: These are intentional module-level singletons — they never change properties,
// so sharing across instances is correct and avoids material churn.

/** Helper: outer frame (left/right/top bars) */
function OuterFrame({ wM, hM, frameW, wt, frameMat, withBottom = false }: OpeningProps & { withBottom?: boolean }) {
  return (
    <>
      <mesh position={[-wM / 2, 0, 0]} castShadow>
        <boxGeometry args={[frameW, hM, wt]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <mesh position={[wM / 2, 0, 0]} castShadow>
        <boxGeometry args={[frameW, hM, wt]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <mesh position={[0, hM / 2, 0]} castShadow>
        <boxGeometry args={[wM + frameW * 2, frameW, wt]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      {withBottom && (
        <mesh position={[0, -hM / 2, 0]} castShadow>
          <boxGeometry args={[wM + frameW * 2, frameW, wt]} />
          <primitive object={frameMat} attach="material" />
        </mesh>
      )}
    </>
  )
}

/** Single pane of glass */
function GlassPane({ w, h, z = 0 }: { w: number; h: number; z?: number }) {
  return (
    <mesh position={[0, 0, z]}>
      <planeGeometry args={[w, h]} />
      <primitive object={glassMat} attach="material" />
    </mesh>
  )
}

// ── Opening type renderers ────────────────────────────────────────────────────

/** Standard single door */
function OpeningDoor({ wM, hM, frameW, wt, frameMat }: OpeningProps) {
  return (
    <>
      <OuterFrame wM={wM} hM={hM} frameW={frameW} wt={wt} frameMat={frameMat} />
      {/* Door panel */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[wM - frameW, hM - frameW, 0.04]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      {/* Door handle */}
      <mesh position={[wM * 0.3, 0, 0.03]}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshBasicMaterial color={0xc0a060} />
      </mesh>
    </>
  )
}

/** Double (French) door — two panels, center split */
function OpeningDoubleDoor({ wM, hM, frameW, wt, frameMat }: OpeningProps) {
  const panelW = (wM - frameW * 3) / 2
  return (
    <>
      <OuterFrame wM={wM} hM={hM} frameW={frameW} wt={wt} frameMat={frameMat} />
      {/* Center divider */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[frameW, hM, wt]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      {/* Left panel */}
      <mesh position={[-(panelW / 2 + frameW / 2), 0, 0]}>
        <boxGeometry args={[panelW, hM - frameW, 0.04]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      {/* Right panel */}
      <mesh position={[panelW / 2 + frameW / 2, 0, 0]}>
        <boxGeometry args={[panelW, hM - frameW, 0.04]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      {/* Handles */}
      <mesh position={[-frameW * 0.5, 0, 0.03]}>
        <sphereGeometry args={[0.022, 6, 6]} />
        <meshBasicMaterial color={0xc0a060} />
      </mesh>
      <mesh position={[frameW * 0.5, 0, 0.03]}>
        <sphereGeometry args={[0.022, 6, 6]} />
        <meshBasicMaterial color={0xc0a060} />
      </mesh>
    </>
  )
}

/** Sliding door — full-width glass with rail */
function OpeningSlidingDoor({ wM, hM, frameW, wt, frameMat }: OpeningProps) {
  return (
    <>
      <OuterFrame wM={wM} hM={hM} frameW={frameW} wt={wt} frameMat={frameMat} />
      {/* Rail at top */}
      <mesh position={[0, hM / 2 - frameW * 0.5, 0]}>
        <boxGeometry args={[wM, frameW * 0.5, wt * 1.2]} />
        <primitive object={railMat} attach="material" />
      </mesh>
      {/* Glass panels (two overlapping slides) */}
      <GlassPane w={wM * 0.52} h={hM - frameW * 2} z={-0.01} />
      <GlassPane w={wM * 0.52} h={hM - frameW * 2} z={0.01} />
      {/* Center vertical divider suggestion */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[frameW * 0.5, hM, wt * 0.5]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
    </>
  )
}

/** Standard window with glass */
function OpeningWindow({ wM, hM, frameW, wt, frameMat }: OpeningProps) {
  return (
    <>
      <OuterFrame wM={wM} hM={hM} frameW={frameW} wt={wt} frameMat={frameMat} withBottom />
      {/* Horizontal mid-rail */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[wM, frameW * 0.7, wt]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <GlassPane w={wM - frameW} h={hM - frameW} />
    </>
  )
}

/** Panoramic / floor-to-ceiling window — wide glass, minimal frame */
function OpeningPanoramic({ wM, hM, frameW, wt, frameMat }: OpeningProps) {
  const fw = frameW * 0.6
  return (
    <>
      {/* Thin side frames */}
      <mesh position={[-wM / 2, 0, 0]} castShadow>
        <boxGeometry args={[fw, hM, wt]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <mesh position={[wM / 2, 0, 0]} castShadow>
        <boxGeometry args={[fw, hM, wt]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      {/* Thin top bar */}
      <mesh position={[0, hM / 2, 0]} castShadow>
        <boxGeometry args={[wM, fw, wt]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      {/* Large glass */}
      <GlassPane w={wM - fw} h={hM - fw} />
      {/* Subtle vertical dividers (every ~80cm) */}
      {Array.from({ length: Math.floor(wM / 0.8) - 1 }, (_, i) => {
        const x = -wM / 2 + (i + 1) * (wM / Math.floor(wM / 0.8))
        return (
          <mesh key={i} position={[x, 0, 0]}>
            <boxGeometry args={[fw * 0.5, hM, wt * 0.5]} />
            <primitive object={frameMat} attach="material" />
          </mesh>
        )
      })}
    </>
  )
}

/** Triple window — 3 equal glass panes with dividers */
function OpeningTripleWindow({ wM, hM, frameW, wt, frameMat }: OpeningProps) {
  const paneW = (wM - frameW * 4) / 3
  const dividers = [-1, 0, 1].map(i => ({
    x: i * (paneW + frameW),
    pane: i !== 0,
  }))
  return (
    <>
      <OuterFrame wM={wM} hM={hM} frameW={frameW} wt={wt} frameMat={frameMat} withBottom />
      {/* Two inner vertical dividers */}
      <mesh position={[-(paneW / 2 + frameW * 1.5), 0, 0]}>
        <boxGeometry args={[frameW, hM, wt]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <mesh position={[paneW / 2 + frameW * 1.5, 0, 0]}>
        <boxGeometry args={[frameW, hM, wt]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      {/* Horizontal mid-rails for each pane */}
      {[-1, 0, 1].map(i => (
        <mesh key={i} position={[i * (paneW + frameW), 0, 0]}>
          <boxGeometry args={[paneW, frameW * 0.6, wt]} />
          <primitive object={frameMat} attach="material" />
        </mesh>
      ))}
      {/* Glass panes */}
      {[-1, 0, 1].map(i => (
        <mesh key={`g${i}`} position={[i * (paneW + frameW), 0, 0]}>
          <planeGeometry args={[paneW, hM - frameW]} />
          <primitive object={glassMat} attach="material" />
        </mesh>
      ))}
    </>
  )
}

/** French balcony — floor-height glass + decorative railing */
function OpeningFrenchBalcony({ wM, hM, frameW, wt, frameMat }: OpeningProps) {
  const railH = 0.10
  const railY = -hM / 2 + railH / 2
  return (
    <>
      <OuterFrame wM={wM} hM={hM} frameW={frameW} wt={wt} frameMat={frameMat} />
      {/* Center vertical divider */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[frameW * 0.8, hM, wt]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      {/* Glass panels */}
      <mesh position={[-(wM / 4), 0, 0]}>
        <planeGeometry args={[(wM / 2) - frameW * 1.2, hM - frameW]} />
        <primitive object={glassMat} attach="material" />
      </mesh>
      <mesh position={[wM / 4, 0, 0]}>
        <planeGeometry args={[(wM / 2) - frameW * 1.2, hM - frameW]} />
        <primitive object={glassMat} attach="material" />
      </mesh>
      {/* Railing bar */}
      <mesh position={[0, railY, wt * 0.8]}>
        <boxGeometry args={[wM, railH, 0.04]} />
        <primitive object={railMat} attach="material" />
      </mesh>
      {/* Railing vertical bars */}
      {Array.from({ length: Math.round(wM * 4) }, (_, i) => {
        const x = -wM / 2 + (i + 0.5) * (wM / Math.round(wM * 4))
        return (
          <mesh key={i} position={[x, railY, wt * 0.8]}>
            <boxGeometry args={[0.02, railH * 2.5, 0.02]} />
            <primitive object={railMat} attach="material" />
          </mesh>
        )
      })}
    </>
  )
}
