/**
 * sun.ts birim testleri.
 *
 * Kapsam: Basitleştirilmiş güneş pozisyonu (saat/ay), ambient ışık profili.
 * Gerçek astronomik doğruluk değil, görsel tutarlılık ve sınır davranışı.
 */

import { describe, it, expect } from 'vitest'
import { computeSunPosition, ambientForHour } from '../sun'

describe('computeSunPosition', () => {
  it('öğle (12:00) güneşi yüksekte (y > 0)', () => {
    const sun = computeSunPosition(12, 6, 0)
    expect(sun.position[1]).toBeGreaterThan(0)
    expect(sun.intensity).toBeGreaterThan(0)
  })

  it('gece (02:00) intensity 0.05 (düşük)', () => {
    const sun = computeSunPosition(2, 6, 0)
    expect(sun.intensity).toBe(0.05)
  })

  it('gece (22:00) intensity 0.05', () => {
    const sun = computeSunPosition(22, 6, 0)
    expect(sun.intensity).toBe(0.05)
  })

  it('sabah (06:00) pozisyon x ekseninde negatife doğru kaymış', () => {
    const sun = computeSunPosition(6, 6, 0)
    // hourAngle = -π/2; azimuth = π - π/2 = π/2 → sin(π/2)=1 → x pozitif
    // Ama compass=0 referanslı: x = sin(azimuth) * horizontalRadius
    expect(Math.abs(sun.position[0])).toBeGreaterThan(0)
  })

  it('öğle güneşi renk beyaza (0xfffdf5) yakın', () => {
    const sun = computeSunPosition(12, 6, 0)
    expect(sun.color).toBe(0xfffdf5)
  })

  it('gün doğumu/batımı renk amber (0xffaa66)', () => {
    const sunrise = computeSunPosition(6, 6, 0)
    const sunset = computeSunPosition(19, 6, 0)
    expect(sunrise.color).toBe(0xffaa66)
    expect(sunset.color).toBe(0xffaa66)
  })

  it('sabahın erken saatleri (07:30 gibi) soft amber (0xffd0a0)', () => {
    const sun = computeSunPosition(7.5, 6, 0)
    expect(sun.color).toBe(0xffd0a0)
  })

  it('compass rotation pozisyonu döndürür', () => {
    const base = computeSunPosition(12, 6, 0)
    const rotated = computeSunPosition(12, 6, Math.PI / 2)
    // Rotasyon sonrası x-z yer değiştirir; toplam yatay mesafe sabit
    const rBase = Math.hypot(base.position[0], base.position[2])
    const rRot = Math.hypot(rotated.position[0], rotated.position[2])
    expect(rRot).toBeCloseTo(rBase, 3)
    // y (yükseklik) değişmez
    expect(rotated.position[1]).toBeCloseTo(base.position[1], 3)
  })

  it('distance parametresi mesafeyi ölçekler', () => {
    const near = computeSunPosition(12, 6, 0, 10)
    const far = computeSunPosition(12, 6, 0, 20)
    const nearMag = Math.hypot(near.position[0], near.position[1], near.position[2])
    const farMag = Math.hypot(far.position[0], far.position[1], far.position[2])
    expect(farMag).toBeCloseTo(nearMag * 2, 2)
  })

  it('pozisyon sonlu sayılar döndürür (NaN/Infinity yok)', () => {
    for (const h of [0, 3, 6, 9, 12, 15, 18, 21, 24]) {
      for (const m of [1, 3, 6, 9, 12]) {
        const sun = computeSunPosition(h, m, 0)
        expect(Number.isFinite(sun.position[0])).toBe(true)
        expect(Number.isFinite(sun.position[1])).toBe(true)
        expect(Number.isFinite(sun.position[2])).toBe(true)
        expect(Number.isFinite(sun.intensity)).toBe(true)
      }
    }
  })

  it('intensity negatife düşmez', () => {
    for (const h of [0, 6, 12, 18, 23]) {
      const sun = computeSunPosition(h, 6, 0)
      expect(sun.intensity).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('ambientForHour', () => {
  it('gece (03:00) düşük intensity + mavi ton', () => {
    const a = ambientForHour(3)
    expect(a.intensity).toBe(0.15)
    expect(a.color).toBe(0x4a5070)
  })

  it('gece (22:00) düşük intensity', () => {
    const a = ambientForHour(22)
    expect(a.intensity).toBe(0.15)
  })

  it('alacakaranlık (07:00) orta intensity + amber', () => {
    const a = ambientForHour(7)
    expect(a.intensity).toBe(0.4)
    expect(a.color).toBe(0xffd0a0)
  })

  it('öğle (12:00) yüksek intensity + sıcak beyaz', () => {
    const a = ambientForHour(12)
    expect(a.intensity).toBe(0.7)
    expect(a.color).toBe(0xfff8ee)
  })

  it('sınır saatleri doğru kategoriye düşer', () => {
    // hour < 6 gece, hour > 20 gece
    expect(ambientForHour(5.99).intensity).toBe(0.15)
    expect(ambientForHour(20.1).intensity).toBe(0.15)
    // 6 gece değil, alacakaranlık aralığı hour < 8 || hour > 18
    expect(ambientForHour(6).intensity).toBe(0.4)
    expect(ambientForHour(19).intensity).toBe(0.4)
    // 8 gündüz başlangıç
    expect(ambientForHour(8).intensity).toBe(0.7)
    expect(ambientForHour(18).intensity).toBe(0.7)
  })
})
