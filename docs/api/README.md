# API Conventions

- Base: `/{API_GLOBAL_PREFIX}/v1` → `/api/v1`. Версия в пути.
- Auth: `Authorization: Bearer <accessToken>`. `@Public()` — исключения.
- Идемпотентность: `Idempotency-Key: <uuid>` обязателен для `POST /orders`,
  `POST /payments/intents`, `POST /disputes`, `POST /subscriptions`, `POST /payouts`.
- Ошибки: `{ "code": "STABLE_CODE", "message": "...", "details"?: any, "traceId"?: "..." }`.
  Коды — [`packages/constants/src/errors.ts`](../../packages/constants/src/errors.ts).
- Пагинация (query): `page` (1..), `pageSize` (1..100), `sort` (`field:asc|desc`), `q`.
  Ответ: `{ items, page, pageSize, total, totalPages }`.
- Деньги — строки (`"150.0000"`), плюс `currency`.
- Даты — ISO-8601 UTC.

## Основные ресурсы

| Область        | Метод / путь                                                                                                                                                                                                                                                                                                                            |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| auth           | `POST /auth/telegram`, `POST /auth/admin/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/sessions`                                                                                                                                                                                                                        |
| me             | `GET /me`, `PATCH /me`, `GET /me/wallet`, `POST /me/seller`, `GET /me/payouts`, `GET /me/subscriptions`                                                                                                                                                                                                                                 |
| catalog        | `GET /categories`, `GET /services`, `GET /services/:idOrSlug`                                                                                                                                                                                                                                                                           |
| seller catalog | `POST /seller/services`, `PUT /seller/services/:id`, `POST /seller/services/:id/{submit,pause}`                                                                                                                                                                                                                                         |
| orders         | `GET /orders`, `POST /orders`, `GET /orders/:id`, `GET /orders/:id/events`, `POST /orders/:id/{cancel,deliver,confirm,messages}`                                                                                                                                                                                                        |
| payments       | `POST /payments/intents`, `GET /payments/intents/:id`                                                                                                                                                                                                                                                                                   |
| disputes       | `POST /disputes`, `GET /disputes/:id`, `POST /disputes/:id/messages`                                                                                                                                                                                                                                                                    |
| subscriptions  | `GET /subscription-plans`, `POST /subscriptions`, `POST /subscriptions/:id/cancel`                                                                                                                                                                                                                                                      |
| payouts        | `POST /payouts`                                                                                                                                                                                                                                                                                                                         |
| files          | `POST /files/presign`, `POST /files/:id/confirm`                                                                                                                                                                                                                                                                                        |
| support        | `GET/POST /support/tickets`, `POST /support/tickets/:id/messages`                                                                                                                                                                                                                                                                       |
| webhooks       | `POST /webhooks/:provider` (raw body)                                                                                                                                                                                                                                                                                                   |
| admin          | `GET /admin/dashboard`, `GET /admin/users`, `POST /admin/services/:id/moderate`, `GET /admin/disputes`, `POST /admin/disputes/:id/resolve`, `GET /admin/payouts`, `POST /admin/payouts/:id/decision`, `GET/POST/PUT /admin/commission-rules`, `GET/POST/PUT /admin/categories`, `GET /admin/audit-logs`, `GET/PUT /admin/feature-flags` |

Swagger UI (dev): `GET /api/docs`.
