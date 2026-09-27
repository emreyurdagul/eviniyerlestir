import { describe, expect, it } from 'vitest'
import { callProvider, fromOpenAI, resolveConfig, toOpenAI } from '../providers.mjs'

const payload = {
  max_tokens: 100,
  system: [{ type: 'text', text: 'sen bir iç mimarsın', cache_control: { type: 'ephemeral' } }],
  messages: [{
    role: 'user',
    content: [
      { type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'AAAA' } },
      { type: 'text', text: 'bu ne?' },
    ],
  }],
}

function fakeFetch(status, body) {
  const calls = []
  const fn = async (url, init) => {
    calls.push({ url, init, json: JSON.parse(init.body) })
    return { ok: status < 400, status, json: async () => body }
  }
  fn.calls = calls
  return fn
}

describe('resolveConfig', () => {
  it('varsayılan sağlayıcı gemini', () => {
    expect(resolveConfig({ AI_API_KEY: 'g' })).toMatchObject({ provider: 'gemini', format: 'openai', enabled: true })
  })

  it('anthropic için ANTHROPIC_API_KEY geri uyumu', () => {
    const c = resolveConfig({ AI_PROVIDER: 'anthropic', ANTHROPIC_API_KEY: 'k' })
    expect(c).toMatchObject({ provider: 'anthropic', format: 'anthropic', apiKey: 'k', enabled: true })
  })

  it('preset + ortam değişkeni ezmeleri', () => {
    const c = resolveConfig({
      AI_PROVIDER: 'Gemini', AI_API_KEY: 'g', AI_MODEL: 'gemini-x',
      AI_BASE_URL: 'https://example.test/v1/', AI_PRICE_IN_PER_M: '0', AI_PRICE_OUT_PER_M: '2',
    })
    expect(c).toMatchObject({ provider: 'gemini', format: 'openai', model: 'gemini-x', baseUrl: 'https://example.test/v1', priceIn: 0, priceOut: 2e-6 })
  })

  it('anahtarsız sağlayıcı kapalı, ollama anahtarsız açık, bilinmeyen sağlayıcı hata', () => {
    expect(resolveConfig({ AI_PROVIDER: 'openai' }).enabled).toBe(false)
    expect(resolveConfig({ AI_PROVIDER: 'ollama' }).enabled).toBe(true)
    // anthropic anahtarı başka sağlayıcıya sızmaz
    expect(resolveConfig({ AI_PROVIDER: 'openai', ANTHROPIC_API_KEY: 'k' }).enabled).toBe(false)
    expect(() => resolveConfig({ AI_PROVIDER: 'nope' })).toThrow(/Bilinmeyen/)
  })
})

describe('Anthropic ↔ OpenAI çevirisi', () => {
  it('system dizisini ve görsel bloğunu çevirir', () => {
    const out = toOpenAI(payload, 'm')
    expect(out.model).toBe('m')
    expect(out.max_tokens).toBe(100)
    expect(out.messages[0]).toEqual({ role: 'system', content: 'sen bir iç mimarsın' })
    expect(out.messages[1].content).toEqual([
      { type: 'image_url', image_url: { url: 'data:image/png;base64,AAAA' } },
      { type: 'text', text: 'bu ne?' },
    ])
  })

  it('yanıtı Anthropic biçimine döndürür, <think> bloğunu atar', () => {
    const msg = fromOpenAI({
      id: 'x', choices: [{ finish_reason: 'length', message: { content: '<think>hmm</think>\n{"a":1}' } }],
      usage: { prompt_tokens: 12, completion_tokens: 3 },
    }, 'm')
    expect(msg).toMatchObject({
      type: 'message', role: 'assistant', content: [{ type: 'text', text: '{"a":1}' }],
      stop_reason: 'max_tokens', usage: { input_tokens: 12, output_tokens: 3 },
    })
  })
})

describe('callProvider', () => {
  it('OpenAI uyumlu: Bearer başlığı, /chat/completions, çevrilmiş yanıt', async () => {
    const f = fakeFetch(200, { choices: [{ finish_reason: 'stop', message: { content: 'ok' } }], usage: { prompt_tokens: 1, completion_tokens: 1 } })
    const cfg = resolveConfig({ AI_PROVIDER: 'openai', AI_API_KEY: 'sk' })
    const r = await callProvider(cfg, payload, f)
    expect(f.calls[0].url).toBe('https://api.openai.com/v1/chat/completions')
    expect(f.calls[0].init.headers.authorization).toBe('Bearer sk')
    expect(r).toMatchObject({ status: 200, body: { content: [{ text: 'ok' }] } })
  })

  it('Anthropic: modeli sunucu yapılandırmasından koyar', async () => {
    const f = fakeFetch(200, { type: 'message', content: [{ type: 'text', text: 'hi' }], usage: {} })
    const cfg = resolveConfig({ AI_PROVIDER: 'anthropic', ANTHROPIC_API_KEY: 'k', AI_MODEL: 'claude-x' })
    await callProvider(cfg, payload, f)
    expect(f.calls[0].url).toBe('https://api.anthropic.com/v1/messages')
    expect(f.calls[0].init.headers['x-api-key']).toBe('k')
    expect(f.calls[0].json.model).toBe('claude-x')
  })

  it('sağlayıcı hatasını okunur mesajla ve aynı durum koduyla döndürür', async () => {
    const f = fakeFetch(401, { error: { message: 'Incorrect API key' } })
    const r = await callProvider(resolveConfig({ AI_PROVIDER: 'groq', AI_API_KEY: 'x' }), payload, f)
    expect(r).toEqual({ status: 401, body: { type: 'error', error: { type: 'api_error', message: 'Incorrect API key' } } })
  })
})
