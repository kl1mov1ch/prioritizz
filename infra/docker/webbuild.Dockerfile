# syntax=docker/dockerfile:1
FROM node:22-alpine
ENV npm_config_fetch_retries=8 \
    npm_config_fetch_retry_maxtimeout=240000 \
    npm_config_fetch_timeout=1200000 \
    npm_config_store_dir=/pnpm/store
RUN npm install -g pnpm@11.3.0
WORKDIR /app
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_TELEGRAM_BOT_USERNAME=prioritizz_bot
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_TELEGRAM_BOT_USERNAME=$VITE_TELEGRAM_BOT_USERNAME
COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --prefer-offline --network-concurrency=6
RUN pnpm build --filter=@prioritizz/mini-app --filter=@prioritizz/admin
CMD sh -c "rm -rf /out/mini-app/* /out/admin/* && cp -r apps/mini-app/dist/. /out/mini-app/ && cp -r apps/admin/dist/. /out/admin/ && echo 'frontend dist published to volumes'"
