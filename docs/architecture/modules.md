# NestJS Module Breakdown

| Module                | Ключевые провайдеры                                                                                                                | Основные эндпоинты                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `AuthModule`          | `TelegramInitDataService`, `TokenService`, `AuthService`                                                                           | `POST /auth/telegram`, `/auth/admin/login`, `/auth/refresh`, `/auth/logout`, `GET /auth/sessions` |
| `UsersModule`         | `UsersService`                                                                                                                     | `GET/PATCH /me`, `GET /me/wallet`, `POST /me/seller`                                              |
| `SellersModule`       | `SellerContext` (+ seller dashboard в M2)                                                                                          | `GET /seller/*`                                                                                   |
| `CatalogModule`       | `CatalogService`, `ModerationService`                                                                                              | `GET /categories`, `GET /services`, `GET /services/:id`, `POST/PUT /seller/services`              |
| `OrdersModule`        | `OrdersService`, `OrderStateMachine`                                                                                               | `GET/POST /orders`, `/orders/:id/{cancel,deliver,confirm,events,messages}`                        |
| `PaymentsModule`      | `PaymentsService`, `PaymentProviderRegistry`                                                                                       | `POST /payments/intents`, `GET /payments/intents/:id`, webhook в `WebhooksModule`                 |
| `EscrowModule`        | `EscrowService`, `EscrowStateMachine`                                                                                              | внутренний + `escrow-timers` processor                                                            |
| `LedgerModule`        | `LedgerService` (global)                                                                                                           | — (используется другими)                                                                          |
| `CommissionsModule`   | `CommissionEngine`                                                                                                                 | `GET /admin/commission-rules`, `POST/PUT /admin/commission-rules`                                 |
| `PayoutsModule`       | `PayoutsService`, `PayoutStateMachine`                                                                                             | `GET /me/payouts`, `POST /payouts`, `POST /admin/payouts/:id/decision`                            |
| `DisputesModule`      | `DisputesService`, `DisputeStateMachine`                                                                                           | `POST /disputes`, `/disputes/:id/messages`, `/admin/disputes/:id/resolve`                         |
| `SubscriptionsModule` | `SubscriptionsService`                                                                                                             | `GET /subscription-plans`, `POST /subscriptions`, `/subscriptions/:id/cancel`                     |
| `NotificationsModule` | `NotificationService` + provider adapters                                                                                          | `notifications` processor                                                                         |
| `FilesModule`         | `StorageService`                                                                                                                   | `POST /files/presign`, `POST /files/:id/confirm`                                                  |
| `SupportModule`       | `SupportService`                                                                                                                   | `GET/POST /support/tickets`, `/support/tickets/:id/messages`                                      |
| `AnalyticsModule`     | `AnalyticsService`                                                                                                                 | `GET /admin/dashboard`, `analytics-rollup` processor                                              |
| `AdminModule`         | `AdminService`                                                                                                                     | агрегирующие `/admin/*`, feature flags, ручные финоперации                                        |
| `AuditModule`         | `AuditService`, `AuditInterceptor`                                                                                                 | `GET /admin/audit-logs`                                                                           |
| `WebhooksModule`      | `WebhookVerifier`, `WebhookDispatcher`                                                                                             | `POST /webhooks/:provider` (raw body, signature verify)                                           |
| `IntegrationsModule`  | provider registries                                                                                                                | —                                                                                                 |
| `HealthModule`        | terminus                                                                                                                           | `GET /healthz`, `GET /readyz`                                                                     |
| Infra                 | `PrismaModule` (global), `RedisModule` (global), `QueueModule` (global), `CommonModule` (global: guards/interceptors/audit/outbox) | —                                                                                                 |

## Правила

- Один источник контрактов — `@prioritizz/schemas` (Zod). DTO-классы через
  `createZodDto(schema)`; валидация — `ZodValidationPipe`.
- Никаких «сырых» `prisma.model.update({ data: { status } })` — только через
  соответствующую state machine.
- Финансовые операции — внутри `prisma.$transaction`, вместе с ledger-проводками,
  audit и outbox-событием.
- Все критические мутации помечаются `@Idempotent(scope)`.
