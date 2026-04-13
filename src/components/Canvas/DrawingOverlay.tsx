import { useMemo } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { useDesignStore } from '../../store/designStore'

const SNAP_DISTANCE = 0.3 // metre - ilk noktaya bu kadar yaklasinca kapanir

export default function DrawingOverlay() {
  const isDrawing = useDesignStore(s => s.isDrawing)
  const drawPoints = useDesignStore(s => s.drawPoints)
  const addDrawPoint = useDesignStore(s => s.addDrawPoint)
  const finalizeDrawing = useDesignStore(s => s.finalizeDrawing)
  const { raycaster, camera } = useThree()

  const groundPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), [])

  const linePoints = useMemo(() => {
    if (drawPoints.length < 2) return null
    const pts = drawPoints.map(([x, z]) => new THREE.Vector3(x, 0.02, z))
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [drawPoints])

  const handleClick = (e: any) => {
    if (!isDrawing) return
    e.stopPropagation()

    const intersect = new THREE.Vector3()
    raycaster.ray.intersectPlane(groundPlane, intersect)
    if (!intersect) return

    const x = intersect.x
    const z = intersect.z

    // Check if close to first point (close polygon)
    if (drawPoints.length >= 3) {
      const [fx, fz] = drawPoints[0]
      const dist = Math.sqrt((x - fx) ** 2 + (z - fz) ** 2)
      if (dist < SNAP_DISTANCE) {
        finalizeDrawing()
        return
      }
    }

    addDrawPoint(x, z)
  }

  if (!isDrawing) return null

  return (
    <group>
      {/* Clickable ground plane for drawing */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
        onPointerDown={handleClick}
      >
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial visible={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Draw points */}
      {drawPoints.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.03, z]}>
          <sphereGeometry args={[i === 0 ? 0.12 : 0.08, 12, 8]} />
          <meshBasicMaterial color={i === 0 ? 0x44cc44 : 0xff8844} />
        </mesh>
      ))}

      {/* Lines between points */}
      {linePoints && (
        <line>
          <primitive object={linePoints} attach="geometry" />
          <lineBasicMaterial color={0xff6644} linewidth={2} />
        </line>
      )}

      {/* Closing line (last point → first point, dashed) */}
      {drawPoints.length >= 3 && (() => {
        const last = drawPoints[drawPoints.length - 1]
        const first = drawPoints[0]
        const closingGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(last[0], 0.02, last[1]),
          new THREE.Vector3(first[0], 0.02, first[1]),
        ])
        return (
          <line>
            <primitive object={closingGeo} attach="geometry" />
            <lineDashedMaterial color={0x44cc44} dashSize={0.1} gapSize={0.05} />
          </line>
        )
      })()}

      {/* Snap indicator on first point */}
      {drawPoints.length >= 3 && (
        <mesh position={[drawPoints[0][0], 0.03, drawPoints[0][1]]}>
          <ringGeometry args={[SNAP_DISTANCE - 0.02, SNAP_DISTANCE, 24]} />
          <meshBasicMaterial color={0x44cc44} transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}
