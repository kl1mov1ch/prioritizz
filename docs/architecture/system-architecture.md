# System Architecture

## Процессы

| Процесс             | Технология                 | Роль                                             |
| ------------------- | -------------------------- | ------------------------------------------------ |
| `apps/api` (http)   | NestJS                     | REST API `/api/v1`, OpenAPI, guards/interceptors |
| `apps/api` (worker) | NestJS (`APP_MODE=worker`) | BullMQ processors, cron                          |
| `apps/bot`          | NestJS + Telegraf          | Telegram webhook, invoices, gift delivery, push  |
| `apps/mini-app`     | React/Vite (nginx)         | клиент Mini App                                  |
| `apps/admin`        | React/Vite (nginx)         | админ-панель                                     |
| PostgreSQL          | 16                         | source of truth                                  |
| Redis               | 7                          | очереди, кэш, rate-limit                         |
| S3/MinIO            | —                          | media, вложения споров/тикетов                   |

## Слои backend

```
HTTP → Guard(JwtAuth) → Guard(Roles) → Interceptor(Idempotency) →
Controller (Zod DTO) → Service (domain) → StateMachine + Ledger + Outbox →
Prisma ($transaction) → PostgreSQL
                                   �“outbox row”→ QUEUE(outbox-dispatch) → EventBus
```

- **Guards**: `JwtAuthGuard` (глобальный, `@Public()` для исключений),
  `RolesGuard` (`@Roles()`, `@AdminOnly()`).
- **Idempotency**: `@Idempotent(scope)` + `IdempotencyInterceptor` → таблица `IdempotencyKey`.
- **TransformInterceptor**: BigInt/Decimal → строки в ответах.
- **AllExceptionsFilter**: единая error-taxonomy `{ code, message, details?, traceId }`.
- **Outbox**: события пишутся в `OutboxEvent` в той же транзакции, воркер публикует.

## Гарантийная механика без внешнего escrow

PSP не даёт настоящий escrow → строим на внутреннем **double-entry ledger**:

| Счёт                        | Тип           | Смысл                              |
| --------------------------- | ------------- | ---------------------------------- |
| `PSP_CLEARING`              | платформенный | деньги «в пути» у PSP              |
| `ESCROW_HOLD` (per order)   | order-scoped  | удержание по конкретному заказу    |
| `USER_PENDING` (per seller) | user-scoped   | заработано, но ещё нельзя выводить |
| `USER_AVAILABLE` (per user) | user-scoped   | доступно к выводу                  |
| `PLATFORM_REVENUE`          | платформенный | собранные комиссии                 |

Каждая проводка (`LedgerService.post`) балансируется: `Σ CREDIT == Σ DEBIT`,
иначе `LEDGER_UNBALANCED`. Балансы материализуются в `LedgerAccount.balance`
в той же транзакции.

## Интеграции — адаптерный слой

```
PaymentProvider     { createIntent, capture, refund, verifyWebhook }
NotificationProvider { send(channel, template, payload) }
StorageProvider     { presignPut, presignGet, delete }
AnalyticsProvider   { track(event, props) }
WebhookDispatcher   { deliver(endpoint, event, payload) with HMAC }
```

Реализации регистрируются в `IntegrationsModule`; выбор — по env
(`PAYMENT_PROVIDERS`, ...). Ни один домен-модуль не импортирует конкретный SDK.

## Безопасность

initData HMAC verify · JWT rotating refresh · RBAC · helmet secure headers ·
throttler · webhook signature verify · presigned-only uploads с mime/size лимитами ·
audit log для admin-действий · session/device tracking · idempotency против
дублей callback'ов · replay-защита через `auth_date` и `providerRef` unique.
