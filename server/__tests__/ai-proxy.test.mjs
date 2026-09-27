import { describe, expect, it } from 'vitest'
import { costOf, createLimiter, MAX_TOKENS_CAP, ProxyError, sanitizeRequest } from '../ai-proxy.mjs'

const msg = [{ role: 'user', content: 'merhaba' }]

describe('sanitizeRequest', () => {
  it('yalnızca izinli alanları geçirir ve max_tokens tavanını uygular', () => {
    const out = sanitizeRequest({
      model: 'claude-sonnet-4-6', max_tokens: 999_999, messages: msg,
      system: 'sys', temperature: 0.2, tools: [{ name: 'x' }], metadata: { user_id: 'a' },
    })
    expect(out).toEqual({ model: 'claude-sonnet-4-6', max_tokens: MAX_TOKENS_CAP, messages: msg, system: 'sys', temperature: 0.2 })
  })

  it('izinsiz modeli reddeder', () => {
    expect(() => sanitizeRequest({ model: 'claude-opus-4', max_tokens: 10, messages: msg })).toThrow(ProxyError)
  })

  it('boş mesaj listesini ve bozuk gövdeyi reddeder', () => {
    expect(() => sanitizeRequest({ model: 'claude-sonnet-4-6', messages: [] })).toThrow(ProxyError)
    expect(() => sanitizeRequest(null)).toThrow(ProxyError)
    expect(() => sanitizeRequest([])).toThrow(ProxyError)
  })
})

describe('createLimiter', () => {
  it('IP başı saatlik sınırı uygular ve saat geçince sıfırlar', () => {
    let t = Date.UTC(2026, 8, 27, 10)
    const lim = createLimiter({ perHour: 2, dailyBudgetUsd: 100, now: () => t })
    lim.admit('1.1.1.1')
    lim.admit('1.1.1.1')
    expect(() => lim.admit('1.1.1.1')).toThrow(/Saatlik/)
    lim.admit('2.2.2.2') // başka IP etkilenmez
    t += 3_600_001
    expect(() => lim.admit('1.1.1.1')).not.toThrow()
  })

  it('günlük bütçe dolunca herkesi durdurur, ertesi gün açar', () => {
    let t = Date.UTC(2026, 8, 27, 23)
    const lim = createLimiter({ perHour: 100, dailyBudgetUsd: 0.05, now: () => t })
    lim.admit('a')
    lim.record({ input_tokens: 10_000, output_tokens: 2_000 }) // 0.03 + 0.03 = 0.06$
    expect(() => lim.admit('b')).toThrow(/Günlük/)
    t += 3_600_000 // UTC ertesi gün
    expect(() => lim.admit('b')).not.toThrow()
  })
})

describe('costOf', () => {
  it('Sonnet fiyatıyla hesaplar', () => {
    expect(costOf({ input_tokens: 1_000_000, output_tokens: 1_000_000 })).toBeCloseTo(18)
    expect(costOf(undefined)).toBe(0)
  })
})
