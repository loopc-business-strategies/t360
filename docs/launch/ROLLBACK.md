# Rollback Plan — Launch / Cutover

Companion to [RUNBOOK.md](../deployment/RUNBOOK.md). Use during go-live window or incidents.

## Decision matrix

| Symptom | First action | Escalate if |
|---------|--------------|-------------|
| Web/admin 5xx after deploy | Redeploy previous Vercel deployment | Still failing after 15m |
| API crash loop | Redeploy previous Railway deployment; check logs | DB connection errors |
| Bad migration / data import | Restore DB from pre-cutover snapshot | Snapshot missing |
| Poison Redis jobs | Pause workers; clear dedicated Redis carefully | Shared Redis (never FLUSH shared) |
| Payment misconfig | Disable online pay in admin settings; COD only if allowed | Charge disputes |

## App rollback

1. Identify last known-good Railway + Vercel deployments (note deploy IDs).
2. Redeploy those builds (do not “hotfix forward” under pressure unless trivial).
3. Re-run `scripts/launch/smoke` against production URLs.
4. Communicate status to store managers.

## Database rollback

1. Prefer **forward-fix** migrations after go-live.
2. During cutover window only: restore Railway snapshot / `pg_restore` from pre-import dump.
3. After restore: confirm `migrate deploy` state matches restored schema; never seed production.
4. Re-import corrected CSV if catalogue was the only fault.

## Config rollback

1. Revert env var changes in Railway/Vercel (JWT, payment keys, feature flags).
2. Restart API + worker.
3. If JWT secrets rotated unintentionally, expect mass re-login — notify support.

## Communication

- Status page / WhatsApp ops group: what failed, ETA, customer impact (checkout down vs browse-only).
- After recovery: short postmortem in `docs/launch/` or ops ticket (root cause, preventative).
