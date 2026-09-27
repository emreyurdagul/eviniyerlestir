/**
 * AI sağlayıcı katmanı. İstemci her zaman Anthropic Messages biçiminde
 * konuşur; burada seçili sağlayıcıya çevrilir ve yanıt yine Anthropic
 * biçimine döndürülür. Böylece sağlayıcı değiştirmek yalnızca ortam
 * değişkeni işidir, istemci kodu değişmez.
 *
 *   AI_PROVIDER         gemini (varsayılan) | openai | anthropic | groq | openrouter | deepseek | ollama
 *   AI_API_KEY          sağlayıcı anahtarı (anthropic için ANTHROPIC_API_KEY de okunur)
 *   AI_MODEL            varsayılan modeli değiştirir
 *   AI_BASE_URL         OpenAI uyumlu uç nokta adresini değiştirir
 *   AI_PRICE_IN_PER_M   girdi fiyatı, USD / 1M token (günlük bütçe hesabı için)
 *   AI_PRICE_OUT_PER_M  çıktı fiyatı, USD / 1M token
 *
 * Varsayılan model/fiyatlar yol göstericidir; sağlayıcılar sık değiştirdiği
 * için üretimde AI_MODEL ve fiyatları açıkça vermek daha güvenli.
 */

export const PRESETS = {
  anthropic: { format: 'anthropic', baseUrl: 'https://api.anthropic.com', model: 'claude-haiku-4-5-20251001', priceIn: 1, priceOut: 5 },
  openai: { format: 'openai', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini', priceIn: 0.15, priceOut: 0.6 },
  gemini: { format: 'openai', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.5-flash', priceIn: 0.3, priceOut: 2.5 },
  groq: { format: 'openai', baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile', priceIn: 0.59, priceOut: 0.79 },
  openrouter: { format: 'openai', baseUrl: 'https://openrouter.ai/api/v1', model: 'google/gemini-2.5-flash', priceIn: 0.3, priceOut: 2.5 },
  deepseek: { format: 'openai', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat', priceIn: 0.27, priceOut: 1.1 },
  ollama: { format: 'openai', baseUrl: 'http://localhost:11434/v1', model: 'qwen3:1.7b', priceIn: 0, priceOut: 0, keyOptional: true },
}

export function resolveConfig(env) {
  const provider = (env.AI_PROVIDER || 'gemini').toLowerCase()
  const preset = PRESETS[provider]
  if (!preset) throw new Error(`Bilinmeyen AI_PROVIDER: ${provider} (${Object.keys(PRESETS).join(', ')})`)
  const apiKey = env.AI_API_KEY || (provider === 'anthropic' ? env.ANTHROPIC_API_KEY : '') || ''
  const num = (v, d) => (v !== undefined && v !== '' && Number.isFinite(Number(v)) ? Number(v) : d)
  return {
    provider,
    format: preset.format,
    baseUrl: (env.AI_BASE_URL || preset.baseUrl).replace(/\/+$/, ''),
    model: env.AI_MODEL || preset.model,
    apiKey,
    enabled: Boolean(apiKey) || Boolean(preset.keyOptional),
    priceIn: num(env.AI_PRICE_IN_PER_M, preset.priceIn) / 1_000_000,
    priceOut: num(env.AI_PRICE_OUT_PER_M, preset.priceOut) / 1_000_000,
  }
}

// ── Anthropic → OpenAI chat completions ───────────────────────────────────────

function systemText(system) {
  if (typeof system === 'string') return system
  if (Array.isArray(system)) return system.map(b => b?.text || '').join('\n\n')
  return ''
}

function convertContent(content) {
  if (typeof content === 'string') return content
  return content.map(block => {
    if (block.type === 'image' && block.source?.type === 'base64') {
      return { type: 'image_url', image_url: { url: `data:${block.source.media_type};base64,${block.source.data}` } }
    }
    return { type: 'text', text: block.text ?? '' }
  })
}

export function toOpenAI(payload, model) {
  const messages = []
  const sys = systemText(payload.system)
  if (sys) messages.push({ role: 'system', content: sys })
  for (const m of payload.messages) messages.push({ role: m.role, content: convertContent(m.content) })
  const out = { model, messages, max_tokens: payload.max_tokens }
  if (typeof payload.temperature === 'number') out.temperature = payload.temperature
  return out
}

const STOP_REASON = { stop: 'end_turn', length: 'max_tokens', content_filter: 'end_turn', tool_calls: 'tool_use' }

export function fromOpenAI(body, model) {
  const choice = body.choices?.[0]
  let text = choice?.message?.content ?? ''
  if (Array.isArray(text)) text = text.map(p => p?.text || '').join('')
  // Bazı akıl yürüten modeller (qwen3, deepseek-r1) yanıta <think> bloğu ekler
  text = String(text).replace(/<think>[\s\S]*?<\/think>\s*/g, '')
  return {
    id: body.id || 'msg_proxy',
    type: 'message',
    role: 'assistant',
    model: body.model || model,
    content: [{ type: 'text', text }],
    stop_reason: STOP_REASON[choice?.finish_reason] || 'end_turn',
    stop_sequence: null,
    usage: {
      input_tokens: body.usage?.prompt_tokens ?? 0,
      output_tokens: body.usage?.completion_tokens ?? 0,
    },
  }
}

function upstreamErrorMessage(body, status) {
  const e = body?.error
  const msg = (typeof e === 'string' ? e : e?.message) || body?.message
  return msg || `Sağlayıcı ${status} döndü.`
}

/**
 * İsteği sağlayıcıya iletir. Her durumda { status, body } döner; body
 * Anthropic biçimindedir (başarılıysa mesaj, değilse hata nesnesi).
 */
export async function callProvider(cfg, payload, fetchImpl = fetch) {
  const signal = AbortSignal.timeout(120_000)

  if (cfg.format === 'anthropic') {
    const res = await fetchImpl(`${cfg.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': cfg.apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ ...payload, model: cfg.model }),
      signal,
    })
    const body = await res.json().catch(() => null)
    if (res.ok && body) return { status: 200, body }
    return {
      status: res.status,
      body: { type: 'error', error: { type: body?.error?.type || 'api_error', message: upstreamErrorMessage(body, res.status) } },
    }
  }

  const headers = { 'content-type': 'application/json' }
  if (cfg.apiKey) headers.authorization = `Bearer ${cfg.apiKey}`
  const res = await fetchImpl(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(toOpenAI(payload, cfg.model)),
    signal,
  })
  const body = await res.json().catch(() => null)
  if (res.ok && body?.choices) return { status: 200, body: fromOpenAI(body, cfg.model) }
  return {
    status: res.ok ? 502 : res.status,
    body: { type: 'error', error: { type: 'api_error', message: upstreamErrorMessage(body, res.status) } },
  }
}
