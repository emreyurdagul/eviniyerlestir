/**
 * GhostRoom — aktif olmayan kattaki odanın "hayalet" gösterimi.
 *
 * Amaç: kullanıcı üst kattan alt kattaki odaya hizalama yapabilsin,
 * ama yanlışlıkla tıklayıp seçmesin. Bu nedenle:
 *   - Tüm mesh'ler `raycast={() => {}}` ile tıklanamaz yapılır
 *   - Materyaller transparent + düşük opacity (silik görünüm)
 *   - Sadece temel zemin planı + duvar outline gösterilir (tam detay değil)
 *
 * Tam duvar / açıklık / dekor render etmiyoruz — performans için basit
 * tutuldu. Kullanıcıya "şurada oda var" görselini verir, o kadar.
 */

import { memo, useMemo } from 'react'
import * as THREE from 'three'
import type { Room } from '../../types'
import { useDesignStore } from '../../store/designStore'
import { ensureCCW } from '../../utils/polygon'

interface GhostRoomProps {
  room: Room
}

// raycast hiçbir şey döndürmesin: child mesh'ler tıklanamaz
function disabledRaycast() { /* no-op */ }

function GhostRoom({ room }: GhostRoomProps) {
  const w = room.widthCm / 100
  const l = room.lengthCm / 100

  // Bu katın tavan yüksekliğini al — ghost duvar yüksekliği doğru olsun
  const globalCeiling = useDesignStore(s => s.ceilingHeight)
  const floorCeiling = useDesignStore(s => {
    const floor = room.floorId ? s.floors.find(f => f.id === room.floorId) : null
    return floor?.ceilingHeight ?? null
  })
  const h = floorCeiling ?? globalCeiling

  const isPolygon = room.shape === 'polygon' && room.vertices && room.vertices.length >= 3

  // ── Dikdörtgen ghost ─────────────────────────────────────────────────────────
  const edgesGeomRect = useMemo(
    () => (!isPolygon ? new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, l)) : null),
    [isPolygon, w, h, l],
  )

  // ── Polygon ghost ─────────────────────────────────────────────────────────────

  // Zemin outline: THREE.LineLoop (SVG <line> çakışmasından kaçınmak için primitive)
  // THREE.LineLoop ilk+son noktayı otomatik kapatır — kapatma noktası eklenmez.
  const polyOutlinePrimitive = useMemo(() => {
    if (!isPolygon || !room.vertices) return null
    const verts = ensureCCW(room.vertices)
    const pts = verts.map(([x, z]) => new THREE.Vector3(x, 0.005, z))
    const geo = new THREE.BufferGeometry().setFromPoints(pts)
    const mat = new THREE.LineBasicMaterial({
      color: 0x888888, transparent: true, opacity: 0.3, depthWrite: false,
    })
    const loop = new THREE.LineLoop(geo, mat)
    loop.raycast = disabledRaycast
    return loop
  }, [isPolygon, room.vertices])

  // Köşe yükseklik çizgileri: LineSegments (disposed geometry, tek primitive)
  const polyCornerGeo = useMemo(() => {
    if (!isPolygon || !room.vertices) return null
    const pts: THREE.Vector3[] = []
    for (const [vx, vz] of room.vertices) {
      pts.push(new THREE.Vector3(vx, 0, vz))
      pts.push(new THREE.Vector3(vx, h, vz))
    }
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [isPolygon, room.vertices, h])

  // Zemin dolgu (ShapeGeometry)
  const polyFloorShape = useMemo(() => {
    if (!isPolygon || !room.vertices) return null
    const verts = ensureCCW(room.vertices)
    const shape = new THREE.Shape()
    shape.moveTo(verts[0][0], -verts[0][1])
    for (let i = 1; i < verts.length; i++) {
      shape.lineTo(verts[i][0], -verts[i][1])
    }
    shape.closePath()
    return shape
  }, [isPolygon, room.vertices])

  if (isPolygon) {
    return (
      <group
        position={[room.position[0], 0, room.position[1]]}
        rotation={[0, room.rotation, 0]}
      >
        {/* Polygon zemin dolgusu */}
        {polyFloorShape && (
          <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={disabledRaycast}>
            <shapeGeometry args={[polyFloorShape]} />
            <meshBasicMaterial
              color={room.color ?? 0xaaaaaa}
              transparent
              opacity={0.08}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}

        {/* Polygon outline (THREE.LineLoop primitive — SVG <line> çakışması yok) */}
        {polyOutlinePrimitive && <primitive object={polyOutlinePrimitive} />}

        {/* Köşe yükseklik çizgileri */}
        {polyCornerGeo && (
          <lineSegments geometry={polyCornerGeo} raycast={disabledRaycast}>
            <lineBasicMaterial color={0x888888} transparent opacity={0.15} depthWrite={false} />
          </lineSegments>
        )}
      </group>
    )
  }

  return (
    <group
      position={[room.position[0], h / 2, room.position[1]]}
      rotation={[0, room.rotation, 0]}
    >
      {/* Döşeme (zemin) planı — hafif renklendirilmiş, yarı saydam */}
      <mesh position={[0, -h / 2 + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={disabledRaycast}>
        <planeGeometry args={[w, l]} />
        <meshBasicMaterial color={room.color ?? 0xaaaaaa} transparent opacity={0.08} depthWrite={false} />
      </mesh>

      {/* Duvar kenarları — wireframe (kutu kenarları) */}
      {edgesGeomRect && (
        <lineSegments geometry={edgesGeomRect} raycast={disabledRaycast}>
          <lineBasicMaterial color={0x888888} transparent opacity={0.25} depthWrite={false} />
        </lineSegments>
      )}
    </group>
  )
}

export default memo(GhostRoom, (a, b) => a.room === b.room)
