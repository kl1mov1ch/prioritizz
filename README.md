# Prioritizz

Escrow-гарант маркетплейс для перепродажи цифровых и интернет-услуг внутри Telegram Mini App.

## Стек

pnpm + Turborepo · NestJS + Prisma + PostgreSQL · Redis + BullMQ · React + Vite + TS ·
Tailwind + shadcn/ui · Zod · TanStack Query · React Hook Form · Vitest + Playwright.

## Быстрый старт

```bash
cp .env.example .env
docker compose up -d postgres redis minio createbuckets mailpit
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev            # api :3000, mini-app :5173, admin :5174
```

OpenAPI: http://localhost:3000/api/docs · Mailpit: http://localhost:8025 · MinIO: http://localhost:9001

## Структура

| Путь                  | Назначение                                                |
| --------------------- | --------------------------------------------------------- |
| `apps/api`            | NestJS backend (HTTP + worker режимы через `APP_MODE`)    |
| `apps/bot`            | Telegram bot (Telegraf), webhook, invoices, gift delivery |
| `apps/mini-app`       | Telegram Mini App (React/Vite, mobile-first)              |
| `apps/admin`          | Админ-панель (React/Vite, RBAC)                           |
| `packages/schemas`    | Zod-схемы — единый источник правды для контрактов         |
| `packages/types`      | Типы, производные от схем                                 |
| `packages/constants`  | Enum'ы, статусы, коды ошибок, имена очередей              |
| `packages/api-client` | Типизированный API-клиент                                 |
| `packages/ui`         | Общие UI-компоненты + Tailwind preset                     |
| `packages/config`     | tsconfig / eslint / prettier / env schema                 |
| `prisma`              | Схема БД, миграции, seed                                  |
| `docs`                | Продуктовая и архитектурная документация                  |
| `infra`               | Docker, k8s, CI                                           |

## Документация

- [Product spec](docs/product/product-spec.md)
- [System architecture](docs/architecture/system-architecture.md)
- [Domain model](docs/architecture/domain-model.md)
- [State machines](docs/architecture/state-machines.md)
- [Modules](docs/architecture/modules.md)
- [Milestones](docs/architecture/milestones.md)
