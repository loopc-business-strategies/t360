# Phase 6 Result — Customer Website

**Status:** Complete  
**Date:** 2026-08-11

## Delivered

| Item | Location |
|------|----------|
| Address + WishlistItem models + migration | `database/prisma` |
| Customer me/addresses APIs | `apps/api/src/customers` |
| Wishlist APIs | `apps/api/src/wishlist` |
| Public branches + storefront settings | `branches-public`, `settings/storefront` |
| Storefront shell EN/TA, home, filters, categories, PDP | `apps/web` |
| OTP account + addresses + wishlist pages | `/account`, `/wishlist` |
| WhatsApp enquiry deep link | `whatsapp.ts` + PDP CTA |
| SEO metadata, sitemap, robots, Product JSON-LD | `apps/web/src/app` |
| API notes | [docs/api/CUSTOMER-WEB.md](../api/CUSTOMER-WEB.md) |

## Verification

- `pnpm --filter @t360/api test` — 17 passed (customers, wishlist, WhatsApp util, prior suites)
- `pnpm --filter @t360/api typecheck` + `build` — passed
- `pnpm --filter @t360/web typecheck` + `build` — passed

## Boot

```bash
pnpm docker:up
pnpm prisma:migrate
pnpm prisma:seed
pnpm dev:api
pnpm --filter @t360/web dev
```

OTP uses mock SMS (OTP logged by API). Set `NEXT_PUBLIC_WHATSAPP_E164` for enquiry CTA.

## Explicitly out of scope (Phase 7+)

Cart, checkout, Razorpay, orders, COD, delivery/pickup, WhatsApp Cloud API webhooks.

## Next gate

Phase 7 E-commerce is **NO-GO** until approved.
