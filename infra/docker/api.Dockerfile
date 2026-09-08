# syntax=docker/dockerfile:1
FROM node:22-alpine AS build
# This box's route to registry.npmjs.org (Cloudflare) is throttled/dropping.
# corepack ignores npm_config_registry, so skip it: install pnpm via bundled npm
# from a non-Cloudflare mirror. pnpm + Prisma engine downloads use the mirror too.
ENV npm_config_registry=https://mirrors.cloud.tencent.com/npm/ \
    npm_config_store_dir=/pnpm/store \
    npm_config_fetch_retries=8 \
    npm_config_fetch_retry_maxtimeout=240000 \
    npm_config_fetch_timeout=1200000 \
    PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary \
    PRISMA_BINARIES_MIRROR=https://registry.npmmirror.com/-/binary
RUN npm install -g pnpm@11.3.0 && apk add --no-cache openssl
WORKDIR /app
COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --network-concurrency=4 \
 && pnpm db:generate \
 && pnpm build --filter=@prioritizz/api

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
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --retries=10 \
  CMD wget -qO- http://localhost:3000/api/healthz || exit 1
CMD ["node", "apps/api/dist/main.js"]
