# Go-Live Checklist — t360

Sign when each block is complete. Owner + date required for go decision.

## Environment

- [ ] Production secrets set ([ENV.md](../deployment/ENV.md)) — no mock providers
- [ ] `pnpm preflight:env -- --profile production --file .env.production` passes
- [ ] Deploy kit configured ([STAGING.md](../deployment/STAGING.md)) — secrets + Environments
- [ ] Railway API + worker healthy
- [ ] Vercel web + admin pointed at production API
- [ ] Domains + SSL verified
- [ ] Sentry DSN set (or consciously deferred)
- [ ] Backups / PITR confirmed

## Data

- [ ] Cutover complete ([CUTOVER.md](./CUTOVER.md))
- [ ] CSV dry-run clean
- [ ] Stock counts verified for launch branch(es)

## Quality

- [ ] UAT critical paths Pass ([UAT.md](./UAT.md))
- [ ] Post-deploy smoke: `scripts/launch/smoke.sh` or `smoke.ps1`
- [ ] Playwright smoke against staging (optional): `pnpm test:e2e:smoke`

## Legal & store

- [ ] Policy URLs live: privacy, terms, shipping, returns, refunds
- [ ] Legal review scheduled or signed (draft copy is not legal advice)
- [ ] Store listing assets ready ([STORE-LISTING.md](./STORE-LISTING.md)) — submit when accounts ready

## Ops readiness

- [ ] Staff trained ([TRAINING.md](./TRAINING.md))
- [ ] Rollback plan understood ([ROLLBACK.md](./ROLLBACK.md))
- [ ] On-call / escalation contact listed

## Decision

| Field | Value |
|-------|-------|
| Go / No-Go | |
| Date (UTC+4 / local) | |
| Approver | |
| Notes | |
