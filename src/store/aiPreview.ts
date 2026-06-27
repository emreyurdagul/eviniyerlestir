/**
 * AI Preview — tip tanımları + önizlemeyi sahne state'ine uygulayan saf yardımcı.
 *
 * designStore'dan çıkarıldı — `applyAiPreview` aksiyonu eskiden 30 satırlık
 * üç modlu (replace / merge / style) bir switch-if zinciriydi; burada saf
 * fonksiyon olarak yaşıyor ve store sadece `set(applyPreviewToState(...))`
 * çağırıyor. Bu sayede tek sorumluluk ayrıştırılmış oldu ve birim testi
 * yazmak kolaylaştı.
 */

import type { Room, FurnitureItem, FloorType } from '../types'

export type AIPreviewType = 'placement' | 'plan' | 'style' | 'blueprint' | 'suggestion' | 'photo'

export interface AIVariant {
  label: string
  description?: string
  rooms?: Room[]
  furniture?: FurnitureItem[]
  // For style: only color updates
  styleUpdates?: Array<{
    roomId: string
    wallColor?: string
    wallColorOuter?: string
    floorType?: FloorType
  }>
}

export interface AIPreview {
  type: AIPreviewType
  variants: AIVariant[]
  selectedIndex: number
  // 'replace' = importLayout, 'merge' = add/update existing
  applyMode: 'replace' | 'merge' | 'style'
}

/**
 * Önizlemeyi mevcut sahne state'ine uygular ve yeni (rooms, furniture) döndürür.
 *
 * - `replace`: odaları/mobilyaları varyanttakilerle tamamen değiştirir
 * - `merge`: varyanttakileri mevcutlara ekler
 * - `style`: sadece oda stil (duvar rengi / zemin) güncellemelerini uygular
 *
 * #6 Multi-floor: AI önizlemelerindeki yeni oda/mobilya `activeFloorId`'e
 * bağlanır (replace modu tüm sahneyi değiştirir, varsayılan kata düşer).
 */
export function applyPreviewToState(
  preview: AIPreview,
  current: { rooms: Room[]; furniture: FurnitureItem[] },
  activeFloorId?: string
): { rooms: Room[]; furniture: FurnitureItem[] } | null {
  const variant = preview.variants[preview.selectedIndex]
  if (!variant) return null

  // Yardımcı: AI'dan gelen item floorId taşımıyorsa aktif kata bağla
  const bindFloor = <T extends { floorId?: string }>(item: T): T =>
    item.floorId ? item : (activeFloorId ? { ...item, floorId: activeFloorId } : item)

  if (preview.applyMode === 'replace') {
    // 1.2: Yalnız AKTİF katı değiştir; diğer katların oda/mobilyasını KORU.
    // (activeFloorId yoksa — tek kat senaryosu — eski davranış: tam değişim.)
    // Not: mobilyanın floorId taşıdığı varsayılır; bağımsız mobilya oluşturulduğu kata bağlanır.
    const isOtherFloor = (item: { floorId?: string }) =>
      (item.floorId ?? activeFloorId) !== activeFloorId
    return {
      rooms: [...current.rooms.filter(isOtherFloor), ...(variant.rooms ?? []).map(bindFloor)],
      furniture: [...current.furniture.filter(isOtherFloor), ...(variant.furniture ?? []).map(bindFloor)],
    }
  }

  if (preview.applyMode === 'merge') {
    return {
      rooms: [...current.rooms, ...(variant.rooms ?? []).map(bindFloor)],
      furniture: [...current.furniture, ...(variant.furniture ?? []).map(bindFloor)],
    }
  }

  // style: sadece oda güncellemeleri, mobilya aynı kalır
  const updates = variant.styleUpdates ?? []
  return {
    rooms: current.rooms.map(r => {
      const u = updates.find(u => u.roomId === r.id)
      if (!u) return r
      return {
        ...r,
        ...(u.wallColor && { wallColor: u.wallColor }),
        ...(u.wallColorOuter && { wallColorOuter: u.wallColorOuter }),
        ...(u.floorType && { floorType: u.floorType }),
      }
    }),
    furniture: current.furniture,
  }
}
