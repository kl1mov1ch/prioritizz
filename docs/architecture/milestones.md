# Implementation Milestones

| M       | Название           | Содержание                                                                                                                                             | Definition of Done                                                           |
| ------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| **M0**  | Foundation         | monorepo, configs, shared packages, prisma draft, скелеты api/admin/mini-app, docker-compose, CI                                                       | `pnpm i && pnpm build` зелёный; `docker compose up` поднимает pg/redis/minio |
| **M1**  | Auth & Identity    | initData verify, JWT+rotating refresh, sessions/devices, RBAC guards, admin login (allowlist), users module                                            | Mini App логинится по initData; admin по allowlist; e2e auth-тест            |
| **M2**  | Catalog            | Category tree CRUD, Service CRUD + variants, поиск/фильтр/пагинация/сортировка, авто- и ручная модерация                                               | Оффер: draft → review → publish; каталог с фильтрами в Mini App              |
| **M3**  | Money core         | `LedgerService` (double-entry), `CommissionEngine`, `IdempotencyKey`, `PaymentProviderRegistry` + Telegram Stars adapter, webhook verify               | Оплата тест-заказа → проводки сходятся к 0; повторный callback игнорируется  |
| **M4**  | Order & Escrow     | `OrderStateMachine`, `EscrowStateMachine`, hold/deliver/release/refund, auto-release cron, order timeline + chat                                       | Полный happy-path; auto-release по таймеру; частичный refund                 |
| **M5**  | Disputes & Reviews | Dispute flow + SLA jobs, сообщения (вкл. internal), резолюция release/refund/split, reviews + rating aggregation                                       | Спор блокирует auto-release; резолюция создаёт корректные проводки           |
| **M6**  | Payouts            | payout request, `PayoutStateMachine`, batch-обработка, provider payout adapter, admin approval, payout-delay                                           | Продавец выводит доступный баланс; ledger отражает вывод                     |
| **M7**  | Subscriptions      | планы BUYER/SELLER, renewal/expire cron, perks → комиссия/лимиты/placement                                                                             | Premium seller автоматически получает пониженную комиссию                    |
| **M8**  | Admin panel        | dashboard-метрики, server-side таблицы, модерация, disputes, payouts, commissions, categories, feature flags, audit viewer, anti-fraud ручные операции | Все CRUD из ТЗ под RBAC                                                      |
| **M9**  | Mini App UX        | каталог/оффер/checkout/статус/чат/профиль/история/уведомления/поддержка/отзывы, Telegram UX (MainButton, haptics, theme)                               | Полный пользовательский путь на мобильном                                    |
| **M10** | Hardening          | rate limits, secure headers, anti-fraud checks, webhook signing, replay-защита, нагрузочный тест, полнота OpenAPI, e2e-набор, k8s-манифесты            | Security review + нагрузочный прогон пройдены                                |

## Порядок работ внутри M1 (следующий шаг)

1. `prisma migrate dev --name init` + `pnpm db:seed`.
2. E2E: мок `initData` (подпись тем же `TELEGRAM_BOT_TOKEN`) → `POST /auth/telegram` → 200 + пара токенов.
3. `JwtAuthGuard` happy/expired/revoked-session тесты.
4. Refresh-rotation тест (старый refresh невалиден после ротации).
5. Admin allowlist тест (не в списке → `AUTH_ADMIN_NOT_ALLOWLISTED`).
