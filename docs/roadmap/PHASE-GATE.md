# Phase Gate — t360

## Current state

| Item | Status |
|------|--------|
| Phase 0–16 | **Complete** |
| Launch package | **Ready** |
| Post-roadmap #1 CMS homepage editor | **Complete** |
| Post-roadmap #2 Staging / go-live kit | **Complete** |
| Post-roadmap #3 POS / other (vendor-blocked) | **Deferred** — no vendor docs; do not implement a live adapter yet |

## Ops readiness (verified 2026-08-11)

| Check | Status |
|-------|--------|
| Railway production api + worker + Postgres + Redis | Healthy |
| Railway staging api + worker + Postgres + Redis | Healthy |
| Production DB migrations applied | Done |
| Production demo seed (catalogue/inventory) | Done — change SuperAdmin password before real launch |
| Vercel `t360-web` + `t360-admin` → production API | Live |
| Policy pages on web | Live |
| Smoke (`scripts/launch/smoke.ps1`) prod + staging | Pass |
| Production providers (payment / notification / AI / POS) | Still **mock** (`ALLOW_MOCK_PROVIDERS=1`) |
| Real Razorpay / Cloudinary / WhatsApp / OpenAI keys | **Blocked on client credentials** |
| GitHub Environments + deploy secrets | Operator — see [STAGING.md](../deployment/STAGING.md) |
| Full go decision ([GO-LIVE.md](../launch/GO-LIVE.md)) | **No-Go** until real providers + client sign-off |

## Ops next steps

1. Replace mock providers with production keys per [ENV.md](../deployment/ENV.md); remove `ALLOW_MOCK_PROVIDERS`.
2. Configure secrets + GitHub Environments per [STAGING.md](../deployment/STAGING.md).
3. Follow [GO-LIVE.md](../launch/GO-LIVE.md) for production cutover.
4. When POS vendor docs arrive, implement adapter per [POS-INTEGRATION.md](../integrations/POS-INTEGRATION.md) (post-roadmap #3).

There is **no Phase 17**. CMS: [CMS.md](../api/CMS.md). Staging kit result: [POST-ROADMAP-STAGING-RESULT.md](../design/POST-ROADMAP-STAGING-RESULT.md).
