import { useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import type { Room, WallOpening, WallSide } from '../../types'
import { useDesignStore } from '../../store/designStore'
import { WALL_T } from '../../constants'

interface OpeningHandlesProps {
  room: Room
  opening: WallOpening
}

const HND = 0.07    // handle radius/size
const OFF = 0.12    // offset from opening edge

/** Returns room-local (x, z) of opening center and wall axis info */
function getWallGeom(room: Room, wall: WallSide, wallLength: number) {
  const hw = room.widthCm / 200
  const hl = room.lengthCm / 200
  // wallAxisIsZ: the wall runs along local Z (left/right walls)
  // wallAxisIsX: the wall runs along local X (front/back walls)
  switch (wall) {
    case 'left':  return { wallX: -hw, wallZ: null, axisZ: true,  len: wallLength }
    case 'right': return { wallX:  hw, wallZ: null, axisZ: true,  len: wallLength }
    case 'back':  return { wallX: null, wallZ: -hl, axisZ: false, len: wallLength }
    case 'front': return { wallX: null, wallZ:  hl, axisZ: false, len: wallLength }
  }
}

export default function OpeningHandles({ room, opening }: OpeningHandlesProps) {
  const updateOpening = useDesignStore(s => s.updateOpening)
  const setStoreDragging = useDesignStore(s => s.setDragging)
  const { raycaster } = useThree()

  const activeHandle = useRef<'center' | 'left' | 'right' | 'top' | 'bottom' | null>(null)
  const startPoint = useRef(new THREE.Vector3())
  const startData  = useRef({ pos: 0, w: 0, h: 0, b: 0 })
  const groundPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))

  const wM = opening.widthCm  / 100
  const hM = opening.heightCm / 100
  const bottomM = opening.bottomCm / 100
  const cy = bottomM + hM / 2

  // Wall geometry
  const wallLenLeft  = room.lengthCm / 100
  const wallLenRight = room.lengthCm / 100
  const wallLenBack  = room.widthCm  / 100
  const wallLenFront = room.widthCm  / 100
  const wallLenMap: Record<WallSide, number> = {
    left: wallLenLeft, right: wallLenRight, back: wallLenBack, front: wallLenFront
  }
  const wallLen = wallLenMap[opening.wall]
  const geom = getWallGeom(room, opening.wall, wallLen)

  // Opening center in room-local space
  const cOffset = (opening.positionAlongWall - 0.5) * wallLen
  const cx_room = geom.axisZ ? (geom.wallX ?? 0) : cOffset
  const cz_room = geom.axisZ ? cOffset : (geom.wallZ ?? 0)

  // Handles in room-local 3D
  const handles = {
    center: new THREE.Vector3(cx_room, cy, cz_room),
    left:   geom.axisZ
      ? new THREE.Vector3(cx_room, cy, cz_room - wM / 2 - OFF)
      : new THREE.Vector3(cx_room - wM / 2 - OFF, cy, cz_room),
    right:  geom.axisZ
      ? new THREE.Vector3(cx_room, cy, cz_room + wM / 2 + OFF)
      : new THREE.Vector3(cx_room + wM / 2 + OFF, cy, cz_room),
    top:    new THREE.Vector3(cx_room, bottomM + hM + OFF, cz_room),
    bottom: new THREE.Vector3(cx_room, bottomM - OFF, cz_room),
  }

  // Selection highlight box
  const boxW = geom.axisZ ? WALL_T + 0.05 : wM + 0.1
  const boxD = geom.axisZ ? wM + 0.1 : WALL_T + 0.05

  const handleDown = (key: typeof activeHandle.current) => (e: any) => {
    e.stopPropagation()
    ;(window as any).__evPointerCaptured = true
    activeHandle.current = key
    setStoreDragging(true)
    startData.current = { pos: opening.positionAlongWall, w: opening.widthCm, h: opening.heightCm, b: opening.bottomCm }
    const isect = new THREE.Vector3()
    raycaster.ray.intersectPlane(groundPlane.current, isect)
    if (isect) startPoint.current.copy(isect)
    ;(e.target as HTMLElement)?.setPointerCapture?.(e.pointerId)
  }

  const handleMove = (e: any) => {
    if (!activeHandle.current) return
    e.stopPropagation()
    const isect = new THREE.Vector3()
    raycaster.ray.intersectPlane(groundPlane.current, isect)
    if (!isect) return

    // World delta → room-local
    const delta = isect.clone().sub(startPoint.current)
    const cosR = Math.cos(room.rotation)
    const sinR = Math.sin(room.rotation)
    const localDx = delta.x * cosR + delta.z * sinR
    const localDz = -delta.x * sinR + delta.z * cosR

    // For this wall, which local axis is "along wall"?
    const alongDelta = geom.axisZ ? localDz : localDx

    if (activeHandle.current === 'center') {
      const newPos = Math.max(0.05, Math.min(0.95, startData.current.pos + alongDelta / wallLen))
      updateOpening(room.id, opening.id, { positionAlongWall: newPos })
    }
    else if (activeHandle.current === 'right') {
      // Right edge moves → widthCm grows, center shifts right
      const dw = alongDelta * 100
      const newW = Math.round(Math.max(30, startData.current.w + dw))
      const diffW = (newW - startData.current.w) / 100
      const newPos = Math.max(0.05, Math.min(0.95, startData.current.pos + diffW / (2 * wallLen)))
      updateOpening(room.id, opening.id, { widthCm: newW, positionAlongWall: newPos })
    }
    else if (activeHandle.current === 'left') {
      // Left edge moves → widthCm grows, center shifts left
      const dw = -alongDelta * 100
      const newW = Math.round(Math.max(30, startData.current.w + dw))
      const diffW = (newW - startData.current.w) / 100
      const newPos = Math.max(0.05, Math.min(0.95, startData.current.pos - diffW / (2 * wallLen)))
      updateOpening(room.id, opening.id, { widthCm: newW, positionAlongWall: newPos })
    }
    else if (activeHandle.current === 'top') {
      // Top handle: change heightCm (üst kenar yukarı/aşağı)
      const dh = delta.y * 100
      const newH = Math.round(Math.max(30, startData.current.h + dh))
      updateOpening(room.id, opening.id, { heightCm: newH })
    }
    else if (activeHandle.current === 'bottom') {
      // Bottom handle: change bottomCm (pencere sili yüksekliği) — ters yön
      const db = delta.y * 100
      const newB = Math.round(Math.max(0, Math.min(200, startData.current.b + db)))
      // Yükseği sabit tut: heightCm azalır bottomCm artar
      const newH = Math.round(Math.max(30, startData.current.h - db))
      updateOpening(room.id, opening.id, { bottomCm: newB, heightCm: newH })
    }
  }

  const handleUp = () => {
    activeHandle.current = null
    setStoreDragging(false)
    ;(window as any).__evPointerCaptured = false
  }

  return (
    <group onPointerMove={handleMove} onPointerUp={handleUp}>
      {/* Selection highlight box */}
      <lineSegments position={[cx_room, cy, cz_room]}>
        <edgesGeometry args={[new THREE.BoxGeometry(boxW, hM + 0.05, boxD)]} />
        <lineBasicMaterial color={0xffaa00} transparent opacity={0.8} />
      </lineSegments>

      {/* Center handle (move) */}
      <mesh position={handles.center.toArray()} onPointerDown={handleDown('center')}>
        <boxGeometry args={[HND * 0.7, HND * 0.7, HND * 0.7]} />
        <meshBasicMaterial color={0x44dd88} />
      </mesh>

      {/* Left handle (width) */}
      <mesh position={handles.left.toArray()} onPointerDown={handleDown('left')}>
        <sphereGeometry args={[HND, 8, 8]} />
        <meshBasicMaterial color={0xff8844} />
      </mesh>

      {/* Right handle (width) */}
      <mesh position={handles.right.toArray()} onPointerDown={handleDown('right')}>
        <sphereGeometry args={[HND, 8, 8]} />
        <meshBasicMaterial color={0xff8844} />
      </mesh>

      {/* Top handle (height — üst kenar) */}
      <mesh position={handles.top.toArray()} onPointerDown={handleDown('top')}>
        <sphereGeometry args={[HND, 8, 8]} />
        <meshBasicMaterial color={0x44aaff} />
      </mesh>

      {/* Bottom handle (bottomCm — pencere sili / yerden yükseklik) */}
      {opening.bottomCm > 0 && (
        <mesh position={handles.bottom.toArray()} onPointerDown={handleDown('bottom')}>
          <sphereGeometry args={[HND, 8, 8]} />
          <meshBasicMaterial color={0xaa66ff} />
        </mesh>
      )}
    </group>
  )
}
