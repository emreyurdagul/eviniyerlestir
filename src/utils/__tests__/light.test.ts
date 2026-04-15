/**
 * light.ts birim testleri.
 *
 * Kapsam: Kelvin/lümen dönüşümleri, UI etiketleri ve lux tahmini.
 * Fiziksel doğruluk değil, görsel tutarlılık kontrol edilir.
 */

import { describe, it, expect } from 'vitest'
import {
  kelvinToHex,
  kelvinToCss,
  kelvinLabel,
  lumensToLedWatts,
  lumensToIntensity,
  estimateLux,
  RECOMMENDED_LUX,
} from '../light'

describe('kelvinToHex', () => {
  it('2700 K sıcak sarı-turuncu ton üretir (R > B)', () => {
    const hex = kelvinToHex(2700)
    const r = (hex >> 16) & 0xff
    const b = hex & 0xff
    expect(r).toBeGreaterThan(b)           // sıcak → kırmızı ağırlıklı
    expect(r).toBe(255)                    // T<=66 → r=255
  })

  it('6500 K nötr-hafif mavimsi beyaz üretir (B >= R)', () => {
    const hex = kelvinToHex(6500)
    const r = (hex >> 16) & 0xff
    const b = hex & 0xff
    expect(b).toBeGreaterThanOrEqual(r - 10)  // beyaza yakın veya mavi eğilimli
  })

  it('alt sınırı (1000 K) clamp eder, çökmez', () => {
    expect(() => kelvinToHex(500)).not.toThrow()
    expect(kelvinToHex(500)).toBe(kelvinToHex(1000))
  })

  it('üst sınırı (40000 K) clamp eder', () => {
    expect(() => kelvinToHex(99999)).not.toThrow()
    expect(kelvinToHex(99999)).toBe(kelvinToHex(40000))
  })

  it('tüm kanallar 0-255 aralığında kalır', () => {
    for (const K of [1000, 2000, 2700, 3000, 4000, 5000, 6500, 10000]) {
      const hex = kelvinToHex(K)
      const r = (hex >> 16) & 0xff
      const g = (hex >> 8) & 0xff
      const b = hex & 0xff
      expect(r).toBeGreaterThanOrEqual(0)
      expect(r).toBeLessThanOrEqual(255)
      expect(g).toBeGreaterThanOrEqual(0)
      expect(g).toBeLessThanOrEqual(255)
      expect(b).toBeGreaterThanOrEqual(0)
      expect(b).toBeLessThanOrEqual(255)
    }
  })
})

