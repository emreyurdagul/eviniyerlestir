import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import type { Room } from '../../types'
import { useDesignStore } from '../../store/designStore'
import { FLOOR_TYPES } from '../../types'
import WallWithOpenings from './WallWithOpenings'
import { snapRoomPosition } from '../../utils/snap'
import DimensionLabels from './DimensionLabels'
import RoomResizeHandles from './RoomResizeHandles'
import OpeningHandles from './OpeningHandles'

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
  const moveRoomWithFurniture = useDesignStore(s => s.moveRoomWithFurniture)
  const setStoreDragging = useDesignStore(s => s.setDragging)
  const editMode = useDesignStore(s => s.editMode)
  const showDimensions = useDesignStore(s => s.showDimensions)
  const { raycaster, gl, camera } = useThree()

  const selectOpening = useDesignStore(s => s.selectOpening)

  const isSelected = selection.kind === 'room' && selection.id === room.id
  const selectedOpeningId = (selection.kind === 'opening' && selection.parentId === room.id)
    ? selection.id
    : null
  const selectedOpening = selectedOpeningId
    ? (room.openings ?? []).find(o => o.id === selectedOpeningId) ?? null
    : null

  const draggingRef = useRef(false)
  const dragOffset = useRef(new THREE.Vector3())
  const roomRef = useRef(room)
  roomRef.current = room

  const wM = room.widthCm / 100
  const lM = room.lengthCm / 100
  const hw = wM / 2
  const hl = lM / 2
  const removed = room.removedWalls ?? []

  const floorCol = useMemo(() => {
    const ft = FLOOR_TYPES.find(f => f.type === room.floorType)
    return ft?.color ?? 0xbcad92
  }, [room.floorType])

  const wallColInner = useMemo(() => {
    return new THREE.Color(room.wallColor ?? '#e3ddd4').getHex()
  }, [room.wallColor])

  const wallColOuter = useMemo(() => {
    return new THREE.Color(room.wallColorOuter ?? '#c8c0b4').getHex()
  }, [room.wallColorOuter])

  const floorMat = useMemo(() => new THREE.MeshLambertMaterial({ color: floorCol }), [floorCol])
  const wallMatInner = useMemo(() => new THREE.MeshLambertMaterial({ color: wallColInner }), [wallColInner])
  const wallMatOuter = useMemo(() => new THREE.MeshLambertMaterial({ color: wallColOuter }), [wallColOuter])
  const skirtMat = useMemo(() => new THREE.MeshLambertMaterial({ color: 0xd0c8b8 }), [])

  const groundPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), [])

  // NDC → yer düzlemi
  const rayFromClient = (clientX: number, clientY: number, out: THREE.Vector3): boolean => {
    const rect = gl.domElement.getBoundingClientRect()
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    )
    raycaster.setFromCamera(ndc, camera)
    return !!raycaster.ray.intersectPlane(groundPlane, out)
  }

  const onWindowMove = (ev: PointerEvent) => {
    if (!draggingRef.current) return
    const r = roomRef.current
    const intersect = new THREE.Vector3()
    if (!rayFromClient(ev.clientX, ev.clientY, intersect)) return
    const rawX = intersect.x + dragOffset.current.x
    const rawZ = intersect.z + dragOffset.current.z
    const allRooms = useDesignStore.getState().rooms
    const snapped = snapRoomPosition(r, rawX, rawZ, allRooms)
    const dx = snapped.x - r.position[0]
    const dz = snapped.z - r.position[1]
    moveRoomWithFurniture(r.id, dx, dz)
  }

  const stopDrag = () => {
    if (!draggingRef.current) return
    draggingRef.current = false
    setStoreDragging(false)
    ;(window as any).__evPointerCaptured = false
    window.removeEventListener('pointermove', onWindowMove)
    window.removeEventListener('pointerup', onWindowUp)
    window.removeEventListener('pointercancel', onWindowUp)
  }

  const onWindowUp = () => { stopDrag() }

  const handlePointerDown = (e: any) => {
    // Bir başka öğe (mobilya / handle) pointer'ı zaten yakaladıysa atla
    if ((window as any).__evPointerCaptured) return
    e.stopPropagation()
    const native: PointerEvent | undefined = e.nativeEvent
    native?.stopPropagation?.()
    native?.stopImmediatePropagation?.()

    select('room', room.id)

    // Boyutlandır modunda gövde sürükleme devre dışı
    if (editMode === 'resize') return
    native?.preventDefault?.()

    ;(window as any).__evPointerCaptured = true

    const intersect = new THREE.Vector3()
    const ok = native && rayFromClient(native.clientX, native.clientY, intersect)
    if (ok) {
      dragOffset.current.set(room.position[0] - intersect.x, 0, room.position[1] - intersect.z)
    } else if (raycaster.ray.intersectPlane(groundPlane, intersect)) {
      dragOffset.current.set(room.position[0] - intersect.x, 0, room.position[1] - intersect.z)
    }
    draggingRef.current = true
    setStoreDragging(true)
    window.addEventListener('pointermove', onWindowMove)
    window.addEventListener('pointerup', onWindowUp)
    window.addEventListener('pointercancel', onWindowUp)
  }

  useEffect(() => {
    return () => { if (draggingRef.current) stopDrag() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleContextMenu = (e: any) => {
    if ((window as any).__evPointerCaptured) return
    e.stopPropagation()
    select('room', room.id)
    useDesignStore.getState().setContextMenuPos({
      x: (window as any).__lastPointerX ?? e.clientX ?? 0,
      y: (window as any).__lastPointerY ?? e.clientY ?? 0,
    })
  }

  return (
    <group
      ref={groupRef}
      position={[room.position[0], 0, room.position[1]]}
      rotation={[0, room.rotation, 0]}
      onPointerDown={handlePointerDown}
      onContextMenu={handleContextMenu}
    >
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[wM, lM]} />
        <primitive object={floorMat} attach="material" />
      </mesh>

      {/* Duvar sağ-tık: selection'u wall'a çevir, context menu aç */}
      {(() => {
        const wallCtx = (wall: 'left' | 'right' | 'front' | 'back') => (cx: number, cy: number) => {
          useDesignStore.setState({ selection: { kind: 'wall', id: wall, parentId: room.id } })
          useDesignStore.getState().setContextMenuPos({ x: cx, y: cy })
        }
        return (
          <>
            {!removed.includes('left') && <WallWithOpenings wallLength={lM} wallHeight={WALL_H} wallThickness={WALL_T}
              position={[-hw, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={wallMatInner} outerMaterial={wallMatOuter}
              openings={(room.openings ?? []).filter(o => o.wall === 'left')}
              selectedOpeningId={selectedOpeningId} onSelectOpening={id => selectOpening(id, room.id)}
              onWallContextMenu={wallCtx('left')} />}
            {!removed.includes('right') && <WallWithOpenings wallLength={lM} wallHeight={WALL_H} wallThickness={WALL_T}
              position={[hw, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={wallMatInner} outerMaterial={wallMatOuter}
              flipInnerOuter openings={(room.openings ?? []).filter(o => o.wall === 'right')}
              selectedOpeningId={selectedOpeningId} onSelectOpening={id => selectOpening(id, room.id)}
              onWallContextMenu={wallCtx('right')} />}
            {!removed.includes('back') && <WallWithOpenings wallLength={wM + WALL_T * 2} wallHeight={WALL_H} wallThickness={WALL_T}
              position={[0, 0, -hl]} rotation={[0, 0, 0]} material={wallMatInner} outerMaterial={wallMatOuter}
              openings={(room.openings ?? []).filter(o => o.wall === 'back')}
              selectedOpeningId={selectedOpeningId} onSelectOpening={id => selectOpening(id, room.id)}
              onWallContextMenu={wallCtx('back')} />}
            {!removed.includes('front') && <WallWithOpenings wallLength={wM + WALL_T * 2} wallHeight={WALL_H} wallThickness={WALL_T}
              position={[0, 0, hl]} rotation={[0, 0, 0]} material={wallMatInner} outerMaterial={wallMatOuter}
              flipInnerOuter openings={(room.openings ?? []).filter(o => o.wall === 'front')}
              selectedOpeningId={selectedOpeningId} onSelectOpening={id => selectOpening(id, room.id)}
              onWallContextMenu={wallCtx('front')} />}
          </>
        )
      })()}

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

      {/* Dimension labels */}
      {showDimensions && <DimensionLabels room={room} />}

      {/* Resize handles — yalnızca Boyutlandır modunda, RoomResizeHandles bileşeni */}
      {isSelected && editMode === 'resize' && (
        <RoomResizeHandles room={room} />
      )}

      {/* Opening handles — seçili açıklık varsa */}
      {selectedOpening && (
        <OpeningHandles room={room} opening={selectedOpening} />
      )}
    </group>
  )
}
