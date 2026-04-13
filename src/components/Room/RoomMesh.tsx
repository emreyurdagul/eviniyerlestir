import { useRef, useState, useMemo } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import type { Room, WallSide } from '../../types'
import { useDesignStore } from '../../store/designStore'
import { MIN_DIM_CM, MAX_DIM_CM, FLOOR_TYPES } from '../../types'
import WallWithOpenings from './WallWithOpenings'

interface RoomMeshProps {
  room: Room
}

const WALL_H = 2.65
const WALL_T = 0.10
const SKIRT_H = 0.09

export default function RoomMesh({ room }: RoomMeshProps) {
  const groupRef = useRef<THREE.Group>(null)
  const selection = useDesignStore(s => s.selection)
  const select = useDesignStore(s => s.select)
  const updateRoom = useDesignStore(s => s.updateRoom)
  const setStoreDragging = useDesignStore(s => s.setDragging)
  const { raycaster } = useThree()

  const isSelected = selection.kind === 'room' && selection.id === room.id
  const [dragging, setDragging] = useState(false)
  const [resizeAxis, setResizeAxis] = useState<'w' | 'l' | null>(null)
  const dragOffset = useRef(new THREE.Vector3())
  const startDim = useRef({ w: 0, l: 0 })
  const startPoint = useRef(new THREE.Vector3())

  const wM = room.widthCm / 100
  const lM = room.lengthCm / 100
  const hw = wM / 2
  const hl = lM / 2
  const removed = room.removedWalls ?? []

  const floorCol = useMemo(() => {
    const ft = FLOOR_TYPES.find(f => f.type === room.floorType)
    return ft?.color ?? 0xbcad92
  }, [room.floorType])

  const wallCol = useMemo(() => {
    return new THREE.Color(room.wallColor ?? '#e3ddd4').getHex()
  }, [room.wallColor])

  const floorMat = useMemo(() => new THREE.MeshLambertMaterial({ color: floorCol }), [floorCol])
  const wallMat = useMemo(() => new THREE.MeshLambertMaterial({ color: wallCol, side: THREE.DoubleSide }), [wallCol])
  const skirtMat = useMemo(() => new THREE.MeshLambertMaterial({ color: 0xd0c8b8 }), [])

  const groundPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), [])

  const handlePointerDown = (e: any) => {
    // If a furniture item already captured this pointer event, skip
    if ((window as any).__evPointerCaptured) return
    e.stopPropagation()
    select('room', room.id)

    const intersect = new THREE.Vector3()
    raycaster.ray.intersectPlane(groundPlane, intersect)
    if (intersect) {
      dragOffset.current.set(
        room.position[0] - intersect.x,
        0,
        room.position[1] - intersect.z
      )
    }
    setDragging(true)
    setStoreDragging(true)
    ;(e.target as HTMLElement)?.setPointerCapture?.(e.pointerId)
  }

  const handlePointerMove = (e: any) => {
    if (!dragging && !resizeAxis) return
    e.stopPropagation()

    const intersect = new THREE.Vector3()
    raycaster.ray.intersectPlane(groundPlane, intersect)
    if (!intersect) return

    if (resizeAxis) {
      const delta = intersect.clone().sub(startPoint.current)
      const cosR = Math.cos(room.rotation)
      const sinR = Math.sin(room.rotation)
      const localDx = delta.x * cosR + delta.z * sinR
      const localDz = -delta.x * sinR + delta.z * cosR

      if (resizeAxis === 'w') {
        const newW = Math.round(Math.max(MIN_DIM_CM, Math.min(MAX_DIM_CM, startDim.current.w + localDx * 200)))
        updateRoom(room.id, { widthCm: newW })
      } else {
        const newL = Math.round(Math.max(MIN_DIM_CM, Math.min(MAX_DIM_CM, startDim.current.l + localDz * 200)))
        updateRoom(room.id, { lengthCm: newL })
      }
    } else if (dragging) {
      const nx = intersect.x + dragOffset.current.x
      const nz = intersect.z + dragOffset.current.z
      updateRoom(room.id, { position: [nx, nz] })
    }
  }

  const handlePointerUp = () => {
    setDragging(false)
    setResizeAxis(null)
    setStoreDragging(false)
    ;(window as any).__evPointerCaptured = false
  }

  const handleHandleDown = (axis: 'w' | 'l') => (e: any) => {
    e.stopPropagation()
    select('room', room.id)
    setResizeAxis(axis)
    setStoreDragging(true)
    startDim.current = { w: room.widthCm, l: room.lengthCm }
    const intersect = new THREE.Vector3()
    raycaster.ray.intersectPlane(groundPlane, intersect)
    if (intersect) startPoint.current.copy(intersect)
    ;(e.target as HTMLElement)?.setPointerCapture?.(e.pointerId)
  }

  return (
    <group
      ref={groupRef}
      position={[room.position[0], 0, room.position[1]]}
      rotation={[0, room.rotation, 0]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[wM, lM]} />
        <primitive object={floorMat} attach="material" />
      </mesh>

      {/* Walls with openings (skip removed walls) */}
      {!removed.includes('left') && <WallWithOpenings wallLength={lM} wallHeight={WALL_H} wallThickness={WALL_T}
        position={[-hw, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={wallMat}
        openings={(room.openings ?? []).filter(o => o.wall === 'left')} />}
      {!removed.includes('right') && <WallWithOpenings wallLength={lM} wallHeight={WALL_H} wallThickness={WALL_T}
        position={[hw, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={wallMat}
        openings={(room.openings ?? []).filter(o => o.wall === 'right')} />}
      {!removed.includes('back') && <WallWithOpenings wallLength={wM + WALL_T * 2} wallHeight={WALL_H} wallThickness={WALL_T}
        position={[0, 0, -hl]} rotation={[0, 0, 0]} material={wallMat}
        openings={(room.openings ?? []).filter(o => o.wall === 'back')} />}
      {!removed.includes('front') && <WallWithOpenings wallLength={wM + WALL_T * 2} wallHeight={WALL_H} wallThickness={WALL_T}
        position={[0, 0, hl]} rotation={[0, 0, 0]} material={wallMat}
        openings={(room.openings ?? []).filter(o => o.wall === 'front')} />}

      {/* Skirting (skip removed walls) */}
      {!removed.includes('left') && <mesh position={[-hw + 0.02, SKIRT_H / 2, 0]}>
        <boxGeometry args={[WALL_T, SKIRT_H, lM]} />
        <primitive object={skirtMat} attach="material" />
      </mesh>}
      {!removed.includes('right') && <mesh position={[hw - 0.02, SKIRT_H / 2, 0]}>
        <boxGeometry args={[WALL_T, SKIRT_H, lM]} />
        <primitive object={skirtMat} attach="material" />
      </mesh>}
      {!removed.includes('back') && <mesh position={[0, SKIRT_H / 2, -hl + 0.02]}>
        <boxGeometry args={[wM, SKIRT_H, WALL_T]} />
        <primitive object={skirtMat} attach="material" />
      </mesh>}
      {!removed.includes('front') && <mesh position={[0, SKIRT_H / 2, hl - 0.02]}>
        <boxGeometry args={[wM, SKIRT_H, WALL_T]} />
        <primitive object={skirtMat} attach="material" />
      </mesh>}

      {/* Selection highlight */}
      {isSelected && (
        <lineSegments position={[0, WALL_H / 2, 0]}>
          <edgesGeometry args={[new THREE.BoxGeometry(wM + 0.12, WALL_H + 0.12, lM + 0.12)]} />
          <lineBasicMaterial color={room.color} transparent opacity={0.6} />
        </lineSegments>
      )}

      {/* Resize handles (visible when selected) */}
      {isSelected && (
        <>
          {/* Width handles (left/right edges) */}
          <mesh
            position={[hw + 0.12, 0.5, 0]}
            onPointerDown={handleHandleDown('w')}
            data-testid="room-handle-w-right"
          >
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshBasicMaterial color={0xff8844} />
          </mesh>
          <mesh
            position={[-hw - 0.12, 0.5, 0]}
            onPointerDown={handleHandleDown('w')}
            data-testid="room-handle-w-left"
          >
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshBasicMaterial color={0xff8844} />
          </mesh>
          {/* Length handles (front/back edges) */}
          <mesh
            position={[0, 0.5, hl + 0.12]}
            onPointerDown={handleHandleDown('l')}
            data-testid="room-handle-l-front"
          >
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshBasicMaterial color={0x44aaff} />
          </mesh>
          <mesh
            position={[0, 0.5, -hl - 0.12]}
            onPointerDown={handleHandleDown('l')}
            data-testid="room-handle-l-back"
          >
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshBasicMaterial color={0x44aaff} />
          </mesh>
        </>
      )}
    </group>
  )
}
