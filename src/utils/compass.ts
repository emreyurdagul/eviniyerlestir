/**
 * Pusula yardımcıları — duvar yönü → dünya koordinatı, dünya yönü → kardinal (K/KD/D...).
 *
 * Oda rotasyonu ve sahnenin kuzey (compass) ayarına göre bir duvarın hangi yöne
 * baktığını kısa etiket olarak döndürür. PropertiesPanel içinde duvar butonlarının
 * altında "K / D / G / B" badge'i olarak kullanılır.
 */

import type { WallSide } from '../types'

const WALL_LOCAL_NORMAL: Record<WallSide, [number, number]> = {
  left:  [-1,  0],
  right: [ 1,  0],
  front: [ 0,  1],
  back:  [ 0, -1],
}

/** Yerel duvar normalini oda rotasyonuyla döndürür → dünya (x, z) vektörü. */
export function wallWorldNormal(wall: WallSide, rotation: number): [number, number] {
  const [lx, lz] = WALL_LOCAL_NORMAL[wall]
  const c = Math.cos(rotation)
  const s = Math.sin(rotation)
  return [lx * c - lz * s, lx * s + lz * c]
}

/**
 * Dünya (x, z) yönünü — sahne kuzey açısı (compassAngle) ile normalize edip —
 * kardinal kısaltmaya çevirir: K, KD, D, GD, G, GB, B, KB.
 */
export function toCardinal(wx: number, wz: number, compassAngle: number): string {
  const c = Math.cos(-compassAngle)
  const s = Math.sin(-compassAngle)
  const cx = wx * c - wz * s
  const cz = wx * s + wz * c
  const deg = (Math.atan2(cx, -cz) * 180 / Math.PI + 360) % 360
  if (deg < 22.5 || deg >= 337.5) return 'K'
  if (deg < 67.5)  return 'KD'
  if (deg < 112.5) return 'D'
  if (deg < 157.5) return 'GD'
  if (deg < 202.5) return 'G'
  if (deg < 247.5) return 'GB'
  if (deg < 292.5) return 'B'
  return 'KB'
}
