#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Expose the local dev stack over HTTPS for Telegram (Mini App + admin).
#
# cloudflared "quick tunnels" need no account but their *.trycloudflare.com
# hostname changes every run, so this script:
#   1. starts one tunnel -> mini-app (:5173, which vite-proxies /api and /media)
#   2. starts one tunnel -> admin    (:5174)
#   3. rewrites the tunnel hostnames into .env (MINI_APP_URL, ADMIN_PANEL_URL,
#      CORS_ORIGINS, VITE_API_BASE_URL, S3_PUBLIC_URL)
#   4. points the bot menu button at the new Mini App URL
#
# Then restart api + the two vite dev servers so they pick up the new .env,
# and (once) run `pnpm --filter @prioritizz/bot dev`.
#
# Requires: cloudflared on PATH (or set CLOUDFLARED=/path/to/cloudflared.exe),
#           the dev servers already running on :3000 / :5173 / :5174,
#           TELEGRAM_BOT_TOKEN in .env.
# ---------------------------------------------------------------------------
set -euo pipefail
cd "$(dirname "$0")/.."

CF="${CLOUDFLARED:-cloudflared}"
command -v "$CF" >/dev/null 2>&1 || { echo "cloudflared not found (set CLOUDFLARED=...)"; exit 1; }

LOGDIR="$(mktemp -d)"
start_tunnel() { # $1=port  -> echoes https URL
  local port="$1" log="$LOGDIR/cf-$1.log"
  nohup "$CF" tunnel --no-autoupdate --url "http://localhost:$port" >"$log" 2>&1 &
  for _ in $(seq 1 30); do
    local url
    url="$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$log" | head -1 || true)"
    [ -n "$url" ] && { echo "$url"; return 0; }
    sleep 2
  done
  echo "tunnel for :$port did not come up" >&2; exit 1
}

MINI_URL="$(start_tunnel 5173)"
ADMIN_URL="$(start_tunnel 5174)"
echo "mini-app : $MINI_URL"
echo "admin    : $ADMIN_URL"

# --- rewrite .env -------------------------------------------------------------
set_env() { # key value
  if grep -qE "^$1=" .env; then
    sed -i "s#^$1=.*#$1=$2#" .env
  else
    echo "$1=$2" >> .env
  fi
}
set_env MINI_APP_URL       "$MINI_URL"
set_env ADMIN_PANEL_URL    "$ADMIN_URL"
set_env VITE_API_BASE_URL  "$MINI_URL/api/v1"
set_env S3_PUBLIC_URL      "$MINI_URL/media/prioritizz-media"
set_env CORS_ORIGINS       "http://localhost:5173,http://localhost:5174,https://t.me,$MINI_URL,$ADMIN_URL"

# --- point the bot menu button at the Mini App ------------------------------
TOKEN="$(grep -E '^TELEGRAM_BOT_TOKEN=' .env | cut -d= -f2-)"
if [ -n "$TOKEN" ]; then
  curl -s -X POST "https://api.telegram.org/bot$TOKEN/setChatMenuButton" \
    -H 'content-type: application/json' \
    -d "{\"menu_button\":{\"type\":\"web_app\",\"text\":\"Prioritizz\",\"web_app\":{\"url\":\"$MINI_URL\"}}}" >/dev/null
  echo "bot menu button -> $MINI_URL"
fi

cat <<EOF

Next:
  * restart the api + vite dev servers so they read the new .env
  * open @prioritizz_bot in Telegram and tap the menu button
  * admin: $ADMIN_URL  (for the Login Widget, set this host in BotFather:
    /setdomain -> @prioritizz_bot -> $ADMIN_URL)
EOF
