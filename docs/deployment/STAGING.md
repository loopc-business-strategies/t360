# Staging / Go-Live Kit — t360

Operator guide for secret-gated deploys. Workflow: [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml).

## Prerequisites

1. Railway project **`t360`** with Postgres, Redis, **api** + **worker** services (Dockerfile `apps/api/Dockerfile`; worker CMD `node dist/src/worker.js`). See [railway.toml](../../railway.toml).
2. Two Vercel projects: customer **web** and **admin** (see `apps/web/vercel.json`, `apps/admin/vercel.json`).
3. GitHub repo Environments: **`staging`** and **`production`** (Settings → Environments). Enable **required reviewers** on `production`.

## Secrets (repository or environment)

| Secret | Purpose |
|--------|---------|
| `VERCEL_TOKEN` | Vercel deploy token |
| `VERCEL_ORG_ID` | Vercel team/org id |
| `VERCEL_PROJECT_ID_WEB` | Web project id |
| `VERCEL_PROJECT_ID_ADMIN` | Admin project id |
| `RAILWAY_TOKEN` | Railway API token |
| `RAILWAY_API_SERVICE` | Railway api service name or id |
| `RAILWAY_WORKER_SERVICE` | Railway worker service name or id |

If `VERCEL_TOKEN` or `RAILWAY_TOKEN` is missing, deploy jobs **skip** (exit success) so default CI stays green.

## Variables (GitHub Environment / repo vars)

| Variable | Purpose |
|----------|---------|
| `STAGING_API_BASE` | e.g. `https://api-staging.example.com/api/v1` — post-deploy smoke |
| `PROD_API_BASE` | Production API base for smoke |
| `PLAYWRIGHT_BASE_URL` / `PLAYWRIGHT_ADMIN_URL` | Optional E2E in CI |

## Triggers

| Target | How |
|--------|-----|
| Staging | Push to `main`/`master`, or Actions → **Deploy** → `workflow_dispatch` → target `staging` |
| Production | Actions → **Deploy** → target `production` only (manual approval via Environment) |

## App env on platforms

Configure Railway/Vercel env vars per [ENV.md](./ENV.md). Before cutover:

```bash
pnpm preflight:env -- --profile staging --file .env.staging
pnpm preflight:env -- --profile production --file .env.production
```

Never commit those files. Production profile fails if providers are `mock` unless `ALLOW_MOCK_PROVIDERS=1`.

## After deploy

```bash
API_BASE="$STAGING_API_BASE" bash scripts/launch/smoke.sh
# Windows:
# $env:API_BASE = $env:STAGING_API_BASE; .\scripts\launch\smoke.ps1
```

Then continue [GO-LIVE.md](../launch/GO-LIVE.md) / [CUTOVER.md](../launch/CUTOVER.md).

## Local link (optional)

Operators may also deploy from a linked machine:

```bash
# Railway CLI logged in / RAILWAY_TOKEN set
railway up --service <api> --detach
```

Prefer GitHub Actions once secrets are set so deploys are auditable.
