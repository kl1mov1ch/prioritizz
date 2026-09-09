#!/usr/bin/env bash
# =============================================================================
# Prioritizz — one-shot production deploy for a fresh Ubuntu VPS.
#
#   On the server, as root:
#
#     apt-get update && apt-get install -y git curl
#     git clone https://github.com/kl1mov1ch/prioritizz.git /var/www/prioritizz
#     cd /var/www/prioritizz
#     PUBLIC_HOST=fiat-legacy.xyz \
#     TELEGRAM_BOT_TOKEN=123:ABC \
#     TELEGRAM_LOGIN_CLIENT_ID=123 \
#     TELEGRAM_LOGIN_SECRET=xxxxx \
#     bash infra/deploy/deploy.sh
#
#   PUBLIC_HOST must already have an A record pointing at this box.
#   The admin panel defaults to  admin.<public-ip>.sslip.io  (no DNS setup
#   needed); pass ADMIN_HOST=admin.example.com if you add the record yourself.
#
# What it does: install Docker, add swap, free ports 80/443, build the three
# images, pull the base images, bring up postgres + redis + minio + api +
# worker + bot + caddy, run the DB migrations, wait for the Let's Encrypt
# cert, point the bot's menu button at the Mini App.
#
# Idempotent: re-run any time. Secrets already in .env are kept; env vars
# above are only used the first time .env is written.
# =============================================================================
set -euo pipefail

cd "$(dirname "$0")/../.."
echo "==> repo: $PWD"

# --- public IP: for the sslip.io admin host and the closing summary --------
IP="${SERVER_IP:-$(curl -fsS --max-time 10 https://api.ipify.org 2>/dev/null || true)}"
[ -n "$IP" ] || IP="$(hostname -I 2>/dev/null | awk '{print $1}')"

HOST_OVERRIDE="${PUBLIC_HOST:-}${ADMIN_HOST:-}"
PUBLIC_HOST="${PUBLIC_HOST:-fiat-legacy.xyz}"
ADMIN_HOST="${ADMIN_HOST:-admin.${IP}.sslip.io}"
COMPOSE="docker compose -f docker-compose.prod.yml"

echo "==> public : https://${PUBLIC_HOST}"
echo "==> admin  : https://${ADMIN_HOST}"
echo "==> server : ${IP:-<ip unknown>}"

# ---------------------------------------------------------------------------
# 1. Docker
# ---------------------------------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  echo "==> installing Docker"
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi
docker compose version >/dev/null 2>&1 || { echo "docker compose plugin missing"; exit 1; }

# Some VPS network paths blackhole large packets inside the build/container
# netns while the host network is fine — npm tarballs and Prisma engines then
# time out mid-download. Lower the MTU and pin public DNS for the daemon.
echo "==> docker daemon.json (mtu 1400 + public DNS)"
mkdir -p /etc/docker
if ! grep -q '"mtu"' /etc/docker/daemon.json 2>/dev/null; then
  printf '{ "mtu": 1400, "dns": ["1.1.1.1", "8.8.8.8"] }\n' > /etc/docker/daemon.json
  systemctl restart docker 2>/dev/null || service docker restart || true
  sleep 4
fi

# Building the Node images on a small box can OOM — add swap once if there's none.
if [ "$(free -m | awk '/Swap:/{print $2}')" = "0" ]; then
  echo "==> no swap; adding a 4 GB swapfile for the build"
  fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# ---------------------------------------------------------------------------
# 2. Ports 80 / 443 — the container Caddy binds them
# ---------------------------------------------------------------------------
systemctl disable --now nginx apache2 httpd lighttpd 2>/dev/null || true
# clear a previous run of our own stack (a stale caddy still holding :80)
$COMPOSE down --remove-orphans 2>/dev/null || true
if ss -tlnH 2>/dev/null | grep -qE ':(80|443)($|[[:space:]])'; then
  echo
  echo "!!  Something still listens on port 80/443:"
  ss -tlnp 2>/dev/null | grep -E ':(80|443)($|[[:space:]])' || true
  echo "!!  Stop it and re-run. (Usually a host web server, or another"
  echo "!!  compose project: 'docker compose -p <name> down'.)"
  exit 1
fi

# ---------------------------------------------------------------------------
# 3. Firewall — Caddy needs 80 + 443 reachable for the ACME challenge
# ---------------------------------------------------------------------------
if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
  ufw allow 80/tcp  || true
  ufw allow 443/tcp || true
fi

# ---------------------------------------------------------------------------
# 4. .env — generate on first run, keep secrets on re-runs
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
CADDY_ACME_EMAIL=${CADDY_ACME_EMAIL:-admin@${PUBLIC_HOST}}

DATABASE_URL=postgresql://prioritizz:${PG_PW}@postgres:5432/prioritizz?schema=public
POSTGRES_PASSWORD=${PG_PW}
REDIS_URL=redis://redis:6379
BULLMQ_PREFIX=prioritizz

JWT_ACCESS_SECRET=$(rand)
JWT_REFRESH_SECRET=$(rand)
JWT_ACCESS_TTL=900
JWT_REFRESH_TTL=2592000
INITDATA_MAX_AGE_SEC=86400

TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN:-__PUT_BOTFATHER_TOKEN_HERE__}
TELEGRAM_BOT_USERNAME=${TELEGRAM_BOT_USERNAME:-prioritizz_bot}
TELEGRAM_WEBHOOK_SECRET=${TELEGRAM_WEBHOOK_SECRET:-$(rand)}
TELEGRAM_LOGIN_CLIENT_ID=${TELEGRAM_LOGIN_CLIENT_ID:-__PUT_LOGIN_WIDGET_CLIENT_ID_HERE__}
TELEGRAM_LOGIN_SECRET=${TELEGRAM_LOGIN_SECRET:-__PUT_LOGIN_WIDGET_SECRET_HERE__}
ADMIN_TELEGRAM_ALLOWLIST=${ADMIN_TELEGRAM_ALLOWLIST:-@kl1mov1ch}

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
VITE_TELEGRAM_BOT_USERNAME=${TELEGRAM_BOT_USERNAME:-prioritizz_bot}
EOF
  chmod 600 .env
elif [ -n "$HOST_OVERRIDE" ]; then
  echo "==> .env exists — PUBLIC_HOST/ADMIN_HOST override given, rewriting host lines"
  sed -i "s#^PUBLIC_HOST=.*#PUBLIC_HOST=${PUBLIC_HOST}#"                       .env
  sed -i "s#^ADMIN_HOST=.*#ADMIN_HOST=${ADMIN_HOST}#"                         .env
  sed -i "s#^MINI_APP_URL=.*#MINI_APP_URL=https://${PUBLIC_HOST}#"            .env
  sed -i "s#^ADMIN_PANEL_URL=.*#ADMIN_PANEL_URL=https://${ADMIN_HOST}#"       .env
  sed -i "s#^S3_PUBLIC_URL=.*#S3_PUBLIC_URL=https://${PUBLIC_HOST}/media/prioritizz-media#" .env
  sed -i "s#^CADDY_ACME_EMAIL=.*#CADDY_ACME_EMAIL=admin@${PUBLIC_HOST}#"      .env
  grep -q '^CORS_ORIGINS=' .env && sed -i "s#^CORS_ORIGINS=.*#CORS_ORIGINS=https://${PUBLIC_HOST},https://${ADMIN_HOST},https://t.me#" .env
else
  echo "==> .env exists — using it as-is"
  PUBLIC_HOST="$(kv PUBLIC_HOST)"; PUBLIC_HOST="${PUBLIC_HOST:-fiat-legacy.xyz}"
  ADMIN_HOST="$(kv ADMIN_HOST)"; ADMIN_HOST="${ADMIN_HOST:-admin.${IP}.sslip.io}"
fi

BOT_TOKEN="$(kv TELEGRAM_BOT_TOKEN)"
if [ -z "$BOT_TOKEN" ] || echo "$BOT_TOKEN" | grep -q PUT_; then
  echo
  echo "!!  TELEGRAM_BOT_TOKEN / TELEGRAM_LOGIN_* are not set."
  echo "!!  Edit $PWD/.env (or re-run with them as env vars), then run this again."
  exit 1
fi

# ---------------------------------------------------------------------------
# 5. Build
# ---------------------------------------------------------------------------
echo "==> building images one at a time (first run ~10-20 min on a slow link)"
# Sequential, not parallel: three concurrent pnpm installs saturate a thin
# uplink and trip download timeouts. The shared pnpm-store cache mount makes
# the 2nd and 3rd builds mostly reuse what the 1st already fetched.
for svc in migrate bot webbuild; do
  echo "   -> building $svc"
  n=0
  until $COMPOSE build "$svc"; do
    n=$((n + 1))
    [ "$n" -ge 4 ] && { echo "!! $svc failed to build after $n attempts"; exit 1; }
    echo "   $svc build hiccup (network?), retry $n/4 in 15s..."
    sleep 15
  done
done

# ---------------------------------------------------------------------------
# 6. Pull base images + start
# ---------------------------------------------------------------------------
echo "==> pulling base images"
n=0
until $COMPOSE pull postgres redis minio createbuckets caddy; do
  n=$((n + 1))
  [ "$n" -ge 6 ] && { echo "!! base image pull failed after $n attempts"; exit 1; }
  echo "   pull hiccup, retry $n/6 in 15s..."
  sleep 15
done

echo "==> starting stack"
n=0
until $COMPOSE up -d; do
  n=$((n + 1))
  [ "$n" -ge 5 ] && { echo "!! 'compose up' failed after $n attempts"; $COMPOSE ps; exit 1; }
  echo "   up hiccup, retry $n/5 in 15s..."
  sleep 15
done

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
# 7. Point the bot's menu button at the Mini App
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

  In Telegram: open @${TELEGRAM_BOT_USERNAME:-prioritizz_bot} and tap the menu
  button, or send /start.
  Admin Login Widget: in BotFather run /setdomain -> your bot ->
    ${ADMIN_HOST}

  Manage:  cd $PWD
    docker compose -f docker-compose.prod.yml ps
    docker compose -f docker-compose.prod.yml logs -f api bot caddy
    docker compose -f docker-compose.prod.yml restart api
  Update:  git pull && bash infra/deploy/deploy.sh
=============================================================================
EOF
