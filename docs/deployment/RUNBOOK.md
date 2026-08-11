# Operations Runbook — t360

## Launch package

See [docs/launch](../launch/): [UAT](../launch/UAT.md), [TRAINING](../launch/TRAINING.md), [CUTOVER](../launch/CUTOVER.md), [GO-LIVE](../launch/GO-LIVE.md), [ROLLBACK](../launch/ROLLBACK.md), [STORE-LISTING](../launch/STORE-LISTING.md).

Deploy kit: [STAGING.md](./STAGING.md).

Env preflight: `pnpm preflight:env -- --profile production --file .env.production`

Automated API smoke: `API_BASE=… ./scripts/launch/smoke.sh` or `.\scripts\launch\smoke.ps1`.

## Smoke checklist (post-deploy)

1. `GET /api/v1/health` → `ok`
2. `GET /api/v1/ready` → database + redis up
3. Customer web home loads; catalogue search returns products
4. Admin login works
5. Create test order on staging (COD or mock payment only when allowed)
6. Worker: low-stock / notification queues process without crash loops (Railway logs)

## Database backup & restore

1. Prefer Railway dashboard automated backups / PITR.
2. Manual dump (operator machine with network access):

```bash
pg_dump "$DATABASE_URL" -Fc -f t360-$(date +%Y%m%d).dump
```

3. Restore (staging only unless incident):

```bash
pg_restore --clean --if-exists -d "$DATABASE_URL" t360-YYYYMMDD.dump
```

4. After restore: `pnpm prisma:migrate` (`migrate deploy`) if schema drifted; never seed production.

## Rollback

1. **App:** Redeploy previous successful Railway/Vercel deployment.
2. **DB:** Prefer forward-fix migrations. `migrate down` only with explicit DBA approval and a fresh backup.
3. **Config:** Revert env var changes; clear Redis if queue poison messages persist (`FLUSHDB` only on dedicated Redis, never shared).

Cutover / go-live detail: [ROLLBACK.md](../launch/ROLLBACK.md).

## Secrets rotation (incident)

1. Rotate JWT access/refresh secrets → forces re-login (document customer impact).
2. Rotate Razorpay / WhatsApp / Resend / OpenAI / Cloudinary keys in provider consoles, then Railway/Vercel.
3. Rotate DB password via Railway; update `DATABASE_URL`; restart api + worker.
4. Invalidate compromised admin sessions (revoke refresh tokens / lock users).

## Sentry

- Set `SENTRY_DSN` (API) and `NEXT_PUBLIC_SENTRY_DSN` (web/admin) per environment.
- Without DSN, apps no-op (CI green).

## Load balancer probes

- Liveness: `/api/v1/health`
- Readiness: `/api/v1/ready`
