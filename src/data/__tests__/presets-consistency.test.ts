/**
 * Preset/şablon ↔ katalog tutarlılık testi.
 *
 * Kalıcı guard: her preset'teki mobilya tipi katalogda olmalı, variant'ı
 * o tipin katalog variant'larından biri olmalı, oda tipi ROOM_TYPES'da
 * bulunmalı, ID'ler preset içinde benzersiz olmalı.
 */

import { describe, it, expect } from 'vitest'
import { FURNITURE_CATALOG, ROOM_TYPES } from '../../types'
import { PRESETS } from '../presets'
import { PRESETS_2PLUS1 } from '../presets-2plus1'
import { PRESETS_3PLUS1 } from '../presets-3plus1'
import { PRESETS_DUPLEX } from '../presets-duplex'

const ALL = [...PRESETS, ...PRESETS_2PLUS1, ...PRESETS_3PLUS1, ...PRESETS_DUPLEX]

const catTypes = new Set(FURNITURE_CATALOG.map(c => c.type))
const catVariants = new Map(
  FURNITURE_CATALOG.map(c => [c.type, new Set((c.variants ?? []).map(v => v.id))]),
)
const roomTypes = new Set(ROOM_TYPES.map(r => r.type))

describe('preset tutarlılığı', () => {
  it('en az bir preset var', () => {
    expect(ALL.length).toBeGreaterThan(0)
  })

  for (const p of ALL) {
    describe(`preset: ${p.id}`, () => {
      it('oda tipleri geçerli', () => {
        for (const r of p.data.rooms) expect(roomTypes, `oda ${r.id} tipi '${r.type}'`).toContain(r.type)
      })

      it('mobilya tipleri katalogda', () => {
        for (const f of p.data.furniture) expect(catTypes, `mobilya ${f.id} tipi '${f.type}'`).toContain(f.type)
      })

      it('mobilya variant\'ları katalogda', () => {
        for (const f of p.data.furniture) {
          if (!f.variant) continue
          const vs = catVariants.get(f.type)
          expect(vs, `tip ${f.type} variant tanımı`).toBeDefined()
          expect([...(vs ?? [])], `mobilya ${f.id} variant '${f.variant}' (tip ${f.type})`).toContain(f.variant)
        }
      })

      it('ID\'ler benzersiz', () => {
        const ids = [...p.data.rooms.map(r => r.id), ...p.data.furniture.map(f => f.id)]
        expect(new Set(ids).size, `preset ${p.id} yinelenen ID`).toBe(ids.length)
      })
    })
  }
})
