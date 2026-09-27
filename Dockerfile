# ── Aşama 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Sadece bağımlılık dosyalarını kopyala (cache için)
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline

# Kaynak kodu kopyala ve build et
COPY . .
RUN npm run build

# ── Aşama 2: Node sunucusu (statik SPA + Claude proxy) ──────────────────────
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production PORT=80

# Bağımlılıksız sunucu + build çıktısı
COPY server ./server
COPY --from=builder /app/dist ./dist

# Sağlık kontrolü
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/health || exit 1

EXPOSE 80

CMD ["node", "server/index.mjs"]
