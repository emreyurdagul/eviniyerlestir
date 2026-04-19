/**
 * PolygonRoomMesh — 3 veya daha fazla köşeli polygon oda renderer'ı.
 *
 * Mimari:
 *   - Zemin: THREE.Shape + ShapeGeometry (polygon şekli)
 *   - Duvarlar: Her kenar için BoxGeometry segmentleri
 *       · İç/Dış renk: çok materyal (BoxGeometry yüz grupları)
 *           Grup 0 (+X yüzü) → dış cephe rengi  (outward normal, CCW kenarında)
 *           Grup 1 (-X yüzü) → iç cephe rengi   (inward normal)
 *         Kanıtı: rotY = atan2(edgeDx, edgeDz) dönüşümünde yerel +X yüzü
 *         outward normale, -X yüzü inward normale döner.
 *       · Kaldırılan duvarlar: room.removedWallIndices — kenar tamamen atlanır.
 *       · Açıklıklar: wallSegments.ts → computeWallSegments() ile hesaplanır,
 *         ardından edge koordinatlarına dönüştürülür.
 *   - Seçim highlight: THREE.LineLoop primitive (SVG <line> çakışmasından kaçınır)
 *   - Sürükleme: RoomMesh ile aynı window pointermove/up pattern'i
 *   - Etiket: Html drei (zIndexRange=[0,0] → UI panellerinin altında)
 *
 * Wall-local → room-local koordinat dönüşümü:
 *   computeWallSegments() çıktısındaki x, edge ortasından ölçülen mesafe.
 *   roomX = edge.midX + x * sin(rotY)
 *   roomZ = edge.midZ + x * cos(rotY)
 *   (sin(rotY)=edgeDx/len, cos(rotY)=edgeDz/len — kenar yön vektörü)
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
import { computeWallSegments } from './wallSegments'

const ROOM_META_MAP = Object.fromEntries(ROOM_TYPES.map(r => [r.type, r]))

interface PolygonRoomMeshProps {
  room: Room
}

/** 3D dünya koordinatlarına çevrilmiş duvar segmenti */
interface PolyWallSegment {
  key: string
  edgeIdx: number   // kenar indeksi — per-duvar renk araması için
  midX: number
  midZ: number
  yCenter: number
  height: number
  segLen: number
  rotY: number
}

