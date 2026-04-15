/**
 * compass.ts birim testleri.
 */

import { describe, it, expect } from 'vitest'
import { wallWorldNormal, toCardinal } from '../compass'

describe('wallWorldNormal', () => {
  it('rotasyon=0 iken yerel normaller dünya normalleriyle eşleşir', () => {
    expect(wallWorldNormal('left',  0)).toEqual([-1, 0])
    expect(wallWorldNormal('right', 0)).toEqual([ 1, 0])
    expect(wallWorldNormal('back',  0)).toEqual([ 0, -1])
    expect(wallWorldNormal('front', 0)).toEqual([ 0,  1])
  })

  it('rotasyon=π/2 iken 90° döndürür', () => {
    const [x, z] = wallWorldNormal('right', Math.PI / 2)
    expect(x).toBeCloseTo(0, 5)
    expect(z).toBeCloseTo(1, 5)
  })

  it('rotasyon=π iken yön tersine döner', () => {
    const [x, z] = wallWorldNormal('right', Math.PI)
    expect(x).toBeCloseTo(-1, 5)
    expect(z).toBeCloseTo(0, 5)
  })
})

describe('toCardinal', () => {
  it('dünya yönlerini doğru kardinale çevirir (compass=0)', () => {
    expect(toCardinal(0, -1, 0)).toBe('K')  // +kuzey
    expect(toCardinal(1,  0, 0)).toBe('D')  // +doğu
    expect(toCardinal(0,  1, 0)).toBe('G')  // +güney
    expect(toCardinal(-1, 0, 0)).toBe('B')  // +batı
  })

  it('ara yönler doğru adlandırılır', () => {
    const v = 1 / Math.sqrt(2)
    expect(toCardinal( v, -v, 0)).toBe('KD')
    expect(toCardinal( v,  v, 0)).toBe('GD')
    expect(toCardinal(-v,  v, 0)).toBe('GB')
    expect(toCardinal(-v, -v, 0)).toBe('KB')
  })

  it('compassAngle sahneyi döndürür (π/2 → K artık D gibi algılanır)', () => {
    // Kuzey vektörü (0,-1) sahne π/2 döndüğünde "batı" olur
    expect(toCardinal(0, -1, Math.PI / 2)).toBe('B')
  })
})
