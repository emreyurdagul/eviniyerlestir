/**
 * PolygonRoomMesh — 3 veya daha fazla köşeli polygon oda renderer'ı.
 *
 * Mimari:
 *   - Zemin: THREE.Shape + ShapeGeometry (polygon şekli)
 *   - Duvarlar: Her kenar için BoxGeometry (kenar yönüne hizalanmış)
 *   - Seçim highlight: LineLoop (köşe noktaları üzerinde)
 *   - Sürükleme: RoomMesh ile aynı window pointermove/up pattern'i
 *   - Etiket: Html drei bileşeni (zIndexRange={[0,0]} → UI panellerinin altında)
 *
 * Resize handles polygon odalar için gösterilmez (köşe düzenleme Phase 2'de).
 * Openings (kapı/pencere) dikdörtgen kenarlar için tanımlıdır; polygon
 * odalar için Phase 2'de eklenir.
 */

import { useRef, useMemo, useEffect, memo } from 'react'
import * as THREE from 'three'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import type { Room } from '../../types'
import { useDesignStore } from '../../store/designStore'
import { FLOOR_TYPES, ROOM_TYPES } from '../../types'
import { ensureCCW, getRoomEdges } from '../../utils/polygon'
import { snapRoomPosition, clampNoOverlap } from '../../utils/snap'
import { WALL_T } from '../../constants'

const ROOM_META_MAP = Object.fromEntries(ROOM_TYPES.map(r => [r.type, r]))

interface PolygonRoomMeshProps {
  room: Room
}

