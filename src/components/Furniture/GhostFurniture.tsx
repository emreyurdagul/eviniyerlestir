/**
 * GhostFurniture — aktif olmayan kattaki mobilyanın "hayalet" gösterimi.
 *
 * Amaç: kullanıcı üst kattan alt kattaki mobilyaya hizalama yapabilsin,
 * ama yanlışlıkla tıklayıp seçmesin. Bu nedenle:
 *   - Tüm mesh'ler `raycast={() => {}}` ile tıklanamaz yapılır
 *   - Renklendirilmiş şeffaf box + wireframe kenarlar (hangi tür olduğu belli olur)
 *
 * Tam 3D modeli yüklemiyoruz (lazy import tetiklemez) — boundingBox yeter.
 * Bu sayede çok katlı sahnelerde 100+ ghost mobilya bile hafif kalır.
 */

import { memo, useMemo } from 'react'
import * as THREE from 'three'
import type { FurnitureItem as FurnitureItemType } from '../../types'
import { getBoundingBox } from './registry'

interface GhostFurnitureProps {
  item: FurnitureItemType
}

function disabledRaycast() { /* no-op */ }

function GhostFurniture({ item }: GhostFurnitureProps) {
  const bb = getBoundingBox(item.type, item.dims, item.variant)
  const edgesGeom = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(bb.w, bb.h, bb.d)),
    [bb.w, bb.h, bb.d]
  )

  return (
    <group
      position={[item.position[0], bb.h / 2, item.position[1]]}
      rotation={[0, item.rotation, 0]}
    >
      {/* Yarı saydam dolu box — mobilyanın yerini/büyüklüğünü ima eder */}
      <mesh raycast={disabledRaycast}>
        <boxGeometry args={[bb.w, bb.h, bb.d]} />
        <meshBasicMaterial color={item.color} transparent opacity={0.12} depthWrite={false} />
      </mesh>
      {/* Kenar çizgisi — net outline */}
      <lineSegments geometry={edgesGeom} raycast={disabledRaycast}>
        <lineBasicMaterial color={item.color} transparent opacity={0.45} depthWrite={false} />
      </lineSegments>
    </group>
  )
}

export default memo(GhostFurniture, (a, b) => a.item === b.item)
