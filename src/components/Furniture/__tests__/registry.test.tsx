/**
 * Sınır kutusu ↔ 3D model tutarlılığı.
 *
 * Her katalog tipini ve varyantını varsayılan, en küçük ve en büyük
 * boyutlarında render edip three.js ile ölçer. getBoundingBox kutusu modeli
 * kapsamalı (çakışma kontrolü ve seçim kutusu buna güvenir) ve modelden
 * gereksiz büyük olmamalı (yoksa olmayan çakışmalar bulunur, snap duvardan
 * boşluk bırakır).
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import * as THREE from 'three'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { FURNITURE_CATALOG } from '../../../types'
import { getBoundingBox } from '../registry'

const models = import.meta.glob('../models/*.tsx', { eager: true }) as Record<string, { default: React.ComponentType<Record<string, unknown>> }>

// FurnitureItem'daki 'tip' / 'tip:varyant' → model dosyası eşlemesi
const keyToFile = new Map<string, string>()
const itemSrc = readFileSync('src/components/Furniture/FurnitureItem.tsx', 'utf8')
for (const m of itemSrc.matchAll(/'([a-z0-9-]+(?::[a-z0-9-]+)?)':\s*lazy\(\(\) => import\('\.\/models\/(\w+)'\)\)/g)) {
  keyToFile.set(m[1], m[2])
}

/** Kutu modelden en fazla bu kadar (m, yarı genişlik) büyük olabilir. */
const MAX_SLACK = 0.05
/** Ölçüm gürültüsü. */
const EPS = 0.005
/** Kutunun kasıtlı olarak modelden küçük tutulduğu ayak izleri. */
const FOOTPRINT_EXCEPTIONS = new Set(['floorlamp:arc']) // yalnız taban; kol 1.6 m üstte

async function measure(Comp: React.ComponentType<Record<string, unknown>>, dims: Record<string, number>, variant?: string) {
  const r = await ReactThreeTestRenderer.create(<group><Comp dims={dims} variant={variant} lightOn /></group>)
  const box = new THREE.Box3().setFromObject(r.scene.instance)
  await r.unmount()
  return {
    hx: Math.max(-box.min.x, box.max.x),
    hz: Math.max(-box.min.z, box.max.z),
    top: box.max.y,
  }
}

describe('getBoundingBox 3D modeli doğru sarar', () => {
  for (const cat of FURNITURE_CATALOG) {
    const variants: (string | undefined)[] = [undefined, ...(cat.variants ?? []).map(v => v.id)]
    for (const variant of variants) {
      const label = variant ? `${cat.type}:${variant}` : cat.type
      it(label, async () => {
        const key = variant && keyToFile.has(label) ? label : cat.type
        const Comp = models[`../models/${keyToFile.get(key)}.tsx`]?.default
        expect(Comp, `${key} için model dosyası`).toBeDefined()

        const base: Record<string, number> = {}
        for (const d of cat.dimDefs) base[d.key] = d.def
        const samples = [base, ...cat.dimDefs.flatMap(d => [{ ...base, [d.key]: d.min }, { ...base, [d.key]: d.max }])]

        for (const dims of samples) {
          const m = await measure(Comp!, dims, variant)
          const bb = getBoundingBox(cat.type, dims, variant)
          const at = `${label} ${JSON.stringify(dims)}`
          expect(m.top, `${at} yükseklik`).toBeLessThanOrEqual(bb.h + EPS)
          if (FOOTPRINT_EXCEPTIONS.has(label)) continue
          expect(m.hx, `${at} genişlik modeli kapsamıyor`).toBeLessThanOrEqual(bb.w / 2 + EPS)
          expect(m.hz, `${at} derinlik modeli kapsamıyor`).toBeLessThanOrEqual(bb.d / 2 + EPS)
          expect(bb.w / 2 - m.hx, `${at} genişlik gereksiz büyük`).toBeLessThanOrEqual(MAX_SLACK)
          expect(bb.d / 2 - m.hz, `${at} derinlik gereksiz büyük`).toBeLessThanOrEqual(MAX_SLACK)
        }
      })
    }
  }
})
