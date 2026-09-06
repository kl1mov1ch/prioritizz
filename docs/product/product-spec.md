# Prioritizz — Product Spec (v0.1)

## Что это

Платформа-гарант (escrow marketplace) внутри Telegram Mini App для перепродажи
цифровых и интернет-услуг: подписки, Telegram-подарки, цифровые товары, услуги
с ручным/авто-исполнением, пополнения.

## Роли

| Роль                   | Может                                                                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Buyer**              | искать услуги, покупать с гарантией, отслеживать сделку, открывать спор, оставлять отзыв, оформлять Buyer Plus                            |
| **Seller**             | создавать/редактировать офферы, задавать цену/сроки/условия/комиссии-оверрайды, исполнять заказы, выводить средства, оформлять Seller Pro |
| **Support**            | тикеты, чтение аудита                                                                                                                     |
| **Moderator**          | модерация офферов, разбор споров                                                                                                          |
| **Admin / Superadmin** | всё выше + пользователи, выплаты, комиссии, подписки, категории, feature flags, ручные финоперации                                        |

## Основной сценарий (happy path)

1. Buyer открывает Mini App → авторизация по `initData`.
2. Выбирает услугу → `POST /orders` (idempotent) → `PENDING_PAYMENT`.
3. Оплата через PSP-адаптер (Telegram Stars) → callback → `PAID` → средства в `PSP_CLEARING`.
4. Платформа переносит сумму в `ESCROW_HOLD` → `IN_ESCROW`.
5. Seller исполняет → `DELIVERED`, назначается `autoReleaseAt = now + 72h`.
6. Buyer подтверждает **или** срабатывает авто-релиз → `COMPLETED`:
   - комиссия → `PLATFORM_REVENUE`,
   - остаток → `USER_PENDING` продавца → через payout-delay в `USER_AVAILABLE`.
7. Seller запрашивает вывод → админ аппрув → `PAID`.

## Отклонения

- **Спор**: Buyer/Seller открывает `Dispute` до `COMPLETED` (или в окно X часов после).
  Блокирует авто-релиз. Модератор решает: `RELEASE` / `REFUND` / `SPLIT` / `REJECT`.
- **Возврат**: полный или частичный — обратные проводки из `ESCROW_HOLD` в `PSP_CLEARING`/`USER_AVAILABLE`.
- **Chargeback**: терминальный статус, ручной разбор, отрицательная корректировка баланса продавца.
- **Экспирация оплаты**: `PENDING_PAYMENT` + `paymentExpiresAt` прошло → `EXPIRED`.

## Комиссии

Движок правил (`CommissionEngine`), приоритет: `SELLER > PROMO > CATEGORY >
SERVICE_KIND > SELLER_TIER > GLOBAL`. Результат фиксируется в
`Order.commissionSnapshot` на момент создания заказа (immutable). Premium-план
продавца даёт `commissionDiscountBps`, вычитается из `percentBps`.

## Подписки

- **Seller Pro**: сниженная комиссия, featured-размещение, короче payout-delay.
- **Buyer Plus**: кэшбэк, приоритетная поддержка.

## Нефункциональные требования

- Деньги — только Decimal(20,4), в транзите — строки.
- Все статусные переходы — через backend state machines, с audit + domain event.
- Идемпотентность на всех платёжных и заказных мутациях.
- Верификация `initData`, JWT (access 15m / refresh 30d rotating), RBAC, rate limiting.
- OpenAPI-документация, structured logging с request id.
