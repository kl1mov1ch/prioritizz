# syntax=docker/dockerfile:1
# Build arg APP selects which frontend to build: mini-app | admin
ARG APP=mini-app

FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS build
ARG APP
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* .npmrc turbo.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/${APP}/package.json ./apps/${APP}/package.json
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @prioritizz/${APP} build

FROM nginx:1.27-alpine AS runtime
ARG APP
COPY infra/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/${APP}/dist /usr/share/nginx/html
EXPOSE 80
