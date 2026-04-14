# ── Aşama 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Sadece bağımlılık dosyalarını kopyala (cache için)
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline

# Kaynak kodu kopyala ve build et
COPY . .
RUN npm run build

# ── Aşama 2: Nginx ile servis ────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Nginx konfigürasyonu
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Build çıktısını Nginx'e kopyala
COPY --from=builder /app/dist /usr/share/nginx/html

# Sağlık kontrolü
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
