# Staging / Go-Live Kit — t360

Operator guide for secret-gated deploys. Workflow: [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml).

## Prerequisites

1. Railway project **`t360`** with Postgres, Redis, **api** + **worker** services (Dockerfile `apps/api/Dockerfile`; worker CMD `node dist/src/worker.js`). See [railway.toml](../../railway.toml).
   - **api** `preDeployCommand` runs [`apps/api/scripts/predeploy-migrate.sh`](../../apps/api/scripts/predeploy-migrate.sh) (`/app/predeploy-migrate.sh` in the image), which resolves the Prisma CLI via the `database/` package (pnpm does not hoist it to repo-root `node_modules/.bin`).
   - **worker** must not set the same preDeploy (no HTTP migrate step; use [`railway.worker.toml`](../../railway.worker.toml)).
2. Two Vercel projects: customer **web** and **admin** (see `apps/web/vercel.json`, `apps/admin/vercel.json`).
3. GitHub repo Environments: **`staging`** and **`production`** (Settings → Environments). Enable **required reviewers** on `production`.

## Secrets (repository)

| Secret | Purpose |
|--------|---------|
| `VERCEL_TOKEN` | Vercel deploy token (Account → Settings → Tokens) |

If Actions fails with `token provided via --token argument is not valid`, create a new token and run:

```bash
gh secret set VERCEL_TOKEN -R loopc-business-strategies/t360
```

| `RAILWAY_TOKEN` | Railway **Account/Workspace** token (Account → Tokens). Workflow maps it to `RAILWAY_API_TOKEN` for the CLI. Do not use a Project token here unless you change the workflow to set `RAILWAY_TOKEN` instead. |

If `RAILWAY_TOKEN` is missing, staging push deploys **skip**. Staging/production **dispatch** that needs Vercel also requires `VERCEL_TOKEN`.

## Variables (repository)

| Variable | Purpose |
|----------|---------|
| `VERCEL_ORG_ID` | Vercel team/org id (e.g. `team_…`) |
| `VERCEL_PROJECT_ID_WEB` | `t360-web` project id (`prj_…`) |
| `VERCEL_PROJECT_ID_ADMIN` | `t360-admin` project id (`prj_…`) |
| `RAILWAY_PROJECT_ID` | Railway project id for `t360` |
| `RAILWAY_API_SERVICE` | Railway api service name (e.g. `api`) |
| `RAILWAY_WORKER_SERVICE` | Railway worker service name (e.g. `worker`) |
| `STAGING_API_BASE` | e.g. `https://api-staging-7912.up.railway.app/api/v1` — post-deploy smoke |
| `PROD_API_BASE` | Production API base for smoke |
| `PLAYWRIGHT_BASE_URL` / `PLAYWRIGHT_ADMIN_URL` | Optional E2E in CI |

Do **not** put ORG/PROJECT IDs or Railway service names in Actions **secrets** — [`deploy.yml`](../../.github/workflows/deploy.yml) reads them from `vars.*`.

Canonical Vercel apps: **`t360-web`** and **`t360-admin`** (Git-linked to this repo). Do not create a generic project named `web`.

## Triggers

| Target | How |
|--------|-----|
| Staging (push) | Push to `main`/`master` → **Railway api + worker only** (no Vercel CLI; conserves free-tier deploy quota) |
| Staging (manual) | Actions → **Deploy** → `workflow_dispatch` → target `staging` → Vercel preview (web+admin) + Railway |
| Production | Actions → **Deploy** → target `production`, optional **deploy_scope** (`web-only`, `web-and-railway`, `railway-only`, etc.) |

### Vercel free-tier deploy quota

Hobby accounts cap at **~100 deployments / 24 hours** (`api-deployments-free-per-day`). Every Actions CLI deploy and every Vercel Git auto-deploy counts toward that limit.

Mitigations in [`deploy.yml`](../../.github/workflows/deploy.yml):

- Push to `main` does **not** run Vercel CLI (Railway staging only).
- Vercel deploy steps **soft-fail** on the quota error and still run Railway / remaining scopes.
- Prefer production `deploy_scope: web-and-railway` (or `web-only`) instead of `all` when admin is unchanged.

After a quota window resets:

