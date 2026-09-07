#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Free public HTTPS for the Telegram Mini App, kept alive.
#
# Tunnel choice: cloudflared quick tunnel. It is the ONLY free option that does
# NOT inject a browser-warning interstitial — ngrok-free and serveo-free both
# show one to any request with `Sec-Fetch-Mode: navigate`, which is exactly what
# Telegram's WebView sends, so the Mini App renders their warning page instead
# of the app. (Trade-off: Cloudflare's edge is throttled/blocked in some
# regions; if the app won't load there, a real host is the only fix.)
#
# What this does, in a loop:
#   1. run `cloudflared tunnel --url http://localhost:5173`
#   2. when it prints a *.trycloudflare.com host that differs from .env, rewrite
#      MINI_APP_URL / VITE_API_BASE_URL / S3_PUBLIC_URL / CORS_ORIGINS and
#      re-point the bot menu button (setChatMenuButton)
#   3. bounce the api + mini-app + bot dev servers so they read the new .env
#   4. if cloudflared exits, restart it (a new host triggers step 2 again)
#
# Prereqs: dev servers already running on :3000/:5173, cloudflared on PATH
# (or CLOUDFLARED=/abs/path), TELEGRAM_BOT_TOKEN in .env.
# ---------------------------------------------------------------------------
set -uo pipefail
cd "$(dirname "$0")/.."
ROOT="$PWD"
CF="${CLOUDFLARED:-cloudflared}"
command -v "$CF" >/dev/null 2>&1 || { echo "cloudflared not found (set CLOUDFLARED=...)"; exit 1; }
LOG="$(mktemp)"
TOKEN="$(grep -E '^TELEGRAM_BOT_TOKEN=' .env | cut -d= -f2-)"

rewire() { # $1 = new host (no scheme)
  local host="$1" url="https://$1"
  local cur; cur="$(grep -oE '[a-z0-9-]+\.trycloudflare\.com' .env | head -1)"
  [ "$cur" = "$host" ] && return 0
  echo ">> new tunnel host: $host  (was: ${cur:-none})"
  if [ -n "$cur" ]; then
    sed -i "s/$cur/$host/g" .env
  else
    sed -i "s#^MINI_APP_URL=.*#MINI_APP_URL=$url#" .env
    sed -i "s#^VITE_API_BASE_URL=.*#VITE_API_BASE_URL=$url/api/v1#" .env
    sed -i "s#^S3_PUBLIC_URL=.*#S3_PUBLIC_URL=$url/media/prioritizz-media#" .env
    sed -i "s#^CORS_ORIGINS=.*#CORS_ORIGINS=http://localhost:5173,http://localhost:5174,https://t.me,$url#" .env
  fi
  if [ -n "$TOKEN" ]; then
    curl -s -X POST "https://api.telegram.org/bot$TOKEN/setChatMenuButton" \
      -H 'content-type: application/json' \
      -d "{\"menu_button\":{\"type\":\"web_app\",\"text\":\"Prioritizz\",\"web_app\":{\"url\":\"$url\"}}}" >/dev/null \
      && echo ">> bot menu button -> $url"
  fi
  echo ">> restart api + mini-app + bot to pick up .env  (do this in your dev terminal)"
}

while true; do
  : > "$LOG"
  "$CF" tunnel --no-autoupdate --url http://localhost:5173 >"$LOG" 2>&1 &
  CFPID=$!
  # wait for the host, then rewire once
  for _ in $(seq 1 40); do
    host="$(grep -oE '[a-z0-9-]+\.trycloudflare\.com' "$LOG" | head -1 || true)"
    [ -n "${host:-}" ] && { rewire "$host"; break; }
    sleep 2
  done
  echo ">> cloudflared running (pid $CFPID). Ctrl-C to stop."
  wait "$CFPID"
  echo ">> cloudflared exited, restarting in 3s"
  sleep 3
done
