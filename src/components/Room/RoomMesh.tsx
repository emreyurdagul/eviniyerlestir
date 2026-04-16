import { useRef, useMemo, useEffect, memo } from 'react'
import * as THREE from 'three'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import type { Room } from '../../types'
import { useDesignStore } from '../../store/designStore'
import { FLOOR_TYPES, ROOM_TYPES } from '../../types'
import WallWithOpenings from './WallWithOpenings'
import { snapRoomPosition, clampNoOverlap } from '../../utils/snap'
import DimensionLabels from './DimensionLabels'
import RoomResizeHandles from './RoomResizeHandles'
import OpeningHandles from './OpeningHandles'
import { WALL_T } from '../../constants'

const ROOM_META_MAP = Object.fromEntries(ROOM_TYPES.map(r => [r.type, r]))

interface RoomMeshProps {
  room: Room
}

const SKIRT_H = 0.09

function RoomMesh({ room }: RoomMeshProps) {
  const groupRef = useRef<THREE.Group>(null)
  // #5: derived selectors — sadece ilgili seçim/opening değiştiğinde re-render.
  const isSelected = useDesignStore(s =>
    s.selection.kind === 'room' && s.selection.id === room.id
  )
  const selectedOpeningId = useDesignStore(s =>
    s.selection.kind === 'opening' && s.selection.parentId === room.id
      ? s.selection.id
      : null
  )
  const select = useDesignStore(s => s.select)
  const moveRoomWithFurniture = useDesignStore(s => s.moveRoomWithFurniture)
  const setStoreDragging = useDesignStore(s => s.setDragging)
  const showDimensions = useDesignStore(s => s.showDimensions)
  // #6: Oda kendi katının tavan yüksekliğini kullanır; kat özel değer yoksa global'e düşer.
  const globalCeiling = useDesignStore(s => s.ceilingHeight)
  const floorCeiling = useDesignStore(s => {
    const floor = room.floorId ? s.floors.find(f => f.id === room.floorId) : null
    return floor?.ceilingHeight ?? null
  })
  const WALL_H = floorCeiling ?? globalCeiling
  const { raycaster, gl, camera } = useThree()

  const selectOpening = useDesignStore(s => s.selectOpening)

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

  // ── Köşe çıkıntısı önleme ───────────────────────────────────────
  // Arka/ön duvar: merkezi z=±hl, kalınlık WALL_T → iç yüzü z=±hl+WALL_T/2.
  // Sol/sağ duvarlar bu iç yüze kadar uzanmalı; fazlasını kesmek boşluk açar.
  // Her uca doğru kesilecek miktar: WALL_T / 2 (yarı-kalınlık).
  const wBackTrim  = removed.includes('back')  ? 0 : WALL_T / 2
  const wFrontTrim = removed.includes('front') ? 0 : WALL_T / 2
  const lWallLen   = Math.max(0.05, lM - wBackTrim - wFrontTrim)
  const lWallZOff  = (wBackTrim - wFrontTrim) / 2   // asimetrik durumda merkezi kaydır

  // Arka/ön duvar X-genişliği: yan duvar varsa sadece WALL_T/2 uzat (köşe çıkıntısı önle),
  // yan duvar yoksa WALL_T uzat (temiz köşe kaplaması).
  const wBFLeftExt  = removed.includes('left')  ? WALL_T : WALL_T / 2
  const wBFRightExt = removed.includes('right') ? WALL_T : WALL_T / 2
  const wBFLen  = wM + wBFLeftExt + wBFRightExt
  const wBFXOff = (wBFRightExt - wBFLeftExt) / 2

  // Süpürgelik: arka skirting z=±hl+0.02 merkezli, kalınlık WALL_T
  //   → iç yüzü z=±hl + 0.02 + WALL_T/2 ≈ ±hl+0.07
  // Sol/sağ skirting bu noktaya kadar uzanmalı: trim = 0.02 + WALL_T/2
  const SKIRT_TRIM = 0.02 + WALL_T / 2   // ~0.07 m
  const sBackTrim  = removed.includes('back')  ? 0 : SKIRT_TRIM
  const sFrontTrim = removed.includes('front') ? 0 : SKIRT_TRIM
  const sLRLen  = Math.max(0.05, lM - sBackTrim - sFrontTrim)
  const sLRZOff = (sBackTrim - sFrontTrim) / 2
  // Arka/ön süpürgelik sol/sağ köşe boşluğunu doldursun
  const sLExt  = removed.includes('left')  ? 0 : SKIRT_TRIM
  const sRExt  = removed.includes('right') ? 0 : SKIRT_TRIM
  const sBFWid  = wM + sLExt + sRExt
  const sBFXOff = (sRExt - sLExt) / 2

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
    const state = useDesignStore.getState()
    // #6: snap/overlap sadece aynı kattaki odalarla — kat değiştirince
    // alttaki kat odalarıyla yakalanma olmasın
    const roomFloorId = r.floorId ?? state.activeFloorId
    const sameFloorRooms = state.rooms.filter(x => (x.floorId ?? state.activeFloorId) === roomFloorId)
    const snapped = snapRoomPosition(r, rawX, rawZ, sameFloorRooms)

    // Oda çakışma koruması
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
    // Bir başka öğe (mobilya / handle) pointer'ı zaten yakaladıysa atla
    if (window.__evPointerCaptured) return
    const native: PointerEvent | undefined = e.nativeEvent
    // Sağ tık: preventDefault çağırırsak contextmenu olayı iptal olur → menü açılmaz
    if (native?.button === 2) return
    e.stopPropagation()
    native?.stopPropagation?.()
    native?.stopImmediatePropagation?.()

    select('room', room.id)
    // NOTE: native.preventDefault() is intentionally omitted here.
    // R3F registers the canvas pointerdown listener as passive, so any
    // preventDefault() call is silently ignored AND logs a browser warning.
    // Drag capture is handled via window pointermove/pointerup (added below)
    // which are non-passive and don't require preventDefault on pointerdown.

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

  // Unmount güvenlik ağı: sürükleme aktifken bileşen kaldırılırsa window
  // listener'larını bırak. stopDrag'ı deps'e eklemek her render cleanup
  // tetiklerdi ve aktif listener'lar sızardı. Ref tabanlı alternatif
  // stopDrag'daki window.__evPointerCaptured mutasyonu nedeniyle
  // react-hooks/immutability'yi tetikliyor — bilinçli suppression:
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
            {!removed.includes('left') && <WallWithOpenings wallLength={lWallLen} wallHeight={WALL_H} wallThickness={WALL_T}
              position={[-hw, 0, lWallZOff]} rotation={[0, Math.PI / 2, 0]} material={wallMatInner} outerMaterial={wallMatOuter}
              openings={(room.openings ?? []).filter(o => o.wall === 'left')}
              selectedOpeningId={selectedOpeningId} onSelectOpening={id => selectOpening(id, room.id)}
              onWallContextMenu={wallCtx('left')} />}
            {!removed.includes('right') && <WallWithOpenings wallLength={lWallLen} wallHeight={WALL_H} wallThickness={WALL_T}
              position={[hw, 0, lWallZOff]} rotation={[0, Math.PI / 2, 0]} material={wallMatInner} outerMaterial={wallMatOuter}
              flipInnerOuter openings={(room.openings ?? []).filter(o => o.wall === 'right')}
              selectedOpeningId={selectedOpeningId} onSelectOpening={id => selectOpening(id, room.id)}
              onWallContextMenu={wallCtx('right')} />}
            {!removed.includes('back') && <WallWithOpenings wallLength={wBFLen} wallHeight={WALL_H} wallThickness={WALL_T}
              position={[wBFXOff, 0, -hl]} rotation={[0, 0, 0]} material={wallMatInner} outerMaterial={wallMatOuter}
              openings={(room.openings ?? []).filter(o => o.wall === 'back')}
              selectedOpeningId={selectedOpeningId} onSelectOpening={id => selectOpening(id, room.id)}
              onWallContextMenu={wallCtx('back')} />}
            {!removed.includes('front') && <WallWithOpenings wallLength={wBFLen} wallHeight={WALL_H} wallThickness={WALL_T}
              position={[wBFXOff, 0, hl]} rotation={[0, 0, 0]} material={wallMatInner} outerMaterial={wallMatOuter}
              flipInnerOuter openings={(room.openings ?? []).filter(o => o.wall === 'front')}
              selectedOpeningId={selectedOpeningId} onSelectOpening={id => selectOpening(id, room.id)}
              onWallContextMenu={wallCtx('front')} />}
          </>
        )
      })()}

      {/* Skirting — köşe çakışması önlenmiş */}
      {!removed.includes('left') && <mesh position={[-hw + 0.02, SKIRT_H / 2, sLRZOff]}>
        <boxGeometry args={[WALL_T, SKIRT_H, sLRLen]} />
        <primitive object={skirtMat} attach="material" />
      </mesh>}
      {!removed.includes('right') && <mesh position={[hw - 0.02, SKIRT_H / 2, sLRZOff]}>
        <boxGeometry args={[WALL_T, SKIRT_H, sLRLen]} />
        <primitive object={skirtMat} attach="material" />
      </mesh>}
      {!removed.includes('back') && <mesh position={[sBFXOff, SKIRT_H / 2, -hl + 0.02]}>
        <boxGeometry args={[sBFWid, SKIRT_H, WALL_T]} />
        <primitive object={skirtMat} attach="material" />
      </mesh>}
      {!removed.includes('front') && <mesh position={[sBFXOff, SKIRT_H / 2, hl - 0.02]}>
        <boxGeometry args={[sBFWid, SKIRT_H, WALL_T]} />
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

      {/* Daima görünen oda tipi etiketi (yalnızca boyutlar kapalıyken) */}
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
          </div>
        </Html>
      )}

      {/* Resize handles — seçili oda için her zaman görünür */}
      {isSelected && (
        <RoomResizeHandles room={room} />
      )}

      {/* Opening handles — seçili açıklık varsa */}
      {selectedOpening && (
        <OpeningHandles room={room} opening={selectedOpening} />
      )}
    </group>
  )
}

/**
 * #5: Aynı `room` referansı için re-render etme. Store oda listesi immutable
 * güncellendiği için sadece gerçekten değişen oda yeni referans alır.
 */
export default memo(RoomMesh, (prev, next) => prev.room === next.room)
