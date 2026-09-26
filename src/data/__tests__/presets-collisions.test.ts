/**
 * Hazır şablonlarda fiziksel çakışma olmamalı: mobilya duvara/oda dışına
 * taşmaz, birbirinin içine girmez, kapı açılma alanını kapatmaz; odalar
 * üst üste binmez. Kontrol mantığı: utils/layoutCollisions.ts.
 */

import { describe, it, expect } from 'vitest'
import { PRESETS } from '../presets'
import { PRESETS_2PLUS1 } from '../presets-2plus1'
import { PRESETS_3PLUS1 } from '../presets-3plus1'
import { PRESETS_DUPLEX } from '../presets-duplex'
import { findLayoutCollisions } from '../../utils/layoutCollisions'

const ALL = [...PRESETS, ...PRESETS_2PLUS1, ...PRESETS_3PLUS1, ...PRESETS_DUPLEX]

describe('şablonlarda çakışma yok', () => {
  for (const p of ALL) {
    it(p.id, () => {
      expect(findLayoutCollisions(p.data).map(i => i.message)).toEqual([])
    })
  }
})
