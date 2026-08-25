# Customer Virtual Try-On (TRY ME)

Customer-facing virtual try-on on **web** and **Flutter**, reusing the existing Fashion AI provider, BullMQ queue `t360-ai-fashion`, and Cloudinary `MediaStorage`. Outputs are **never** approved into the product gallery.

## Architecture

```text
PDP TRY ME → Customer JWT
  → POST /ai/fashion/try-on/upload  (person photo → Cloudinary t360/try-on/{userId}/)
  → POST /ai/fashion/try-on         (TryOnSession QUEUED + enqueue)
  → Worker job type try-on → FashionAIProvider.virtualTryOn
  → resultImageUrl on session COMPLETED
  → Client polls GET /ai/fashion/try-on/:id
  → expiresAt cleanup (TTL) purges media unless savePhotoConsent
```

## Product gate

- `Product.tryOnEnabled` default **false** (cost control). Enable per product in Admin → Products → Edit.
- Optional `ProductImage.isTryOnSource` for garment priority.
- Garment pick order: try-on source → first gallery image → primary (`sortOrder` 0).

## Customer APIs (JWT)

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/v1/ai/fashion/try-on/upload` | multipart `file` |
| POST | `/api/v1/ai/fashion/try-on` | create + enqueue (`Idempotency-Key`) |
| GET | `/api/v1/ai/fashion/try-on/history` | owner list |
| GET | `/api/v1/ai/fashion/try-on/:id` | owner poll |
| POST | `/api/v1/ai/fashion/try-on/:id/cancel` | QUEUED only |
| DELETE | `/api/v1/ai/fashion/try-on/:id` | soft-delete + media purge |

## Admin APIs (RBAC)

Permissions: `ai.tryon.read`, `ai.tryon.manage`, `ai.tryon.delete`.

- `GET /admin/ai-fashion/try-on/dashboard`
- `GET /admin/ai-fashion/try-on`
- `POST /admin/ai-fashion/try-on/:id/retry|cancel`
- `DELETE /admin/ai-fashion/try-on/:id`

UI: Admin → AI Fashion → **Virtual Try-On**. Product edit: Try-On enabled + garment image.

## Config / env

Settings key `ai.tryon.config`: `enabled`, `maxImageBytes`, `retentionHours`, `perUserPerHour`, `maxConcurrentPerUser`.

```bash
# Feature flag (optional; settings can also gate)
TRY_ON_ENABLED=true

# Live AI (required on api + worker for real results)
FASHION_AI_PROVIDER=fashn
FASHN_API_KEY=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

Until FASHN + Cloudinary are configured, the API returns honest provider-unavailable / failed errors — **no fake success images**.

## Privacy

- Default `expiresAt = now + retentionHours`.
- Cleanup marks sessions `EXPIRED` and deletes Cloudinary input (and result unless `savePhotoConsent`).
- Auth required (same as cart); guests are redirected to login/OTP.

## Clients

- **Web:** PDP TRY ME modal; history at `/account/try-ons`.
- **Flutter:** `/try-on` flow, `/try-ons` history; camera + gallery permissions.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| TRY ME disabled on PDP | Product `tryOnEnabled` |
| Upload 413 / validation | mime jpg/png/webp + `maxImageBytes` |
| Rate limited | `perUserPerHour` / Redis |
| FAILED / PROVIDER_UNAVAILABLE | `FASHION_AI_PROVIDER=fashn`, `FASHN_API_KEY` on **api and worker** |
| No result media | Cloudinary env on worker |
| Stuck QUEUED | Worker process + Redis + queue `t360-ai-fashion` |

See also [AI-FASHION.md](./AI-FASHION.md).
