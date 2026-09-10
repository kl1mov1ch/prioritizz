#!/usr/bin/env bash
# Best-effort: stand up dev infra, run the API from its built dist, fire the
# black-box attacker, then leave everything running for manual follow-up.
set -u
cd "$(dirname "$0")/../../../.." || exit 1        # -> repo root
ROOT="$PWD"
LOG="$ROOT/apps/api/security-tests/results/bringup.log"
exec > >(tee "$LOG") 2>&1

echo "== repo: $ROOT =="
docker compose up -d postgres redis minio || exit 1

echo "== waiting for postgres =="
for i in $(seq 1 30); do
  docker compose exec -T postgres pg_isready -U prioritizz >/dev/null 2>&1 && break
  sleep 2
done

export $(grep -vE '^\s*#' "$ROOT/.env" | grep -E '=' | xargs -d '\n') 2>/dev/null || true
export DATABASE_URL="postgresql://prioritizz:prioritizz@localhost:5442/prioritizz?schema=public"
export REDIS_URL="redis://localhost:6399"
export S3_ENDPOINT="http://localhost:9000"
export NODE_ENV=development
export APP_MODE=http

echo "== prisma generate + migrate deploy =="
node_modules/.bin/prisma generate --schema prisma/schema.prisma
node_modules/.bin/prisma migrate deploy --schema prisma/schema.prisma

echo "== start API (dist) =="
( node apps/api/dist/main.js & echo $! > /tmp/przapi.pid )
sleep 1
for i in $(seq 1 30); do
  curl -sf http://localhost:3000/api/healthz >/dev/null 2>&1 && { echo "API up"; break; }
  sleep 1
done

echo "== run attacker =="
TARGET=http://localhost:3000 node apps/api/security-tests/live/attack.mjs

echo "== done. API pid: $(cat /tmp/przapi.pid 2>/dev/null). 'docker compose down' + kill pid to clean up. =="