```bash
gh workflow run deploy.yml -f target=production -f deploy_scope=web-and-railway
```

If Vercel projects are also **Git-linked**, disable duplicate auto-deploy in the Vercel dashboard when Actions is the source of truth—otherwise Git pushes still burn quota outside Actions.

## Orphan Vercel project cleanup

Use **only** these Vercel project names for this repo:

| Project | Root Directory | Production URL |
|---------|----------------|----------------|
| `t360-web` | `apps/web` | https://t360-web.vercel.app |
| `t360-admin` | `apps/admin` | https://t360-admin.vercel.app |

**Do not** create a generic project named `web`. Running `npx vercel deploy --cwd apps/web` locally creates an orphan project with Root Directory `.` (repo root), which fails with “No Next.js version detected” and burns deploy quota on every Git push if connected.

If an orphan exists:

1. Vercel → project **Settings → Git** → **Disconnect** `loopc-business-strategies/t360`
2. Confirm no custom domains point only to that project
3. Copy any unique env vars to `t360-web` / `t360-admin` if needed
4. **Settings → General → Delete Project**

Or via CLI (non-interactive): `echo y | npx vercel project rm web --non-interactive`

GitHub Actions and repo vars (`VERCEL_PROJECT_ID_WEB`, `VERCEL_PROJECT_ID_ADMIN`) must always reference `t360-web` and `t360-admin` — never the orphan.

## App env on platforms

Configure Railway/Vercel env vars per [ENV.md](./ENV.md). Before cutover:

```bash
pnpm preflight:env -- --profile staging --file .env.staging
pnpm preflight:env -- --profile production --file .env.production
```

Admin session persistence (web localStorage + mobile refresh): see [ADMIN-SESSION.md](./ADMIN-SESSION.md).

Never commit those files. Production profile fails if providers are `mock` unless `ALLOW_MOCK_PROVIDERS=1`.

## After deploy

```bash
API_BASE="$STAGING_API_BASE" bash scripts/launch/smoke.sh
# Windows:
# $env:API_BASE = $env:STAGING_API_BASE; .\scripts\launch\smoke.ps1
```

Then continue [GO-LIVE.md](../launch/GO-LIVE.md) / [CUTOVER.md](../launch/CUTOVER.md).

## Chrome “Dangerous site” / Google Safe Browsing

If mobile Chrome shows a red **Dangerous site** interstitial on `*.vercel.app` (or a custom domain), that is **Google Safe Browsing**, not a Vercel outage. Code redeploys alone do not clear the flag — an operator must request a review after the site is clean.

### Checklist

1. Confirm status: [Safe Browsing site status](https://transparencyreport.google.com/safe-browsing/search) for the exact URL (e.g. `https://t360-web.vercel.app`).
2. Google Search Console → add a **URL-prefix** property for that origin (e.g. `https://t360-web.vercel.app/`) → verify ownership (HTML tag or file upload works well on Vercel).
3. Open **Security & Manual Actions → Security issues**. Note the category and any sample URLs.
4. Ensure storefront copy is clearly branded (THARAGAI customer OTP login, privacy/terms links) and redeploy web if you just hardened trust signals.
5. Click **Request a review**. Example text:

   > This is the legitimate THARAGAI Readymades ecommerce storefront (Pudukkottai) hosted on Vercel. Customer sign-in uses mobile OTP for our own account pages only. There is no malware, phishing of third-party brands, or unwanted software. We believe this is a false positive on a new `*.vercel.app` host.

6. Optional parallel report: [Safe Browsing error report](https://safebrowsing.google.com/safebrowsing/report_error/) → “I believe this isn’t a safety threat”.
7. Expect **24–72 hours**. The interstitial clears after Google approves the review.

### Longer-term

Attach a **custom domain** in Vercel (when DNS is ready) so reputation is not shared with other `*.vercel.app` projects, then verify that domain in Search Console and repeat the review if needed.

Full operator runbook: [SAFE-BROWSING.md](./SAFE-BROWSING.md).

## Local link (optional)

Operators may also deploy from a linked machine:

```bash
# Railway CLI logged in / RAILWAY_TOKEN set
railway up --service <api> --detach
```

Prefer GitHub Actions once secrets are set so deploys are auditable.
