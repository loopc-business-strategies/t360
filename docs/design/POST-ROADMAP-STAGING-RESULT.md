# Post-roadmap #2 Result — Staging / Go-Live Kit

**Status:** Complete  
**Date:** 2026-08-11

## Delivered

| Item | Location |
|------|----------|
| Secret-gated Deploy workflow | [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) |
| CI pointer (no inline deploy stubs) | [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) |
| Env preflight | `scripts/launch/preflight-env.mjs`, `pnpm preflight:env` |
| Operator docs | [STAGING.md](../deployment/STAGING.md) |
| Links | DEPLOYMENT, RUNBOOK, GO-LIVE, CUTOVER |

## Verification

- `pnpm preflight:env -- --profile api --file .env.example` — OK (7 keys)
- `pnpm preflight:env -- --profile production --file .env.example` — FAIL on mock providers (expected)
- `pnpm --filter @t360/api test` — 19 suites passed
- api / web / admin builds — passed

## Out of scope

Live Railway/Vercel project creation without operator login, App Store submit, POS vendor adapter.

## Next

Post-roadmap **#3** remains vendor-blocked (POS / other). Operators continue with [GO-LIVE.md](../launch/GO-LIVE.md) using this kit once secrets are set.
