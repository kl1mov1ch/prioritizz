# Deploy to a bare VPS (no domain, valid HTTPS)

Everything runs in Docker on one box. HTTPS comes from Let's Encrypt via
`<ip>.sslip.io` (public wildcard DNS that resolves to your server), so
Telegram's WebView accepts the cert — a self-signed cert on a raw IP would be
rejected.

## Steps

1. **Get the tarball onto the server.** From your machine:

   ```bash
   scp prioritizz.tar.gz root@185.195.24.236:~
   ```

   or upload it through your host's file manager / web console.

2. **Extract and run** (as `root`):

   ```bash
   mkdir -p /var/www/prioritizz && cd /var/www/prioritizz
   tar xzf ~/prioritizz.tar.gz
   bash infra/deploy/deploy.sh
   ```

   First run installs Docker if missing, builds the images (~8–15 min on a
   5-core box), starts the stack, waits for the TLS cert, and points the bot's
   menu button at the Mini App.

   The tarball already ships a filled `.env` (bot token, login-widget secret,
   admin allowlist, generated DB/JWT secrets). To change anything, edit
   `/var/www/prioritizz/.env` and re-run the script.

## What you get

|                        | URL                                      |
| ---------------------- | ---------------------------------------- |
| Mini App / public site | `https://185.195.24.236.sslip.io`        |
| Admin panel            | `https://admin.185.195.24.236.sslip.io`  |
| API                    | `https://185.195.24.236.sslip.io/api/v1` |

- **In Telegram:** open `@prioritizz_bot` → tap the menu button (or `/start`).
- **Admin Login Widget:** in **@BotFather** run `/setdomain` → `@prioritizz_bot`
  → `admin.185.195.24.236.sslip.io`. (Or use the "paste initData" fallback on
  the admin login page.)

## Manage

```bash
cd /var/www/prioritizz
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f api bot caddy
docker compose -f docker-compose.prod.yml restart api
docker compose -f docker-compose.prod.yml down          # stop everything
```

## Stack

`caddy` (TLS + static + reverse proxy) · `api` (NestJS) · `worker` (BullMQ) ·
`bot` (Telegraf long-poll) · `postgres` · `redis` · `minio`. `migrate` runs
`prisma migrate deploy` once before `api` starts. All long-running services are
`restart: unless-stopped`, so they survive a reboot.

## Notes

- Ports 80 and 443 must be reachable from the internet for the ACME challenge.
  The script opens them in `ufw` if it's active; check your provider's firewall
  too.
- `sslip.io` is a free public service. For a real domain later, point an A
  record at the IP and set `PUBLIC_HOST` / `ADMIN_HOST` in `.env`.
- The bot uses long-polling — no inbound webhook needed.
