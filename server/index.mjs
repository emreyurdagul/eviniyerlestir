/**
 * Üretim sunucusu (bağımlılıksız Node 20):
 *   - dist/ altındaki statik SPA'yı servis eder (gzip + cache başlıkları)
 *   - GET  /health            → "ok"
 *   - POST /api/ai/v1/messages → Claude Messages API proxy'si
 *
 * Ortam değişkenleri:
 *   PORT                 (varsayılan 80)
 *   ANTHROPIC_API_KEY    yoksa AI uç noktası 503 döner
 *   AI_RATE_PER_HOUR     IP başı saatlik istek (varsayılan 20)
 *   AI_DAILY_BUDGET_USD  günlük toplam harcama tavanı (varsayılan 1)
 */
import { createServer } from 'node:http'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createGzip } from 'node:zlib'
import { createLimiter, errorBody, ProxyError, sanitizeRequest } from './ai-proxy.mjs'

const DIST = resolve(fileURLToPath(new URL('../dist', import.meta.url)))
const PORT = Number(process.env.PORT) || 80
const API_KEY = process.env.ANTHROPIC_API_KEY || ''
const MAX_BODY = 8 * 1024 * 1024 // fotoğraf analizi base64 görsel taşır

const limiter = createLimiter({
  perHour: Number(process.env.AI_RATE_PER_HOUR) || 20,
  dailyBudgetUsd: Number(process.env.AI_DAILY_BUDGET_USD) || 1,
})

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
  '.glb': 'model/gltf-binary',
  '.txt': 'text/plain; charset=utf-8',
}
const COMPRESSIBLE = /^(text\/|application\/(json|wasm)|image\/svg)/

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(body))
}

function clientIp(req) {
  // Cloudflare → Traefik → konteyner zincirinde gerçek istemci IP'si
  return req.headers['cf-connecting-ip']
    || req.headers['x-real-ip']
    || req.socket.remoteAddress
    || 'unknown'
}

function readBody(req) {
  return new Promise((ok, fail) => {
    const chunks = []
    let size = 0
    req.on('data', c => {
      size += c.length
      if (size > MAX_BODY) {
        fail(new ProxyError(413, 'invalid_request_error', 'İstek çok büyük.'))
        req.destroy()
        return
      }
      chunks.push(c)
    })
    req.on('end', () => ok(Buffer.concat(chunks)))
    req.on('error', fail)
  })
}

async function handleAi(req, res) {
  if (!API_KEY) {
    return sendJson(res, 503, errorBody('api_error', 'AI şu an kullanılamıyor.'))
  }
  let payload
  try {
    const raw = await readBody(req)
    let parsed
    try { parsed = JSON.parse(raw.toString('utf8')) } catch {
      throw new ProxyError(400, 'invalid_request_error', 'Geçersiz JSON.')
    }
    payload = sanitizeRequest(parsed)
    limiter.admit(clientIp(req))
  } catch (e) {
    if (e instanceof ProxyError) return sendJson(res, e.status, errorBody(e.type, e.message))
    throw e
  }

  let upstream
  try {
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(120_000),
    })
  } catch {
    return sendJson(res, 502, errorBody('api_error', 'AI servisine ulaşılamadı.'))
  }

  const text = await upstream.text()
  if (upstream.ok) {
    try { limiter.record(JSON.parse(text).usage) } catch { /* kullanım okunamadı */ }
  }
  res.writeHead(upstream.status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
  res.end(text)
}

async function serveStatic(req, res) {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  let file = normalize(join(DIST, urlPath))
  if (!file.startsWith(DIST)) {
    res.writeHead(403).end()
    return
  }

  let info = await stat(file).catch(() => null)
  if (info?.isDirectory()) {
    file = join(file, 'index.html')
    info = await stat(file).catch(() => null)
  }
  const isAsset = /\.[a-z0-9]+$/i.test(urlPath)
  if (!info) {
    if (isAsset) { res.writeHead(404).end(); return }
    file = join(DIST, 'index.html') // SPA fallback
  }

  const type = MIME[extname(file).toLowerCase()] || 'application/octet-stream'
  const headers = {
    'Content-Type': type,
    // vite içerik-hash'li dosyaları assets/ altına koyar → uzun cache
    'Cache-Control': urlPath.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  }
  const gzip = COMPRESSIBLE.test(type) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')
  if (gzip) { headers['Content-Encoding'] = 'gzip'; headers['Vary'] = 'Accept-Encoding' }
  res.writeHead(200, headers)
  if (req.method === 'HEAD') { res.end(); return }
  const stream = createReadStream(file)
  ;(gzip ? stream.pipe(createGzip()) : stream).pipe(res)
}

const server = createServer((req, res) => {
  const path = req.url.split('?')[0]
  const route = async () => {
    if (path === '/health') {
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      return res.end('ok')
    }
    if (path === '/api/ai/v1/messages') {
      if (req.method !== 'POST') return sendJson(res, 405, errorBody('invalid_request_error', 'Yalnızca POST.'))
      return handleAi(req, res)
    }
    if (path.startsWith('/api/')) return sendJson(res, 404, errorBody('not_found_error', 'Bulunamadı.'))
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405).end(); return }
    return serveStatic(req, res)
  }
  route().catch(err => {
    console.error(err)
    if (!res.headersSent) sendJson(res, 500, errorBody('api_error', 'Sunucu hatası.'))
    else res.end()
  })
})

server.listen(PORT, () => {
  console.log(`eviniyerlestir: :${PORT} (AI ${API_KEY ? 'açık' : 'kapalı'})`)
})

// Konteynerde PID 1 olarak SIGTERM'i kendimiz ele almalıyız; yoksa her
// yeniden dağıtımda 10 sn bekleyip SIGKILL yeriz.
for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => {
    server.close(() => process.exit(0))
    setTimeout(() => process.exit(0), 5000).unref()
  })
}
