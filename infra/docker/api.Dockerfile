# syntax=docker/dockerfile:1
FROM node:20-alpine AS build
RUN corepack enable && apk add --no-cache openssl
WORKDIR /app
COPY . .
# Full turbo build: shared packages first, then the api (nest build).
RUN pnpm install --frozen-lockfile \
 && pnpm db:generate \
 && pnpm build --filter=@prioritizz/api

FROM node:20-alpine AS runtime
RUN corepack enable && apk add --no-cache openssl wget
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
