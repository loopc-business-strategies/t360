# CMS / Storefront Homepage — t360

Admin-editable homepage hero stored in `SystemSetting` key `storefront.hero`.

## Public

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/v1/settings/storefront` | Hero image + EN/TA copy (+ commerce subset) |

Hero JSON shape:

```json
{
  "imageUrl": "https://…",
  "en": { "headline": "…", "support": "…", "ctaLabel": "optional" },
  "ta": { "headline": "…", "support": "…", "ctaLabel": "optional" }
}
```

## Admin (permission `settings.manage`)

| Method | Path | Notes |
|--------|------|--------|
| PUT | `/api/v1/settings/storefront` | Body `{ hero: { … } }` — Zod-validated; audit `settings.storefront.update` |
| GET | `/api/v1/settings` | All system settings |

Admin UI: `/storefront` in the admin app.
