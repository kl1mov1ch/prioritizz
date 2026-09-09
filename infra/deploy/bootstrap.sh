#!/usr/bin/env bash
# =============================================================================
# Prioritizz — fresh-server bootstrap. Installs git, clones the repo, and hands
# off to deploy.sh. Run as root on a blank Ubuntu box:
#
#   PUBLIC_HOST=fiat-legacy.xyz \
#   TELEGRAM_BOT_TOKEN=123:ABC \
#   TELEGRAM_LOGIN_CLIENT_ID=123 \
#   TELEGRAM_LOGIN_SECRET=xxxxx \
#   bash <(curl -fsSL https://raw.githubusercontent.com/kl1mov1ch/prioritizz/main/infra/deploy/bootstrap.sh)
#
# Every VAR=... you set is forwarded to deploy.sh (which writes .env from them
# on first run). PUBLIC_HOST must already resolve to this server.
# =============================================================================
set -euo pipefail

REPO="${REPO:-https://github.com/kl1mov1ch/prioritizz.git}"
DIR="${DIR:-/var/www/prioritizz}"
BRANCH="${BRANCH:-main}"

command -v git >/dev/null 2>&1 || { apt-get update -y && apt-get install -y git curl ca-certificates; }

if [ -d "$DIR/.git" ]; then
  echo "==> updating $DIR"
  git -C "$DIR" fetch origin "$BRANCH"
  git -C "$DIR" reset --hard "origin/$BRANCH"
else
  echo "==> cloning into $DIR"
  mkdir -p "$(dirname "$DIR")"
  git clone --branch "$BRANCH" "$REPO" "$DIR"
fi

cd "$DIR"
exec bash infra/deploy/deploy.sh
