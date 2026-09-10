# syntax=docker/dockerfile:1
FROM node:22-alpine AS build
# Direct from npmjs (fastest when the route is healthy). npm i -g instead of
# corepack: corepack's own downloader hardcodes registry.npmjs.org and stalls.
# --prefer-offline: reuse the cached pnpm store, hit the network only for misses.
ENV npm_config_fetch_retries=8 \
    npm_config_fetch_retry_maxtimeout=240000 \
    npm_config_fetch_timeout=1200000 \
    npm_config_store_dir=/pnpm/store
RUN npm install -g pnpm@11.3.0 && apk add --no-cache openssl
WORKDIR /app
COPY . .
# Split so a successful install becomes its own cached layer — the steps after
# it are offline, and a failure there must not force the install to re-run.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --prefer-offline --network-concurrency=6
RUN pnpm db:generate
RUN pnpm build --filter=@prioritizz/api

FROM node:22-alpine AS runtime
RUN apk add --no-cache openssl wget
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=build /app/packages ./packages
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
# pnpm's strict (non-hoisted) node_modules keeps @prioritizz/api's own deps
# (reflect-metadata, @nestjs/*, bullmq, ...) as symlinks under its own
# node_modules, not the root one — without this, node can't resolve them
# at runtime (MODULE_NOT_FOUND) even though the root node_modules is copied.
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --retries=10 \
  CMD wget -qO- http://localhost:3000/api/healthz || exit 1
CMD ["node", "apps/api/dist/main.js"]
