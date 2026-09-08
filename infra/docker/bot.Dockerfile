# syntax=docker/dockerfile:1
FROM node:22-alpine
ENV npm_config_store_dir=/pnpm/store \
    npm_config_fetch_retries=6 \
    npm_config_fetch_retry_mintimeout=20000 \
    npm_config_fetch_retry_maxtimeout=180000 \
    npm_config_fetch_timeout=600000
RUN corepack enable && apk add --no-cache openssl
WORKDIR /app
COPY . .
# Bot runs its TS entrypoint via tsx; it needs @prioritizz/config + constants built.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile \
 && pnpm build --filter=@prioritizz/config --filter=@prioritizz/constants
ENV NODE_ENV=production
CMD ["pnpm", "--filter", "@prioritizz/bot", "start"]
