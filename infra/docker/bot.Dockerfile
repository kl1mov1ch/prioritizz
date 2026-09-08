# syntax=docker/dockerfile:1
FROM node:22-alpine
ENV npm_config_fetch_retries=8 \
    npm_config_fetch_retry_maxtimeout=240000 \
    npm_config_fetch_timeout=1200000 \
    npm_config_store_dir=/pnpm/store
RUN npm install -g pnpm@11.3.0 && apk add --no-cache openssl
WORKDIR /app
COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --prefer-offline --network-concurrency=6 \
 && pnpm build --filter=@prioritizz/config --filter=@prioritizz/constants
ENV NODE_ENV=production
CMD ["pnpm", "--filter", "@prioritizz/bot", "start"]
