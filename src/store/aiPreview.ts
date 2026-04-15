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
 * Store'da `set({ ...applyPreviewToState(preview, get()), aiPreview: null })`
 * şeklinde kullanılır. Null döndürürse (geçersiz önizleme) aksiyon atılır.
 */
export function applyPreviewToState(
  preview: AIPreview,
  current: { rooms: Room[]; furniture: FurnitureItem[] }
): { rooms: Room[]; furniture: FurnitureItem[] } | null {
  const variant = preview.variants[preview.selectedIndex]
  if (!variant) return null

  if (preview.applyMode === 'replace') {
    return {
      rooms: variant.rooms ?? [],
      furniture: variant.furniture ?? [],
    }
  }

  if (preview.applyMode === 'merge') {
    return {
      rooms: [...current.rooms, ...(variant.rooms ?? [])],
      furniture: [...current.furniture, ...(variant.furniture ?? [])],
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
