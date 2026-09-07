#!/usr/bin/env bash
# =============================================================================
# Prioritizz — one-shot production deploy for a bare VPS (no domain).
#
#   Run ON THE SERVER, as root, from the extracted repo:
#
#     mkdir -p /var/www/prioritizz && cd /var/www/prioritizz
#     tar xzf ~/prioritizz.tar.gz            # (upload the tarball first)
#     bash infra/deploy/deploy.sh
#
# HTTPS: 185.195.24.236.sslip.io resolves to this box's IP, so Let's Encrypt
# signs it — Telegram's WebView requires a browser-trusted cert.
#
# Idempotent: re-run any time. Existing secrets in .env are kept.
# =============================================================================
set -euo pipefail

IP="${SERVER_IP:-185.195.24.236}"
# Real domain for the public site; admin on sslip.io needs zero DNS setup.
PUBLIC_HOST="${PUBLIC_HOST:-fiat-legacy.by}"
ADMIN_HOST="${ADMIN_HOST:-admin.${IP}.sslip.io}"
COMPOSE="docker compose -f docker-compose.prod.yml"

cd "$(dirname "$0")/../.."
echo "==> repo: $PWD"
echo "==> public : https://${PUBLIC_HOST}"
echo "==> admin  : https://${ADMIN_HOST}"

# ---------------------------------------------------------------------------
# 1. Docker
# ---------------------------------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  echo "==> installing Docker"
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi
docker compose version >/dev/null 2>&1 || { echo "docker compose plugin missing"; exit 1; }

# ---------------------------------------------------------------------------
# 2. Firewall — Caddy needs 80 + 443 reachable for the ACME challenge
# ---------------------------------------------------------------------------
if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
  ufw allow 80/tcp  || true
  ufw allow 443/tcp || true
fi

# ---------------------------------------------------------------------------
# 3. .env — generate on first run, keep secrets on re-runs
# ---------------------------------------------------------------------------
rand() { openssl rand -hex 32; }
kv()   { grep -E "^$1=" .env 2>/dev/null | head -1 | cut -d= -f2- || true; }

if [ ! -f .env ]; then
  echo "==> writing .env"
  PG_PW="$(openssl rand -hex 16)"
  S3_SECRET="$(openssl rand -hex 16)"
  cat > .env <<EOF
NODE_ENV=production
APP_MODE=http
API_PORT=3000
API_GLOBAL_PREFIX=api

PUBLIC_HOST=${PUBLIC_HOST}
ADMIN_HOST=${ADMIN_HOST}
MINI_APP_URL=https://${PUBLIC_HOST}
ADMIN_PANEL_URL=https://${ADMIN_HOST}
CORS_ORIGINS=https://${PUBLIC_HOST},https://${ADMIN_HOST},https://t.me
CADDY_ACME_EMAIL=admin@${PUBLIC_HOST}

DATABASE_URL=postgresql://prioritizz:${PG_PW}@postgres:5432/prioritizz?schema=public
POSTGRES_PASSWORD=${PG_PW}
REDIS_URL=redis://redis:6379
BULLMQ_PREFIX=prioritizz

JWT_ACCESS_SECRET=$(rand)
JWT_REFRESH_SECRET=$(rand)
JWT_ACCESS_TTL=900
JWT_REFRESH_TTL=2592000
INITDATA_MAX_AGE_SEC=86400

# --- Telegram: fill these in ---------------------------------------------
TELEGRAM_BOT_TOKEN=__PUT_BOTFATHER_TOKEN_HERE__
TELEGRAM_BOT_USERNAME=prioritizz_bot
TELEGRAM_WEBHOOK_SECRET=$(rand)
TELEGRAM_LOGIN_CLIENT_ID=__PUT_LOGIN_WIDGET_CLIENT_ID_HERE__
TELEGRAM_LOGIN_SECRET=__PUT_LOGIN_WIDGET_SECRET_HERE__
ADMIN_TELEGRAM_ALLOWLIST=@kl1mov1ch
# -----------------------------------------------------------------------

PLATFORM_CURRENCY=XTR
DEFAULT_COMMISSION_BPS=1000
DEFAULT_MIN_FEE=1
ESCROW_AUTO_RELEASE_HOURS=72
DISPUTE_SLA_HOURS=48
PAYMENT_PROVIDERS=telegram_stars

