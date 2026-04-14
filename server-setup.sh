#!/bin/bash
# EviniYerlestir — Sunucu İlk Kurulum Scripti
# Çalıştır: bash server-setup.sh
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " EviniYerlestir Sunucu Kurulumu"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. Docker kontrolü ────────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  echo "❌ Docker bulunamadı. Lütfen önce Docker kurun."
  exit 1
fi
echo "✅ Docker: $(docker --version)"

# ── 2. Deploy key'i authorized_keys'e ekle ────────────────────────────────────
DEPLOY_PUBKEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHIs3j3rRhJuymjIB2lGeoLbswEYEUZVr4GlLYNjcOP5 github-actions-deploy"

mkdir -p ~/.ssh
chmod 700 ~/.ssh
touch ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

if grep -qF "github-actions-deploy" ~/.ssh/authorized_keys 2>/dev/null; then
  echo "✅ Deploy key zaten mevcut"
else
  echo "$DEPLOY_PUBKEY" >> ~/.ssh/authorized_keys
  echo "✅ Deploy key eklendi"
fi

# ── 3. 80 portunu aç (ufw varsa) ─────────────────────────────────────────────
if command -v ufw &>/dev/null; then
  ufw allow 80/tcp >/dev/null 2>&1 && echo "✅ Port 80 açıldı (ufw)" || true
fi

# ── 4. Eski container varsa durdur ───────────────────────────────────────────
if docker ps -a --format '{{.Names}}' | grep -q "^eviniyerlestir$"; then
  echo "🔄 Eski container durduruluyor..."
  docker stop eviniyerlestir 2>/dev/null || true
  docker rm   eviniyerlestir 2>/dev/null || true
fi

# ── 5. Geçici test: nginx ile boş container başlat (ilk deploy gelene kadar) ──
docker run -d \
  --name eviniyerlestir \
  --restart unless-stopped \
  -p 80:80 \
  nginx:alpine 2>/dev/null && echo "✅ Geçici nginx container başlatıldı" || echo "⚠️  Container zaten çalışıyor"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Kurulum tamamlandı!"
echo " Sunucu: http://72.61.95.76"
echo " GitHub Actions deploy'u tetikleyince"
echo " gerçek uygulama yüklenecek."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
