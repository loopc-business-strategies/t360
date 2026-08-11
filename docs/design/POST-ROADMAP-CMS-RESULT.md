# Post-roadmap #1 Result — CMS Homepage Editor

**Status:** Complete  
**Date:** 2026-08-11

## Delivered

| Item | Location |
|------|----------|
| Zod `storefrontHeroSchema` / `storefrontUpdateSchema` | `packages/validation` |
| `SettingsService` + `PUT /settings/storefront` + audit | `apps/api/src/settings` |
| Admin Storefront page + nav | `apps/admin/src/app/storefront`, `admin-shell.tsx` |
| Optional hero CTA label on web home | `HomeClient`, `catalog-api` types |
| Docs | [CMS.md](../api/CMS.md) |

## Verification

- API unit tests (incl. settings schema/service)
- API / web / admin builds

## Out of scope

Visual page builder, arbitrary blocks, staging deploy kit (#2), POS (#3).

## Next

Post-roadmap **#2 — Staging / go-live kit** (CI/staging deploy wiring, env/smoke toward [GO-LIVE.md](../launch/GO-LIVE.md)).
