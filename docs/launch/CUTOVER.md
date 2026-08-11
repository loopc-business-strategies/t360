# Data Migration Cutover — t360

Goal: load real catalogue/inventory into production without seeding demo data.

## Prerequisites

- [ ] Production Postgres backup / PITR enabled ([RUNBOOK.md](../deployment/RUNBOOK.md))
- [ ] `ALLOW_MOCK_PROVIDERS` unset in production
- [ ] Real env vars set per [ENV.md](../deployment/ENV.md)
- [ ] `pnpm preflight:env -- --profile production --file .env.production` (or staging profile) passes
- [ ] Categories/brands exist (or included in first CSV batch)
- [ ] Client CSV reviewed with dry-run
- [ ] Deploy path understood ([STAGING.md](../deployment/STAGING.md))

## Sequence

1. **Freeze** source spreadsheet / POS export (note timestamp).
2. **Backup** production DB (`pg_dump` or Railway snapshot).
3. **Migrate schema:** `pnpm prisma:migrate` (`migrate deploy`) against production URL — never `db push` in prod.
4. **Do not** run `pnpm prisma:seed` on production.
5. **Dry-run products:**

```bash
node scripts/launch/csv-dry-run.mjs docs/launch/templates/products.sample.csv
node scripts/launch/csv-dry-run.mjs ./client-export.csv
```

Fix all reported errors before import.

6. **Import products** via Admin → Products → Import CSV, or `POST /api/v1/admin/products/import` with bearer token.
7. **Import inventory** via Admin → Integrations inventory CSV (or POS path when live).
8. **Verify counts:** product count, variant SKUs, branch stock totals vs source sheet.
9. **Smoke:** [scripts/launch](../../scripts/launch) + [RUNBOOK.md](../deployment/RUNBOOK.md) checklist.
10. **Go-live** decision: [GO-LIVE.md](./GO-LIVE.md).

## Rollback during cutover

If import is wrong before customers use the site: restore DB snapshot and re-import. See [ROLLBACK.md](./ROLLBACK.md).

## After go-live

- Prefer incremental CSV or admin edits; avoid full wipe.
- Keep a dated export after each successful bulk import.
