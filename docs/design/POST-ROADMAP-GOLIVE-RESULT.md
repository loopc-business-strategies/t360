# Post-roadmap — Operator Go-Live Assist Result

**Status:** Staging provisioned (mock providers)  
**Date:** 2026-08-11  
**Secrets:** Not recorded in this file.

## Created resources (IDs / URLs only)

| Platform | Resource | ID / URL |
|----------|----------|----------|
| GitHub | Private repo | https://github.com/loopcstrategies-star/t360 |
| GitHub | Environments | `staging`, `production` |
| Railway | Project `t360` | `2560a64b-0d65-47f0-a79e-6a6a7272ca17` |
| Railway | Environment | `staging` (`04fde4c1-ff41-4ad8-89ea-8401a99596a4`) |
| Railway | Service `api` | `87d53936-7387-4d54-9b20-2f49a0aa2178` |
| Railway | Service `worker` | `6bf11d2c-dc1c-4da6-bab3-d0b0b0e43839` |
| Railway | Redis | `101d139f-a2bb-4e01-969e-c6abc9ebf875` |
| Railway | Postgres (current) | `Postgres-5Pe2` / `3124711b-9540-485c-b6e4-e23a43b5316d` |
| Railway | Staging API | https://api-staging-7912.up.railway.app |
| Railway | `STAGING_API_BASE` | https://api-staging-7912.up.railway.app/api/v1 |
| Vercel | Team / org | `beulah-4360s-projects` / `team_HtXyh43TmK3Fe1YTfwcLmK6n` |
| Vercel | `t360-web` | `prj_4iMnBwsH737DZkP38Tedc0LlOQ2g` → https://t360-web.vercel.app |
| Vercel | `t360-admin` | `prj_thQF06KcN63tS05HzOps94qXkdiC` → https://t360-admin.vercel.app |

## Staging posture

- Providers: `mock` with `ALLOW_MOCK_PROVIDERS=1`
- Catalogue + roles seeded once on staging (`SEED_ON_BOOT` / `SEED_CATALOGUE` used for first boot, then disabled)
- Smoke (`scripts/launch/smoke.ps1`) passed against staging API

## GitHub Actions wiring

| Item | Status |
|------|--------|
| Repo variables (`STAGING_API_BASE`, `VERCEL_*` project/org IDs, Railway service names) | Set |
| Secret `VERCEL_TOKEN` | Set |
| Secret `RAILWAY_TOKEN` | **Operator action** — create a Railway account token and `gh secret set RAILWAY_TOKEN` |
| Workflow files on remote | **Blocked** until GitHub OAuth token has `workflow` scope (local `.github/workflows/*` present) |

## Operator follow-ups (out of this pass)

- Grant `workflow` scope / push Actions workflows; optional: connect Vercel GitHub App to `loopcstrategies-star/t360`
- Real payment / AI / SMS keys; custom domains; production cutover ([GO-LIVE.md](../launch/GO-LIVE.md))
- Align local git author email with Vercel Hobby owner before git-triggered Vercel deploys (CLI deploys from a gitless tree worked)

## Related

- Kit docs: [STAGING.md](../deployment/STAGING.md), [ENV.md](../deployment/ENV.md)
- Prior kit result: [POST-ROADMAP-STAGING-RESULT.md](./POST-ROADMAP-STAGING-RESULT.md)
