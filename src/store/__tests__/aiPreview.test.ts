/**
 * aiPreview.ts birim testleri.
 *
 * Kapsam: applyPreviewToState'in üç modunu (replace / merge / style) doğrular.
 * Geçersiz input (boş variants dizisi veya selectedIndex taşması) null döner.
 */

import { describe, it, expect } from 'vitest'
import type { Room, FurnitureItem } from '../../types'
import { applyPreviewToState, type AIPreview } from '../aiPreview'

// ─────────────────────────────────────────────────────────────────

function makeRoom(id: string, overrides: Partial<Room> = {}): Room {
  return {
    id,
    type: 'salon',
    widthCm: 400,
    lengthCm: 500,
    position: [0, 0],
    rotation: 0,
    color: 0xffffff,
    wallColor: '#e3ddd4',
    wallColorOuter: '#c8c0b4',
    floorType: 'parke',
    openings: [],
    removedWalls: [],
    ...overrides,
  }
}

function makeFurn(id: string, overrides: Partial<FurnitureItem> = {}): FurnitureItem {
  return {
    id,
    type: 'sofa',
    dims: { length: 200, width: 85 },
    position: [0, 0],
    rotation: 0,
    color: 0x888888,
    parentRoomId: null,
    ...overrides,
  }
}

// ─────────────────────────────────────────────────────────────────
//  replace mode
// ─────────────────────────────────────────────────────────────────

describe('applyPreviewToState — replace', () => {
  it('mevcut rooms/furniture\'ı tamamen değiştirir', () => {
    const preview: AIPreview = {
      type: 'plan',
      applyMode: 'replace',
      selectedIndex: 0,
      variants: [{
        label: 'Yeni plan',
        rooms: [makeRoom('new-r1')],
        furniture: [makeFurn('new-f1')],
      }],
    }
    const current = {
      rooms: [makeRoom('old-r1')],
      furniture: [makeFurn('old-f1')],
    }
    const result = applyPreviewToState(preview, current)

    expect(result).not.toBeNull()
    expect(result!.rooms.map(r => r.id)).toEqual(['new-r1'])
    expect(result!.furniture.map(f => f.id)).toEqual(['new-f1'])
  })

  it('varyantta rooms/furniture yoksa boş dizi döner', () => {
    const preview: AIPreview = {
      type: 'plan',
      applyMode: 'replace',
      selectedIndex: 0,
      variants: [{ label: 'Boş' }],
    }
    const result = applyPreviewToState(preview, {
      rooms: [makeRoom('old')],
      furniture: [makeFurn('old')],
    })

    expect(result!.rooms).toEqual([])
    expect(result!.furniture).toEqual([])
  })
})

// ─────────────────────────────────────────────────────────────────
//  merge mode
// ─────────────────────────────────────────────────────────────────

describe('applyPreviewToState — merge', () => {
  it('mevcutlara varyanttakileri ekler', () => {
    const preview: AIPreview = {
      type: 'placement',
      applyMode: 'merge',
      selectedIndex: 0,
      variants: [{
        label: 'Ekle',
        furniture: [makeFurn('new-f1'), makeFurn('new-f2')],
      }],
    }
    const current = {
      rooms: [makeRoom('r1')],
      furniture: [makeFurn('old-f1')],
    }
    const result = applyPreviewToState(preview, current)

    expect(result!.rooms.map(r => r.id)).toEqual(['r1'])
    expect(result!.furniture.map(f => f.id)).toEqual(['old-f1', 'new-f1', 'new-f2'])
  })

  it('varyantta array yoksa boş eklenmiş gibi davranır', () => {
    const preview: AIPreview = {
      type: 'placement',
      applyMode: 'merge',
      selectedIndex: 0,
      variants: [{ label: 'Boş ekleme' }],
    }
    const current = { rooms: [makeRoom('r1')], furniture: [makeFurn('f1')] }
    const result = applyPreviewToState(preview, current)

    expect(result!.rooms).toHaveLength(1)
    expect(result!.furniture).toHaveLength(1)
  })
})

// ─────────────────────────────────────────────────────────────────
//  style mode
// ─────────────────────────────────────────────────────────────────

describe('applyPreviewToState — style', () => {
  it('sadece eşleşen roomId\'lerin stilini günceller', () => {
    const preview: AIPreview = {
      type: 'style',
      applyMode: 'style',
      selectedIndex: 0,
      variants: [{
        label: 'Minimalist',
        styleUpdates: [
          { roomId: 'r1', wallColor: '#ffffff', floorType: 'mermer' },
        ],
      }],
    }
    const current = {
      rooms: [makeRoom('r1'), makeRoom('r2')],
      furniture: [makeFurn('f1')],
    }
    const result = applyPreviewToState(preview, current)

    expect(result!.rooms[0].wallColor).toBe('#ffffff')
    expect(result!.rooms[0].floorType).toBe('mermer')
    // r2 güncellenmedi
    expect(result!.rooms[1].wallColor).toBe('#e3ddd4')
    expect(result!.rooms[1].floorType).toBe('parke')
  })

  it('mobilyaya dokunmaz (aynı referans)', () => {
    const f1 = makeFurn('f1')
    const preview: AIPreview = {
      type: 'style',
      applyMode: 'style',
      selectedIndex: 0,
      variants: [{ label: 'x', styleUpdates: [{ roomId: 'r1', wallColor: '#fff' }] }],
    }
    const current = { rooms: [makeRoom('r1')], furniture: [f1] }
    const result = applyPreviewToState(preview, current)

    expect(result!.furniture).toBe(current.furniture)
  })

  it('styleUpdates boşsa odalara dokunmaz', () => {
    const preview: AIPreview = {
      type: 'style',
      applyMode: 'style',
      selectedIndex: 0,
      variants: [{ label: 'hiçbir şey' }],
    }
    const result = applyPreviewToState(preview, {
      rooms: [makeRoom('r1', { wallColor: '#abcdef' })],
      furniture: [],
    })
    expect(result!.rooms[0].wallColor).toBe('#abcdef')
  })

  it('tanımsız alanlar (wallColor/floorType) orijinali korur', () => {
    const preview: AIPreview = {
      type: 'style',
      applyMode: 'style',
      selectedIndex: 0,
      variants: [{
        label: 'sadece duvar',
        styleUpdates: [{ roomId: 'r1', wallColor: '#123456' }],
      }],
    }
    const orig = makeRoom('r1', { wallColor: '#000', floorType: 'fayans', wallColorOuter: '#outer' })
    const result = applyPreviewToState(preview, { rooms: [orig], furniture: [] })

    expect(result!.rooms[0].wallColor).toBe('#123456')
    expect(result!.rooms[0].floorType).toBe('fayans')      // korundu
    expect(result!.rooms[0].wallColorOuter).toBe('#outer') // korundu
  })
})

// ─────────────────────────────────────────────────────────────────
//  edge cases
// ─────────────────────────────────────────────────────────────────

describe('applyPreviewToState — edge cases', () => {
  it('selectedIndex varyant sayısını aşarsa null döner', () => {
    const preview: AIPreview = {
      type: 'plan',
      applyMode: 'replace',
      selectedIndex: 5,
      variants: [{ label: 'tek', rooms: [] }],
    }
    expect(applyPreviewToState(preview, { rooms: [], furniture: [] })).toBeNull()
  })

  it('variants boşsa null döner', () => {
    const preview: AIPreview = {
      type: 'plan',
      applyMode: 'replace',
      selectedIndex: 0,
      variants: [],
    }
    expect(applyPreviewToState(preview, { rooms: [], furniture: [] })).toBeNull()
  })
})
