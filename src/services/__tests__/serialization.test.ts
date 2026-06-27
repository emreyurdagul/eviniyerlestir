/**
 * serialization.ts round-trip + doğrulama testleri.
 *
 * Kapsam (Faz 1 düzeltmeleri):
 *   - 1.1 allow-list: export → validateAndParse round-trip'inde opsiyonel
 *     alanlar korunur (mobilya variant/lighting/custom-model, oda wallColors,
 *     kat ceiling/attic/roof). Eskiden sanitize* bu alanları siliyordu.
 *   - 1.4 boş/bozuk dosya hata fırlatır (sessiz silme + yanlış "başarılı" yok).
 *   - 1.7 import'ta pozisyon ±500 kırpılır, NaN → 0.
 *   - BUG-005 kat ceilingHeight [2.0,4.0] aralığına kırpılır.
 */

import { describe, it, expect } from 'vitest'
import { exportToJSON, validateAndParse } from '../serialization'
import type { LayoutData } from '../../types'

const room = {
  id: 'r1', type: 'salon', widthCm: 400, lengthCm: 500,
  position: [1, 2], rotation: 0, color: 0x4488ff,
  wallColor: '#e3ddd4', wallColorOuter: '#c8c0b4', floorType: 'parke',
  openings: [], removedWalls: [],
  wallColors: { left: { inner: '#ff0000', outer: '#00ff00' }, '2': { inner: '#123456' } },
  floorId: 'floor-1',
}
const furn = {
  id: 'f1', type: 'sofa', dims: { width: 200, depth: 90, height: 80 },
  position: [0.5, -0.5], rotation: 1.2, color: 0xffcc44, parentRoomId: 'r1',
  variant: 'modern', customModelUrl: 'blob:abc', customLabel: 'Benim kanepe',
  lumens: 800, colorTempK: 3000, lightOn: true, floorId: 'floor-1',
}
const floor = { id: 'floor-1', label: 'Zemin', order: 0, baseY: 0, ceilingHeight: 2.8, isAttic: false, roofType: 'gable' }
const data = { version: 1, rooms: [room], furniture: [furn], floors: [floor] } as unknown as LayoutData

describe('serialization round-trip (Faz 1.1)', () => {
  it('mobilya opsiyonel alanlarını korur (variant/lighting/custom-model)', () => {
    const f = validateAndParse(exportToJSON(data)).furniture[0]
    expect(f.variant).toBe('modern')
    expect(f.customModelUrl).toBe('blob:abc')
    expect(f.customLabel).toBe('Benim kanepe')
    expect(f.lumens).toBe(800)
    expect(f.colorTempK).toBe(3000)
    expect(f.lightOn).toBe(true)
  })

  it('oda wallColors ve kat ceiling/attic/roof korur', () => {
    const out = validateAndParse(exportToJSON(data))
    expect(out.rooms[0].wallColors).toEqual({
      left: { inner: '#ff0000', outer: '#00ff00' }, '2': { inner: '#123456' },
    })
    const fl = out.floors?.[0]
    expect(fl?.ceilingHeight).toBe(2.8)
    expect(fl?.isAttic).toBe(false)
    expect(fl?.roofType).toBe('gable')
  })
})

describe('serialization doğrulama', () => {
  it('ceilingHeight aralık dışı değeri [2,4] kırpar (BUG-005)', () => {
    const bad = { ...data, floors: [{ ...floor, ceilingHeight: 10 }] } as unknown as LayoutData
    expect(validateAndParse(exportToJSON(bad)).floors?.[0].ceilingHeight).toBe(4)
  })

  it('uçuk pozisyonu ±500 kırpar, NaN → 0 (1.7)', () => {
    const bad = { ...data, rooms: [{ ...room, position: [99999, NaN] }] } as unknown as LayoutData
    const p = validateAndParse(exportToJSON(bad)).rooms[0].position
    expect(p[0]).toBe(500)
    expect(p[1]).toBe(0)
  })

  it('geçersiz wallColors anahtarı atılır, geçerli kalır', () => {
    const bad = { ...data, rooms: [{ ...room, wallColors: { left: { inner: 'NOT-HEX' }, right: { outer: '#abcdef' } } }] } as unknown as LayoutData
    expect(validateAndParse(exportToJSON(bad)).rooms[0].wallColors).toEqual({ right: { outer: '#abcdef' } })
  })

  it('boş / tümü-geçersiz layout hata fırlatır (1.4)', () => {
    expect(() => validateAndParse(JSON.stringify({ version: 1, rooms: [], furniture: [] }))).toThrow()
  })
})
