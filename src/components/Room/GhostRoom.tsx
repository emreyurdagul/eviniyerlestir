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

  // Duvar outline geometrisi — BoxGeometry'nin edges'i (tek referans, memo'lu)
  const edgesGeom = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, l)), [w, h, l])

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
      <lineSegments geometry={edgesGeom} raycast={disabledRaycast}>
        <lineBasicMaterial color={0x888888} transparent opacity={0.25} depthWrite={false} />
      </lineSegments>
    </group>
  )
}

export default memo(GhostRoom, (a, b) => a.room === b.room)
