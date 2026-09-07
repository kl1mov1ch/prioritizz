# syntax=docker/dockerfile:1
FROM node:20-alpine
RUN corepack enable && apk add --no-cache openssl
WORKDIR /app
COPY . .
# Bot runs its TS entrypoint via tsx; it needs @prioritizz/config + constants built.
RUN pnpm install --frozen-lockfile \
 && pnpm build --filter=@prioritizz/config --filter=@prioritizz/constants
ENV NODE_ENV=production
CMD ["pnpm", "--filter", "@prioritizz/bot", "start"]