function PolygonRoomMesh({ room }: PolygonRoomMeshProps) {
  const groupRef = useRef<THREE.Group>(null)

  const isSelected = useDesignStore(s =>
    s.selection.kind === 'room' && s.selection.id === room.id
  )
  const isMultiSelected = useDesignStore(s => s.multiSelectedIds.includes(room.id))
  const select = useDesignStore(s => s.select)
  const toggleMultiSelect   = useDesignStore(s => s.toggleMultiSelect)
  const clearMultiSelection  = useDesignStore(s => s.clearMultiSelection)
  const moveRoomWithFurniture = useDesignStore(s => s.moveRoomWithFurniture)
  const moveMultiSelection   = useDesignStore(s => s.moveMultiSelection)
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
  // Shape Y = -room.z (sign flip: rotation sonrası Y → -Z, -Z * -1 = Z → doğru)
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

  // ── Kenar geometrileri ─────────────────────────────────────────────────────
  const edges = useMemo(() => getRoomEdges(room), [room])

  // ── Materyaller ─────────────────────────────────────────────────────────────
  const floorCol = useMemo(() => {
    const ft = FLOOR_TYPES.find(f => f.type === room.floorType)
    return ft?.color ?? 0xbcad92
  }, [room.floorType])

  const floorMat = useMemo(
    () => new THREE.MeshLambertMaterial({ color: floorCol, side: THREE.DoubleSide }),
    [floorCol],
  )

  // Per-kenar materyaller: BoxGeometry yüz grupları [+X, -X, +Y, -Y, +Z, -Z]
  // rotY = atan2(edgeDx, edgeDz) → +X yüzü outward (dış), -X yüzü inward (iç)
  // Tanımlı wallColors override yoksa odanın genel wallColor/wallColorOuter'ına düşer.
  const wallMaterialsByEdge = useMemo(() => {
    const defInner = room.wallColor ?? '#e3ddd4'
    const defOuter = room.wallColorOuter ?? '#c8c0b4'
    const wc = room.wallColors ?? {}
    return edges.map((_, edgeIdx) => {
      const ov = wc[String(edgeIdx)] ?? {}
      const inner = new THREE.MeshLambertMaterial({ color: new THREE.Color(ov.inner ?? defInner).getHex() })
      const outer = new THREE.MeshLambertMaterial({ color: new THREE.Color(ov.outer ?? defOuter).getHex() })
      return [outer, inner, outer, outer, outer, outer]
    })
  }, [edges, room.wallColor, room.wallColorOuter, room.wallColors])

  // ── Duvar segmentleri ──────────────────────────────────────────────────────
  // 1. computeWallSegments (wallSegments.ts) → wall-local koordinatlar
  // 2. wall-local → room-local: midX + x*sin(rotY), midZ + x*cos(rotY)
  const wallSegments = useMemo<PolyWallSegment[]>(() => {
    const removedIndices = room.removedWallIndices ?? []
    const openings = room.openings ?? []

    return edges.flatMap((edge, edgeIdx) => {
      if (removedIndices.includes(edgeIdx)) return []

      const edgeOpenings = openings.filter(o => o.wallIndex === edgeIdx)
      const wallSegs = computeWallSegments(edge.length, WALL_H, edgeOpenings)

      const sinR = Math.sin(edge.rotY)
      const cosR = Math.cos(edge.rotY)

      return wallSegs.map((seg, si): PolyWallSegment => ({
        key: `w${edgeIdx}-${si}`,
        edgeIdx,
        midX: edge.midX + seg.x * sinR,
        midZ: edge.midZ + seg.x * cosR,
        yCenter: seg.y,
        height: seg.height,
        segLen: seg.width,
        rotY: edge.rotY,
      }))
    })
  }, [edges, room.removedWallIndices, room.openings, WALL_H])

  // ── Seçim highlight (THREE.LineLoop primitive — SVG <line> çakışmasından kaçın) ────
  const highlightPrimitive = useMemo(() => {
    if (verts.length < 3) return null
    const pts = verts.map(([x, z]) => new THREE.Vector3(x, WALL_H + 0.06, z))
    const geo = new THREE.BufferGeometry().setFromPoints(pts)
    const mat = new THREE.LineBasicMaterial({ color: room.color, transparent: true, opacity: 0.7 })
    return new THREE.LineLoop(geo, mat)
  }, [verts, WALL_H, room.color])

  // ── Çoklu seçim amber highlight ────────────────────────────────────────────
  const multiHighlightPrimitive = useMemo(() => {
    if (verts.length < 3) return null
    const pts = verts.map(([x, z]) => new THREE.Vector3(x, WALL_H + 0.10, z))
    const geo = new THREE.BufferGeometry().setFromPoints(pts)
    const mat = new THREE.LineBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.85 })
    return new THREE.LineLoop(geo, mat)
  }, [verts, WALL_H])

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

    // Çoklu seçim sürükleme
    const multiIds = state.multiSelectedIds
    if (multiIds.includes(r.id) && multiIds.length > 1) {
      const dx = rawX - r.position[0]
      const dz = rawZ - r.position[1]
      moveMultiSelection(dx, dz)
      return
    }

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
    window.__evPointerCaptured = true

    // Ctrl+click (Mac: Cmd+click): çoklu seçime ekle/çıkar
    if (native?.ctrlKey || native?.metaKey) {
      toggleMultiSelect(room.id)
      return
    }

    clearMultiSelection()
    select('room', room.id)

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

  // Duvar segmenti sağ-tık: seçimi 'wall' moduna al, duvar panelini aç
  const makeWallContextMenu = (edgeIdx: number) => (e: ThreeEvent<MouseEvent>) => {
    if (window.__evPointerCaptured) return
    e.stopPropagation()   // group'un oda context menüsünü engelle
    const ne = e.nativeEvent ?? e
    useDesignStore.setState({
      selection: { kind: 'wall', id: String(edgeIdx), parentId: room.id },
    })
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

      {/* Duvarlar — iç/dış renk + açıklıklar + kaldırılan duvarlar */}
      {wallSegments.map(s => (
        <mesh
          key={s.key}
          position={[s.midX, s.yCenter, s.midZ]}
          rotation={[0, s.rotY, 0]}
          castShadow
          receiveShadow
          onContextMenu={makeWallContextMenu(s.edgeIdx)}
        >
          <boxGeometry args={[WALL_T, s.height, s.segLen]} />
          <primitive object={wallMaterialsByEdge[s.edgeIdx] ?? wallMaterialsByEdge[0]} attach="material" />
        </mesh>
      ))}

      {/* Çoklu seçim amber highlight */}
      {isMultiSelected && multiHighlightPrimitive && (
        <primitive object={multiHighlightPrimitive} />
      )}

      {/* Tekli seçim highlight — polygon outline */}
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
              ⬡ {verts.length} köşe
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
            {ROOM_META_MAP[room.type]?.icon} {verts.length} köşe
            <br />
            <span style={{ color: '#666' }}>
              sınır {room.widthCm}×{room.lengthCm} cm
            </span>
          </div>
        </Html>
      )}
    </group>
  )
}

export default memo(PolygonRoomMesh, (prev, next) => prev.room === next.room)
