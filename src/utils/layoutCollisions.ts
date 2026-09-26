/**
 * layoutCollisions — bir yerleşimdeki fiziksel çakışmaları bulur.
 *
 * Kontroller:
 *   - outside-room : mobilya ayak izi, parent odanın duvar iç yüzlerinin dışına taşıyor
 *   - overlap      : iki mobilya 3B'de (ayak izi + yükseklik aralığı) iç içe
 *   - door         : mobilya bir kapının açılma alanına giriyor
 *   - room-overlap : iki odanın zemini üst üste biniyor
 *
 * Ayak izi, registry'deki getBoundingBox ile hesaplanır ve mobilyanın
 * rotasyonuyla döndürülmüş dikdörtgendir (three.js Y rotasyonu).
 */

import type { FurnitureItem, LayoutData, Room, WallOpening } from '../types'
import { getBoundingBox } from '../components/Furniture/registry'
import { WALL_T } from '../constants'

/** Bu kadarlık (m) iç içe geçme gürültü sayılır. */
export const COLLISION_TOLERANCE = 0.005

/** Zemine serilen, üstüne eşya konan tipler — mobilya çakışmasına katılmaz. */
const FLOOR_LAYER_TYPES = new Set(['rug', 'grass-patch'])

/** Kapının açılma alanı derinliği en fazla bu kadar alınır (m). */
const DOOR_SWING_MAX = 0.9

const DOOR_TYPES = new Set<WallOpening['type']>(['door', 'double-door', 'sliding-door'])

type Vec2 = [number, number]

export interface Footprint {
  corners: [Vec2, Vec2, Vec2, Vec2]
  yMin: number
  yMax: number
}

export interface CollisionIssue {
  kind: 'outside-room' | 'overlap' | 'door' | 'room-overlap'
  ids: string[]
  /** Çakışma miktarı (m) — taşma ya da iç içe geçme derinliği */
  depth: number
  message: string
}

export function furnitureFootprint(f: FurnitureItem): Footprint {
  const bb = getBoundingBox(f.type, f.dims, f.variant)
  const hw = bb.w / 2
  const hd = bb.d / 2
  const c = Math.cos(f.rotation)
  const s = Math.sin(f.rotation)
  const [cx, cz] = f.position
  // three.js Y rotasyonu: x' = x·cos + z·sin, z' = -x·sin + z·cos
  const at = (lx: number, lz: number): Vec2 => [cx + lx * c + lz * s, cz - lx * s + lz * c]
  const yMin = bb.yOffset ?? 0
  return {
    corners: [at(-hw, -hd), at(hw, -hd), at(hw, hd), at(-hw, hd)],
    yMin,
    yMax: yMin + bb.h,
  }
}

/** Dünya noktasını oda yerel eksenine çevirir (polygon.ts getWorldVertices'in tersi). */
function toRoomLocal(room: Room, [x, z]: Vec2): Vec2 {
  const c = Math.cos(room.rotation)
  const s = Math.sin(room.rotation)
  const dx = x - room.position[0]
  const dz = z - room.position[1]
  return [dx * c + dz * s, -dx * s + dz * c]
}

/**
 * Odanın mobilya için kullanılabilir iç sınırları (oda yerel ekseninde).
 * Duvar varsa iç yüz kenardan WALL_T/2 içeride; duvar kaldırılmışsa oda kenarı.
 */
export function roomInnerBounds(room: Room) {
  const hw = room.widthCm / 200
  const hl = room.lengthCm / 200
  const removed = room.removedWalls ?? []
  const inset = (side: Room['removedWalls'][number]) => (removed.includes(side) ? 0 : WALL_T / 2)
  return {
    minX: -hw + inset('left'),
    maxX: hw - inset('right'),
    minZ: -hl + inset('back'),
    maxZ: hl - inset('front'),
  }
}

/** Ayrık eksen teoremi — iki dışbükey dörtgenin iç içe geçme derinliği (0 = değmiyor). */
export function polygonPenetration(a: Vec2[], b: Vec2[]): number {
  let minDepth = Infinity
  for (const poly of [a, b]) {
    for (let i = 0; i < poly.length; i++) {
      const [x1, z1] = poly[i]
      const [x2, z2] = poly[(i + 1) % poly.length]
      const len = Math.hypot(x2 - x1, z2 - z1)
      if (len < 1e-9) continue
      const nx = -(z2 - z1) / len
      const nz = (x2 - x1) / len
      const project = (p: Vec2[]) => {
        let lo = Infinity, hi = -Infinity
        for (const [x, z] of p) {
          const d = x * nx + z * nz
          if (d < lo) lo = d
          if (d > hi) hi = d
        }
        return [lo, hi]
      }
      const [aLo, aHi] = project(a)
      const [bLo, bHi] = project(b)
      const depth = Math.min(aHi, bHi) - Math.max(aLo, bLo)
      if (depth <= 0) return 0
      if (depth < minDepth) minDepth = depth
    }
  }
  return minDepth
}

