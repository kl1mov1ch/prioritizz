# Live black-box run — 2026-09-10T20:11:20.506Z
Target: `http://localhost:3000/api`

| Verdict | Severity | Check | Expected | Got | Note |
|---|---|---|---|---|---|
| ✅ | CRITICAL | no-auth /v1/me | 401 | 401 | body: {"code":"AUTH_TOKEN_INVALID","message":"Missing bearer token"} |
| ✅ | CRITICAL | no-auth /v1/me/wallet | 401 | 401 | body: {"code":"AUTH_TOKEN_INVALID","message":"Missing bearer token"} |
| ✅ | CRITICAL | no-auth /v1/me/notifications | 401 | 401 | body: {"code":"AUTH_TOKEN_INVALID","message":"Missing bearer token"} |
| ✅ | CRITICAL | no-auth /v1/orders | 401 | 401 | body: {"code":"AUTH_TOKEN_INVALID","message":"Missing bearer token"} |
| ✅ | CRITICAL | no-auth /v1/me/payouts | 401 | 401 | body: {"code":"AUTH_TOKEN_INVALID","message":"Missing bearer token"} |
| ✅ | CRITICAL | no-auth /v1/auth/sessions | 401 | 401 | body: {"code":"AUTH_TOKEN_INVALID","message":"Missing bearer token"} |
| ✅ | CRITICAL | no-auth /v1/admin/dashboard | 401 | 401 | body: {"code":"AUTH_TOKEN_INVALID","message":"Missing bearer token"} |
| ✅ | CRITICAL | no-auth /v1/admin/users | 401 | 401 | body: {"code":"AUTH_TOKEN_INVALID","message":"Missing bearer token"} |
| ✅ | CRITICAL | no-auth /v1/admin/audit-logs | 401 | 401 | body: {"code":"AUTH_TOKEN_INVALID","message":"Missing bearer token"} |
| ✅ | CRITICAL | no-auth /v1/admin/feature-flags | 401 | 401 | body: {"code":"AUTH_TOKEN_INVALID","message":"Missing bearer token"} |
| ✅ | CRITICAL | no-auth /v1/admin/payouts | 401 | 401 | body: {"code":"AUTH_TOKEN_INVALID","message":"Missing bearer token"} |
| ✅ | CRITICAL | no-auth /v1/admin/disputes | 401 | 401 | body: {"code":"AUTH_TOKEN_INVALID","message":"Missing bearer token"} |
| ✅ | HIGH | forged token "Bearer ..." | (predicate) | 401 | {"code":"AUTH_TOKEN_INVALID","message":"Missing bearer token"} |
| ✅ | HIGH | forged token "Bearer null..." | (predicate) | 401 | {"code":"AUTH_TOKEN_EXPIRED","message":"Access token invalid or expired"} |
| ✅ | HIGH | forged token "Bearer eyJhbGciOiJub25lI..." | (predicate) | 401 | {"code":"AUTH_TOKEN_EXPIRED","message":"Access token invalid or expired"} |
| ✅ | HIGH | forged token "Bearer ../../etc/passwd..." | (predicate) | 401 | {"code":"AUTH_TOKEN_EXPIRED","message":"Access token invalid or expired"} |
| ✅ | HIGH | forged token "Basic YWRtaW46YWRtaW4=..." | (predicate) | 401 | {"code":"AUTH_TOKEN_INVALID","message":"Missing bearer token"} |
| ✅ | MEDIUM | malformed JSON body | (predicate) | 400 | {"code":"INTERNAL","message":"Expected property name or '}' in JSON at position 1 (line 1 column 2)"} |
| ✅ | MEDIUM | type-confused initData | (predicate) | 422 | {"code":"VALIDATION_FAILED","message":"Request validation failed","details":{"formErrors":[],"fieldErrors":{"initData":["Expected string, received number"]}}} |
| ✅ | LOW | huge refreshToken | (predicate) | 401 | {"code":"AUTH_SESSION_REVOKED","message":"Refresh token invalid"} |
| ✅ | CRITICAL | payment webhook secret=none | (predicate) | 400 | {"code":"PAYMENT_WEBHOOK_SIGNATURE_INVALID","message":"bad secret"} |
| ✅ | CRITICAL | payment webhook secret=wrong | (predicate) | 400 | {"code":"PAYMENT_WEBHOOK_SIGNATURE_INVALID","message":"bad secret"} |
| ✅ | CRITICAL | payment webhook secret=dev_webhook_secret_change_me | (predicate) | 400 | {"code":"PAYMENT_WEBHOOK_SIGNATURE_INVALID","message":"bad secret"} |
| ⚠️ | MEDIUM | throttler bypass via XFF rotation (200 req) | (predicate) | 200 ok / 0 x429 | if 0 x429, the per-IP limiter trusts a spoofable client header |
| ✅ | INFO | throttler active on a single IP (200 req / <60s) | (predicate) | 81 x429 | baseline: limit is 120/60s |
| ✅ | MEDIUM | CORS reflects arbitrary Origin | (predicate) | (none) | with credentials:true a reflected/`*` ACAO is exploitable |
| ✅ | LOW | swagger surface /api/docs | (predicate) | 404 | exposed only when NODE_ENV!=production |
| ✅ | LOW | swagger surface /api/docs-json | (predicate) | 404 | exposed only when NODE_ENV!=production |
| ✅ | LOW | swagger surface /api | (predicate) | 404 | exposed only when NODE_ENV!=production |
| ✅ | HIGH | GET payment intent w/o auth | (predicate) | 401 | {"code":"AUTH_TOKEN_INVALID","message":"Missing bearer token"} |

**1 checks need review, 29 OK, of 30.**