S3_ENDPOINT=http://minio:9000
S3_REGION=us-east-1
S3_BUCKET=prioritizz-media
S3_ACCESS_KEY_ID=prioritizz
S3_SECRET_ACCESS_KEY=${S3_SECRET}
S3_FORCE_PATH_STYLE=true
S3_PUBLIC_URL=https://${PUBLIC_HOST}/media/prioritizz-media

SMTP_URL=smtp://localhost:1025
MAIL_FROM=no-reply@${PUBLIC_HOST}
LOG_LEVEL=info
LOG_PRETTY=false

VITE_API_BASE_URL=/api/v1
VITE_TELEGRAM_BOT_USERNAME=prioritizz_bot
EOF
  chmod 600 .env
else
  echo "==> .env exists — keeping secrets, refreshing host lines"
  sed -i "s#^PUBLIC_HOST=.*#PUBLIC_HOST=${PUBLIC_HOST}#"                       .env
  sed -i "s#^ADMIN_HOST=.*#ADMIN_HOST=${ADMIN_HOST}#"                         .env
  sed -i "s#^MINI_APP_URL=.*#MINI_APP_URL=https://${PUBLIC_HOST}#"            .env
  sed -i "s#^ADMIN_PANEL_URL=.*#ADMIN_PANEL_URL=https://${ADMIN_HOST}#"       .env
  sed -i "s#^S3_PUBLIC_URL=.*#S3_PUBLIC_URL=https://${PUBLIC_HOST}/media/prioritizz-media#" .env
  sed -i "s#^CADDY_ACME_EMAIL=.*#CADDY_ACME_EMAIL=admin@${PUBLIC_HOST}#"      .env
  grep -q '^CORS_ORIGINS=' .env && sed -i "s#^CORS_ORIGINS=.*#CORS_ORIGINS=https://${PUBLIC_HOST},https://${ADMIN_HOST},https://t.me#" .env
fi

BOT_TOKEN="$(kv TELEGRAM_BOT_TOKEN)"
if [ -z "$BOT_TOKEN" ] || echo "$BOT_TOKEN" | grep -q PUT_; then
  echo
  echo "!!  Edit .env and set TELEGRAM_BOT_TOKEN / TELEGRAM_LOGIN_* , then re-run this script."
  echo "!!  (.env is at $PWD/.env)"
  exit 1
fi

# ---------------------------------------------------------------------------
# 4. Build + start
# ---------------------------------------------------------------------------
echo "==> building images (first run ~8-15 min)"
$COMPOSE build

echo "==> starting stack"
$COMPOSE up -d

echo "==> waiting for the API"
for i in $(seq 1 60); do
  if $COMPOSE exec -T api wget -qO- http://localhost:3000/api/healthz >/dev/null 2>&1; then
    echo "   api healthy"; break
  fi
  sleep 3
done

echo "==> waiting for the TLS cert (Caddy / Let's Encrypt)"
for i in $(seq 1 40); do
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "https://${PUBLIC_HOST}/api/healthz" || true)"
  [ "$code" = "200" ] && { echo "   https live"; break; }
  sleep 5
done

# ---------------------------------------------------------------------------
# 5. Point the bot's menu button at the Mini App
# ---------------------------------------------------------------------------
curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setChatMenuButton" \
  -H 'content-type: application/json' \
  -d "{\"menu_button\":{\"type\":\"web_app\",\"text\":\"Prioritizz\",\"web_app\":{\"url\":\"https://${PUBLIC_HOST}\"}}}" >/dev/null \
  && echo "==> bot menu button -> https://${PUBLIC_HOST}"

cat <<EOF

=============================================================================
 DONE.

  Mini App / site : https://${PUBLIC_HOST}
  Admin panel     : https://${ADMIN_HOST}
  API             : https://${PUBLIC_HOST}/api/v1   (Swagger disabled in prod)

  In Telegram: open @prioritizz_bot and tap the menu button, or send /start.
  Admin Login Widget: in BotFather run /setdomain -> @prioritizz_bot ->
    ${ADMIN_HOST}

  Manage:  cd $PWD
    docker compose -f docker-compose.prod.yml ps
    docker compose -f docker-compose.prod.yml logs -f api bot caddy
    docker compose -f docker-compose.prod.yml restart api
  Update:  re-extract the tarball here, then:  bash infra/deploy/deploy.sh
=============================================================================
EOF
