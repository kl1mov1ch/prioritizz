# syntax=docker/dockerfile:1
FROM node:22-alpine
ENV npm_config_registry=https://registry.npmmirror.com/ \
    npm_config_store_dir=/pnpm/store \
    npm_config_fetch_retries=8 \
    npm_config_fetch_retry_mintimeout=20000 \
    npm_config_fetch_retry_maxtimeout=240000 \
    npm_config_fetch_timeout=1200000
RUN corepack enable && apk add --no-cache openssl
WORKDIR /app
COPY . .
# Bot runs its TS entrypoint via tsx; it needs @prioritizz/config + constants built.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --network-concurrency=4 \
 && pnpm build --filter=@prioritizz/config --filter=@prioritizz/constants
ENV NODE_ENV=production
CMD ["pnpm", "--filter", "@prioritizz/bot", "start"]
