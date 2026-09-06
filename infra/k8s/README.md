# Kubernetes manifests (placeholder)

Filled in M10. Planned shape:

- `namespace.yaml`
- `api-deployment.yaml` + `api-service.yaml` + `api-hpa.yaml` (HTTP, replicas ≥ 2)
- `worker-deployment.yaml` (`APP_MODE=worker`, no service)
- `bot-deployment.yaml` (single replica, webhook ingress)
- `mini-app` / `admin` as static bundles behind an ingress / CDN
- `ingress.yaml` (TLS, `api.prioritizz.app`, `app.prioritizz.app`, `admin.prioritizz.app`)
- `externalsecrets.yaml` (pull JWT/PSP/Telegram secrets from the vault)
- `configmap.yaml` (non-secret env)
- `migrate-job.yaml` (`prisma migrate deploy` as a pre-deploy Job)

Probes: `GET /api/healthz` (liveness), `GET /api/readyz` (readiness, checks DB).
