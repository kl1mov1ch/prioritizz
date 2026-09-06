# CI

GitHub Actions workflow: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml).

Pipeline (on push to `main`/`develop` and every PR):

1. `pnpm install --frozen-lockfile`
2. `pnpm db:generate` (Prisma client)
3. `pnpm format:check`
4. `pnpm lint`
5. `pnpm typecheck`
6. `pnpm db:deploy` (migrations against a throwaway Postgres service)
7. `pnpm test` (Vitest unit + integration)
8. `pnpm build` (Turborepo, cached)

Add later: `pnpm test:e2e` (Playwright), Docker image build & push, Trivy scan,
`prisma migrate diff` drift check.