describe('kelvinToCss', () => {
  it("'#rrggbb' formatında 7 karakter döndürür", () => {
    const css = kelvinToCss(3000)
    expect(css).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('kısa hex değerlerini 6 haneye pad eder', () => {
    // 1000 K gibi düşük değerlerde b=0, g düşük → baştaki 0'lar pad edilmeli
    const css = kelvinToCss(1000)
    expect(css.length).toBe(7)
  })
})

describe('kelvinLabel', () => {
  it('2700 K → "Çok Sıcak"', () => {
    expect(kelvinLabel(2700)).toBe('Çok Sıcak')
  })

  it('3000 K → "Sıcak Beyaz"', () => {
    expect(kelvinLabel(3000)).toBe('Sıcak Beyaz')
  })

  it('4000 K → "Nötr Beyaz"', () => {
    expect(kelvinLabel(4000)).toBe('Nötr Beyaz')
  })

  it('5000 K → "Soğuk Beyaz"', () => {
    expect(kelvinLabel(5000)).toBe('Soğuk Beyaz')
  })

  it('6500 K → "Gün Işığı"', () => {
    expect(kelvinLabel(6500)).toBe('Gün Işığı')
  })

  it('sınır değerlerinde doğru tarafa düşer', () => {
    expect(kelvinLabel(2799)).toBe('Çok Sıcak')
    expect(kelvinLabel(2800)).toBe('Sıcak Beyaz')
    expect(kelvinLabel(3299)).toBe('Sıcak Beyaz')
    expect(kelvinLabel(3300)).toBe('Nötr Beyaz')
    expect(kelvinLabel(4199)).toBe('Nötr Beyaz')
    expect(kelvinLabel(4200)).toBe('Soğuk Beyaz')
    expect(kelvinLabel(5199)).toBe('Soğuk Beyaz')
    expect(kelvinLabel(5200)).toBe('Gün Işığı')
  })
})

describe('lumensToLedWatts', () => {
  it('800 lm → 10 W LED (60 W akkor eşdeğeri)', () => {
    expect(lumensToLedWatts(800)).toBe(10)
  })

  it('1600 lm → 20 W LED', () => {
    expect(lumensToLedWatts(1600)).toBe(20)
  })

  it('400 lm → 5 W LED', () => {
    expect(lumensToLedWatts(400)).toBe(5)
  })

  it('1 ondalık basamağa yuvarlar', () => {
    // 100 / 80 = 1.25 → 1.3 değil, 1.25 → toFixed(1) = 1.3? Math.round(1.25*10)/10 = 12.5 → 13 → 1.3
    expect(lumensToLedWatts(100)).toBe(1.3)
  })

  it('0 lm → 0 W', () => {
    expect(lumensToLedWatts(0)).toBe(0)
  })
})

describe('lumensToIntensity', () => {
  it('800 lm + modelScale=1 → 2.0 intensity', () => {
    expect(lumensToIntensity(800, 1)).toBe(2)
  })

  it('modelScale varsayılanı 1', () => {
    expect(lumensToIntensity(800)).toBe(2)
  })

  it('modelScale çarpanı uygulanır (2x → 4.0 intensity)', () => {
    expect(lumensToIntensity(800, 2)).toBe(4)
  })

  it('400 lm → 1.0 intensity', () => {
    expect(lumensToIntensity(400, 1)).toBe(1)
  })

  it('0 lm → 0 intensity', () => {
    expect(lumensToIntensity(0, 1)).toBe(0)
  })

  it('modelScale=0 → 0 (lambada ışık yok)', () => {
    expect(lumensToIntensity(1000, 0)).toBe(0)
  })
})

describe('estimateLux', () => {
  it('1000 lm / 10 m² → 100 lux', () => {
    expect(estimateLux(1000, 10)).toBe(100)
  })

  it('2000 lm / 10 m² → 200 lux', () => {
    expect(estimateLux(2000, 10)).toBe(200)
  })

  it('0 alan → 0 lux (div-by-zero koruması)', () => {
    expect(estimateLux(1000, 0)).toBe(0)
  })

  it('negatif alan → 0 lux', () => {
    expect(estimateLux(1000, -5)).toBe(0)
  })

  it('0 lümen → 0 lux', () => {
    expect(estimateLux(0, 20)).toBe(0)
  })

  it('ondalık alan doğru ölçeklenir', () => {
    expect(estimateLux(500, 2.5)).toBe(200)
  })
})

describe('RECOMMENDED_LUX', () => {
  it('tüm oda tipleri min < ideal < max koşulunu sağlar', () => {
    for (const [room, range] of Object.entries(RECOMMENDED_LUX)) {
      expect(range.min).toBeLessThan(range.ideal)
      expect(range.ideal).toBeLessThan(range.max)
      expect(range.min, `${room} min pozitif olmalı`).toBeGreaterThan(0)
    }
  })

  it('mutfak ve çalışma odası salon/yatak odasından daha aydınlık', () => {
    expect(RECOMMENDED_LUX.mutfak.ideal).toBeGreaterThan(RECOMMENDED_LUX.salon.ideal)
    expect(RECOMMENDED_LUX.calisma.ideal).toBeGreaterThan(RECOMMENDED_LUX.yatak.ideal)
  })

  it('beklenen oda tiplerini içerir', () => {
    const keys = Object.keys(RECOMMENDED_LUX)
    for (const room of ['salon', 'yatak', 'mutfak', 'banyo', 'koridor', 'calisma']) {
      expect(keys).toContain(room)
    }
  })
})