function PolygonRoomMesh({ room }: PolygonRoomMeshProps) {
  const groupRef = useRef<THREE.Group>(null)

  const isSelected = useDesignStore(s =>
    s.selection.kind === 'room' && s.selection.id === room.id
  )
  const select = useDesignStore(s => s.select)
  const moveRoomWithFurniture = useDesignStore(s => s.moveRoomWithFurniture)
  const setStoreDragging = useDesignStore(s => s.setDragging)
  const showDimensions = useDesignStore(s => s.showDimensions)
  const globalCeiling = useDesignStore(s => s.ceilingHeight)
  const floorCeiling = useDesignStore(s => {
    const floor = room.floorId ? s.floors.find(f => f.id === room.floorId) : null
    return floor?.ceilingHeight ?? null
  })
  const WALL_H = floorCeiling ?? globalCeiling

  const { raycaster, gl, camera } = useThree()

  const draggingRef = useRef(false)
  const dragOffset = useRef(new THREE.Vector3())
  const roomRef = useRef(room)
  roomRef.current = room

  const verts = useMemo(
    () => ensureCCW(room.vertices ?? []),
    [room.vertices],
  )

  // ── Zemin (ShapeGeometry) ───────────────────────────────────────────────────
  // Shape XY → mesh rotation [-PI/2, 0, 0] → XZ dünya koordinatı.
  // Shape Y = -room.z (sign flip: rotation sonrası Y→-Z, -Z*-1=Z → doğru)
  const floorShape = useMemo(() => {
    if (verts.length < 3) return null
    const shape = new THREE.Shape()
    shape.moveTo(verts[0][0], -verts[0][1])
    for (let i = 1; i < verts.length; i++) {
      shape.lineTo(verts[i][0], -verts[i][1])
    }
    shape.closePath()
    return shape
  }, [verts])

  // ── Duvar kenarları ─────────────────────────────────────────────────────────
  const edges = useMemo(() => getRoomEdges(room), [room])

  // ── Materyaller ─────────────────────────────────────────────────────────────
  const floorCol = useMemo(() => {
    const ft = FLOOR_TYPES.find(f => f.type === room.floorType)
    return ft?.color ?? 0xbcad92
  }, [room.floorType])

  const wallColInner = useMemo(
    () => new THREE.Color(room.wallColor ?? '#e3ddd4').getHex(),
    [room.wallColor],
  )

  const floorMat = useMemo(
    () => new THREE.MeshLambertMaterial({ color: floorCol, side: THREE.DoubleSide }),
    [floorCol],
  )
  const wallMat = useMemo(
    () => new THREE.MeshLambertMaterial({ color: wallColInner }),
    [wallColInner],
  )

  // ── Seçim highlight (polygon outline, THREE.LineLoop primitive) ────────────
  // <line> JSX elementi SVG ile çakışır → THREE.LineLoop primitive kullanılır.
  const highlightPrimitive = useMemo(() => {
    if (verts.length < 3) return null
    const pts = verts.map(([x, z]) => new THREE.Vector3(x, WALL_H + 0.06, z))
    const geo = new THREE.BufferGeometry().setFromPoints(pts)
    const mat = new THREE.LineBasicMaterial({ color: room.color, transparent: true, opacity: 0.7 })
    return new THREE.LineLoop(geo, mat)
  // room.color değişince yeniden oluştur
  }, [verts, WALL_H, room.color])

  // ── Drag ───────────────────────────────────────────────────────────────────
  const groundPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), [])

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
    const state = useDesignStore.getState()
    const roomFloorId = r.floorId ?? state.activeFloorId
    const sameFloorRooms = state.rooms.filter(x => (x.floorId ?? state.activeFloorId) === roomFloorId)
    const snapped = snapRoomPosition(r, rawX, rawZ, sameFloorRooms)
    let finalX = snapped.x
    let finalZ = snapped.z
    if (state.preventRoomOverlap) {
      const safe = clampNoOverlap(r, snapped.x, snapped.z, sameFloorRooms)
      finalX = safe.x
      finalZ = safe.z
    }
    const dx = finalX - r.position[0]
    const dz = finalZ - r.position[1]
    moveRoomWithFurniture(r.id, dx, dz)
  }

  const stopDrag = () => {
    if (!draggingRef.current) return
    draggingRef.current = false
    setStoreDragging(false)
    window.__evPointerCaptured = false
    window.removeEventListener('pointermove', onWindowMove)
    window.removeEventListener('pointerup', onWindowUp)
    window.removeEventListener('pointercancel', onWindowUp)
  }

  const onWindowUp = () => { stopDrag() }

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (window.__evPointerCaptured) return
    const native: PointerEvent | undefined = e.nativeEvent
    if (native?.button === 2) return
    e.stopPropagation()
    native?.stopPropagation?.()
    native?.stopImmediatePropagation?.()

    select('room', room.id)
    window.__evPointerCaptured = true

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => { if (draggingRef.current) stopDrag() }, [])

  const handleContextMenu = (e: ThreeEvent<MouseEvent>) => {
    if (window.__evPointerCaptured) return
    e.stopPropagation()
    select('room', room.id)
    const ne = e.nativeEvent ?? e
    useDesignStore.getState().setContextMenuPos({
      x: ne.clientX ?? window.__lastPointerX ?? 0,
      y: ne.clientY ?? window.__lastPointerY ?? 0,
    })
  }

  if (!floorShape || verts.length < 3) return null

  return (
    <group
      ref={groupRef}
      position={[room.position[0], 0, room.position[1]]}
      rotation={[0, room.rotation, 0]}
      onPointerDown={handlePointerDown}
      onContextMenu={handleContextMenu}
    >
      {/* Zemin (polygon şekli) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <shapeGeometry args={[floorShape]} />
        <primitive object={floorMat} attach="material" />
      </mesh>

      {/* Duvarlar — her kenar için bir BoxGeometry */}
      {edges.map((edge, i) => (
        <mesh
          key={i}
          position={[edge.midX, WALL_H / 2, edge.midZ]}
          rotation={[0, edge.rotY, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[WALL_T, WALL_H, edge.length]} />
          <primitive object={wallMat} attach="material" />
        </mesh>
      ))}

      {/* Seçim highlight — polygon outline (primitive: SVG <line> çakışmasından kaçın) */}
      {isSelected && highlightPrimitive && (
        <primitive object={highlightPrimitive} />
      )}

      {/* Oda tipi etiketi */}
      {!showDimensions && (
        <Html position={[0, 0.05, 0]} center zIndexRange={[0, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(255,255,255,0.75)',
            color: '#3a2e20',
            padding: '2px 7px',
            borderRadius: 5,
            fontSize: 10,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            userSelect: 'none',
            border: '1px solid rgba(0,0,0,0.10)',
          }}>
            {ROOM_META_MAP[room.type]?.icon} {ROOM_META_MAP[room.type]?.label ?? room.type}
            {' '}
            <span style={{ fontWeight: 400, color: '#888', fontSize: 9 }}>
              ⬡ {(room.widthCm / 100).toFixed(1)}×{(room.lengthCm / 100).toFixed(1)}m
            </span>
          </div>
        </Html>
      )}

      {/* Boyut etiketleri (showDimensions aktifken) */}
      {showDimensions && (
        <Html position={[0, 0.05, 0]} center zIndexRange={[0, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(255,255,255,0.85)',
            color: '#3a2e20',
            padding: '3px 8px',
            borderRadius: 5,
            fontSize: 9,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            userSelect: 'none',
            border: '1px solid rgba(0,0,0,0.12)',
          }}>
            {ROOM_META_MAP[room.type]?.icon} {room.widthCm}×{room.lengthCm}cm
            <br />
            <span style={{ color: '#666' }}>
              {verts.length} köşe · {((room.widthCm / 100) * (room.lengthCm / 100)).toFixed(1)}m²
            </span>
          </div>
        </Html>
      )}
    </group>
  )
}

export default memo(PolygonRoomMesh, (prev, next) => prev.room === next.room)
