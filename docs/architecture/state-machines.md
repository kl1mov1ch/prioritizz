# State Machines

Определения переходов — [`packages/constants/src/state-machines.ts`](../../packages/constants/src/state-machines.ts).
Применение — только доменные сервисы (`OrderStateMachine`, `EscrowStateMachine`, …).
Каждый переход: валидация → optimistic-lock bump → `OrderEvent`/audit → `OutboxEvent`.

## Order

```
DRAFT ─▶ PENDING_PAYMENT ─▶ PAID ─▶ IN_ESCROW ─▶ IN_PROGRESS ─▶ DELIVERED ─▶ COMPLETED
  │            │              │         │             │             │
  ▼            ▼              ▼         ├────────────▶ DISPUTED ◀────┤
CANCELED    EXPIRED       REFUNDED      ▼             │
                          CHARGEBACK   REFUNDED   RESOLVED*→ COMPLETED / REFUNDED /
                                                            PARTIALLY_REFUNDED
```

## Payment

```
REQUIRES_PAYMENT ─▶ PROCESSING ─▶ SUCCEEDED ─▶ {REFUNDED | PARTIALLY_REFUNDED | CHARGEBACK}
        │                │
        ▼                ▼
     CANCELED          FAILED ─▶ REQUIRES_PAYMENT (retry)
```

## Escrow

```
NONE ─▶ HELD ─▶ RELEASE_PENDING ─▶ RELEASED
          │  ├─▶ REFUND_PENDING  ─▶ REFUNDED
          │  ├─▶ SPLIT ─▶ {RELEASED | REFUNDED}
          │  └─▶ FROZEN ─▶ {RELEASE_PENDING | REFUND_PENDING | SPLIT}
```

## Dispute

```
OPEN ─▶ {AWAITING_BUYER | AWAITING_SELLER} ─▶ UNDER_REVIEW ─▶
        {RESOLVED_RELEASE | RESOLVED_REFUND | RESOLVED_SPLIT | REJECTED}
OPEN/AWAITING_* ─▶ CANCELED
```

## Payout

```
REQUESTED ─▶ APPROVED ─▶ PROCESSING ─▶ PAID
    │           │            │
    ▼           ▼            ▼
 REJECTED    CANCELED      FAILED ─▶ {PROCESSING | CANCELED}
```

## Subscription

```
TRIALING ─▶ ACTIVE ⇄ PAST_DUE ─▶ {CANCELED | EXPIRED}
   {CANCELED | EXPIRED} ─▶ ACTIVE   (reactivation)
```

## Cron / delayed jobs

| Job                              | Очередь            | Триггер                             |
| -------------------------------- | ------------------ | ----------------------------------- |
| `escrow.auto-release`            | `escrow-timers`    | delayed до `Order.autoReleaseAt`    |
| `order.payment-expire`           | `escrow-timers`    | delayed до `Order.paymentExpiresAt` |
| `dispute.sla-escalate`           | `disputes-sla`     | delayed до `Dispute.slaDueAt`       |
| `subscription.renew` / `.expire` | `subscriptions`    | cron ежечасно                       |
| `outbox.flush`                   | `outbox-dispatch`  | cron каждые 5s                      |
| `analytics.daily`                | `analytics-rollup` | cron 00:10                          |
