/**
 * Scene transforms — oda + bağlı mobilyaları birlikte döndüren/taşıyan saf yardımcılar.
 *
 * "Hibrit grup" davranışı: bir oda döndüğünde / taşındığında, o odaya pin'lenmiş
 * (parentRoomId eşleşen) mobilyalar da aynı dönüşümü görmelidir. Eskiden bu
 * mantık designStore içinde gömülüydü; saf fonksiyon olarak ayrıldı.
 */

import type { Room, FurnitureItem } from '../types'

/**
 * Bir odanın etrafında bağlı mobilyaları döndürür.
 * - Oda pozisyonunu merkez alır, mobilyayı o merkez etrafında rotate eder
 * - Mobilyanın kendi rotation'ına da dRot ekler (yönü korur)
 *
 * Kullanımı: `rotateRoomWithFurniture` aksiyonunda yeni `furniture` listesi üretmek.
 */
export function rotateFurnitureAroundRoom(
  room: Room,
  furniture: FurnitureItem[],
  dRot: number,
): FurnitureItem[] {
  const [cx, cz] = room.position
  const cosR = Math.cos(dRot)
  const sinR = Math.sin(dRot)

  return furniture.map(f => {
    if (f.parentRoomId !== room.id) return f
    const dx0 = f.position[0] - cx
    const dz0 = f.position[1] - cz
    const newX = cx + dx0 * cosR - dz0 * sinR
    const newZ = cz + dx0 * sinR + dz0 * cosR
    return { ...f, position: [newX, newZ] as [number, number], rotation: f.rotation + dRot }
  })
}

/**
 * Bir odaya pin'lenmiş mobilyaları odayla birlikte kaydırır.
 * Oda taşınırken çocuk mobilyaların göreli pozisyonları korunur.
 */
export function translateFurnitureWithRoom(
  roomId: string,
  furniture: FurnitureItem[],
  dx: number,
  dz: number,
): FurnitureItem[] {
  return furniture.map(f =>
    f.parentRoomId === roomId
      ? { ...f, position: [f.position[0] + dx, f.position[1] + dz] as [number, number] }
      : f
  )
}
