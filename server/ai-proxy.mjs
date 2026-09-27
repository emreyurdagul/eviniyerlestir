/**
 * Claude API proxy'sinin saf mantığı: istek temizleme, IP başı hız limiti,
 * günlük harcama tavanı. API anahtarı yalnızca sunucu ortamında durur
 * (ANTHROPIC_API_KEY); tarayıcı artık anahtar görmez.
 */

export const ALLOWED_MODELS = new Set(['claude-sonnet-4-6'])
export const MAX_TOKENS_CAP = 4096

// Sonnet 4.x fiyatı, USD / token (girdi $3/M, çıktı $15/M)
const PRICE_IN = 3 / 1_000_000
const PRICE_OUT = 15 / 1_000_000

export class ProxyError extends Error {
  constructor(status, type, message) {
    super(message)
    this.status = status
    this.type = type
  }
}

/** İstemciden gelen gövdeden yalnızca izin verilen alanları geçir. */
export function sanitizeRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ProxyError(400, 'invalid_request_error', 'Geçersiz istek gövdesi.')
  }
  if (!ALLOWED_MODELS.has(body.model)) {
    throw new ProxyError(400, 'invalid_request_error', 'Bu model kullanılamaz.')
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    throw new ProxyError(400, 'invalid_request_error', 'Mesaj listesi boş.')
  }
  const out = {
    model: body.model,
    max_tokens: Math.min(Number(body.max_tokens) || MAX_TOKENS_CAP, MAX_TOKENS_CAP),
    messages: body.messages,
  }
  if (typeof body.system === 'string' || Array.isArray(body.system)) out.system = body.system
  if (typeof body.temperature === 'number') out.temperature = body.temperature
  return out
}

export function costOf(usage) {
  if (!usage) return 0
  return (usage.input_tokens || 0) * PRICE_IN + (usage.output_tokens || 0) * PRICE_OUT
}

/**
 * Bellek içi limitler (tek konteyner için yeterli; yeniden başlatmada sıfırlanır).
 * now() enjekte edilebilir → testlerde saat kontrolü.
 */
export function createLimiter({ perHour, dailyBudgetUsd, now = () => Date.now() }) {
  const hits = new Map() // ip -> zaman damgaları (son 1 saat)
  let day = ''
  let spent = 0

  const today = () => new Date(now()).toISOString().slice(0, 10)
  const rollDay = () => {
    const d = today()
    if (d !== day) { day = d; spent = 0 }
  }

  return {
    /** İstek öncesi: limit aşıldıysa ProxyError fırlatır, değilse kaydeder. */
    admit(ip) {
      rollDay()
      if (spent >= dailyBudgetUsd) {
        throw new ProxyError(429, 'rate_limit_error',
          'Günlük AI kotası doldu, yarın tekrar deneyin.')
      }
      const cutoff = now() - 3_600_000
      const recent = (hits.get(ip) || []).filter(t => t > cutoff)
      if (recent.length >= perHour) {
        throw new ProxyError(429, 'rate_limit_error',
          'Saatlik AI istek sınırına ulaştınız, biraz sonra tekrar deneyin.')
      }
      recent.push(now())
      hits.set(ip, recent)
      // Harita sınırsız büyümesin: eski IP'leri ara ara temizle
      if (hits.size > 5000) {
        for (const [k, v] of hits) if (!v.some(t => t > cutoff)) hits.delete(k)
      }
    },
    /** Yanıt sonrası: gerçek token kullanımını bütçeye yaz. */
    record(usage) {
      rollDay()
      spent += costOf(usage)
    },
    spentToday() { rollDay(); return spent },
  }
}

export function errorBody(type, message) {
  return { type: 'error', error: { type, message } }
}
