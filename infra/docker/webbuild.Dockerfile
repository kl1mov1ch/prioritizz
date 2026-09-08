# syntax=docker/dockerfile:1
# One-shot builder: compiles both SPAs and drops their dist into shared
# volumes that Caddy serves. Re-run after a frontend change with:
#   docker compose -f docker-compose.prod.yml run --rm webbuild
FROM node:22-alpine
ENV npm_config_registry=https://registry.npmmirror.com/ \
    npm_config_store_dir=/pnpm/store \
    npm_config_fetch_retries=8 \
    npm_config_fetch_retry_mintimeout=20000 \
    npm_config_fetch_retry_maxtimeout=240000 \
    npm_config_fetch_timeout=1200000
RUN corepack enable
WORKDIR /app

# Vite bakes these at build time. Relative /api/v1 works because Caddy serves
# the SPA and the API from the same host (buildUrl resolves it against origin).
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_TELEGRAM_BOT_USERNAME=prioritizz_bot
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_TELEGRAM_BOT_USERNAME=$VITE_TELEGRAM_BOT_USERNAME

COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --network-concurrency=4 \
 && pnpm build --filter=@prioritizz/mini-app --filter=@prioritizz/admin

# /out/{mini-app,admin} are bind-mounted volumes (see docker-compose.prod.yml)
CMD sh -c "rm -rf /out/mini-app/* /out/admin/* \
  && cp -r apps/mini-app/dist/. /out/mini-app/ \
  && cp -r apps/admin/dist/. /out/admin/ \
  && echo 'frontend dist published to volumes'"
