# UAT Checklist — Tharagai Digital (t360)

Manual acceptance against staging (or local with Docker). Mark **Pass / Fail / Blocked**, owner, and date.

Reference flows: [TESTING.md](../testing/TESTING.md).

| # | Flow | Pass/Fail | Owner | Notes |
|---|------|-----------|-------|-------|
| 1 | Customer registration (mobile OTP) | | | |
| 2 | OTP login / session refresh | | | |
| 3 | Catalogue search + suggest | | | |
| 4 | Filters (category, brand, size, colour, price, stock) | | | |
| 5 | Product detail page (PDP) + images | | | |
| 6 | Wishlist add/remove | | | |
| 7 | Cart add/update/remove | | | |
| 8 | Coupon apply / reject | | | |
| 9 | Checkout — delivery address | | | |
| 10 | Checkout — store pickup | | | |
| 11 | Payment — COD (if enabled) | | | |
| 12 | Payment — Razorpay test / mock (staging only) | | | |
| 13 | Order creation + status visible to customer | | | |
| 14 | Cancel order (allowed states) | | | |
| 15 | Return request | | | |
| 16 | Refund path (ops) | | | |
| 17 | Staff pickup verify (code) | | | |
| 18 | Loyalty earn / redeem | | | |
| 19 | Admin: product create / edit | | | |
| 20 | Admin: CSV import / export | | | |
| 21 | Admin: inventory update + reservation | | | |
| 22 | Admin: low-stock / notifications | | | |
| 23 | AI assistant (customer + admin) read-only tools | | | |
| 24 | WhatsApp webhook (staging templates) | | | |
| 25 | POS CSV / mock sync (adapter when vendor ready) | | | |
| 26 | Legal pages load (privacy, terms, shipping, returns, refunds) | | | |
| 27 | Mobile app smoke (auth, catalogue, cart) | | | |
| 28 | Post-deploy API smoke (`scripts/launch/smoke`) | | | |

## Exit criteria

- Zero **Fail** on critical commerce paths (1–16, 19–21).
- Remaining items **Blocked** only with documented owner + target date.
- Sign-off recorded in [GO-LIVE.md](./GO-LIVE.md).