/** Kapının oda içine doğru açılma alanı (dünya ekseninde dörtgen). */
export function doorSwingArea(room: Room, door: WallOpening): Vec2[] {
  const hw = room.widthCm / 200
  const hl = room.lengthCm / 200
  const width = door.widthCm / 100
  const depth = Math.min(width, DOOR_SWING_MAX)
  // Yerel eksende: duvar boyunca [a, b], duvardan içeri [0, depth]
  let local: Vec2[]
  if (door.wall === 'left' || door.wall === 'right') {
    const along = -hl + door.positionAlongWall * 2 * hl
    const z0 = along - width / 2, z1 = along + width / 2
    const x0 = door.wall === 'left' ? -hw : hw - depth
    local = [[x0, z0], [x0 + depth, z0], [x0 + depth, z1], [x0, z1]]
  } else {
    const along = -hw + door.positionAlongWall * 2 * hw
    const x0 = along - width / 2, x1 = along + width / 2
    const z0 = door.wall === 'back' ? -hl : hl - depth
    local = [[x0, z0], [x1, z0], [x1, z0 + depth], [x0, z0 + depth]]
  }
  const c = Math.cos(room.rotation)
  const s = Math.sin(room.rotation)
  return local.map(([lx, lz]) => [
    room.position[0] + lx * c - lz * s,
    room.position[1] + lx * s + lz * c,
  ])
}

function roomCorners(room: Room): Vec2[] {
  const hw = room.widthCm / 200
  const hl = room.lengthCm / 200
  const c = Math.cos(room.rotation)
  const s = Math.sin(room.rotation)
  const [cx, cz] = room.position
  return ([[-hw, -hl], [hw, -hl], [hw, hl], [-hw, hl]] as Vec2[]).map(([lx, lz]) => [
    cx + lx * c - lz * s,
    cz + lx * s + lz * c,
  ])
}

const sameFloor = (a: { floorId?: string }, b: { floorId?: string }) => (a.floorId ?? '') === (b.floorId ?? '')

export function findLayoutCollisions(layout: LayoutData, tol = COLLISION_TOLERANCE): CollisionIssue[] {
  const issues: CollisionIssue[] = []
  const rooms = layout.rooms
  const roomById = new Map(rooms.map(r => [r.id, r]))
  const prints = new Map(layout.furniture.map(f => [f.id, furnitureFootprint(f)]))

  // 1) Mobilya parent odanın iç sınırları içinde mi
  for (const f of layout.furniture) {
    const room = f.parentRoomId ? roomById.get(f.parentRoomId) : undefined
    if (!room) continue
    const b = roomInnerBounds(room)
    let worst = 0
    for (const p of prints.get(f.id)!.corners) {
      const [lx, lz] = toRoomLocal(room, p)
      worst = Math.max(worst, b.minX - lx, lx - b.maxX, b.minZ - lz, lz - b.maxZ)
    }
    if (worst > tol) {
      issues.push({
        kind: 'outside-room', ids: [f.id, room.id], depth: worst,
        message: `${f.id} (${f.type}) oda ${room.id} duvarından ${(worst * 100).toFixed(1)} cm taşıyor`,
      })
    }
  }

  // 2) Mobilya ↔ mobilya
  const items = layout.furniture.filter(f => !FLOOR_LAYER_TYPES.has(f.type))
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i], b = items[j]
      if (!sameFloor(a, b)) continue
      const pa = prints.get(a.id)!, pb = prints.get(b.id)!
      if (Math.min(pa.yMax, pb.yMax) - Math.max(pa.yMin, pb.yMin) <= tol) continue
      const depth = polygonPenetration(pa.corners, pb.corners)
      if (depth > tol) {
        issues.push({
          kind: 'overlap', ids: [a.id, b.id], depth,
          message: `${a.id} (${a.type}) ile ${b.id} (${b.type}) ${(depth * 100).toFixed(1)} cm iç içe`,
        })
      }
    }
  }

  // 3) Kapı açılma alanı
  for (const room of rooms) {
    for (const door of room.openings ?? []) {
      if (!DOOR_TYPES.has(door.type) || door.wallIndex !== undefined) continue
      const area = doorSwingArea(room, door)
      const doorTop = door.bottomCm / 100 + door.heightCm / 100
      for (const f of items) {
        if (!sameFloor(f, room)) continue
        const p = prints.get(f.id)!
        if (p.yMin >= doorTop - tol) continue
        const depth = polygonPenetration(area, p.corners)
        if (depth > tol) {
          issues.push({
            kind: 'door', ids: [f.id, door.id], depth,
            message: `${f.id} (${f.type}) oda ${room.id} kapısı ${door.id} açılma alanına ${(depth * 100).toFixed(1)} cm giriyor`,
          })
        }
      }
    }
  }

  // 4) Oda ↔ oda zemin çakışması
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const a = rooms[i], b = rooms[j]
      if (!sameFloor(a, b)) continue
      const depth = polygonPenetration(roomCorners(a), roomCorners(b))
      if (depth > tol) {
        issues.push({
          kind: 'room-overlap', ids: [a.id, b.id], depth,
          message: `oda ${a.id} ile ${b.id} ${(depth * 100).toFixed(1)} cm üst üste`,
        })
      }
    }
  }

  return issues
}
