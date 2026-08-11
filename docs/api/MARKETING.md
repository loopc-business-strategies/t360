# Marketing API — Phase 11

Consent-aware campaigns and automation on top of the Phase 10 notification engine. Marketing sends use event codes that are **not** transactional, so channel prefs gate delivery.

## Permissions

| Permission | Use |
|------------|-----|
| `offers.manage` | Segments, campaigns, abandoned settings, social drafts, analytics |

## Segments

| Method | Path |
|--------|------|
| GET/POST | `/api/v1/admin/segments` |
| PATCH | `/api/v1/admin/segments/:id` |
| POST | `/api/v1/admin/segments/:id/preview` → `{ count }` |

Rules JSON example: `{ "minOrders": 2, "minSpend": 1000, "hasMobile": true }`.

## Campaigns

| Method | Path |
|--------|------|
| GET/POST | `/api/v1/admin/campaigns` |
| PATCH | `/api/v1/admin/campaigns/:id` |
| POST | `/api/v1/admin/campaigns/:id/enqueue` |

Enqueue resolves segment (or all customers), creates `CampaignRecipient` rows, BullMQ jobs call `NotificationsService.dispatch` with `campaign.broadcast`.

## Abandoned cart

| Method | Path |
|--------|------|
| GET | `/api/v1/admin/abandoned-cart` — recent reminders + settings |
| PATCH | `/api/v1/admin/abandoned-cart/settings` |

Settings keys: `marketing.abandonedCartEnabled`, `marketing.abandonedCartDelayHours`, `marketing.abandonedCartMaxReminders`.

Worker tick dispatches `cart.abandoned` (marketing).

## Social drafts

| Method | Path |
|--------|------|
| GET/POST | `/api/v1/admin/social-posts` |
| PATCH/DELETE | `/api/v1/admin/social-posts/:id` |

## Analytics

| Method | Path |
|--------|------|
| GET | `/api/v1/admin/marketing/analytics` |

Campaign recipient status mix, abandoned reminders (7d), segment preview sizes.
