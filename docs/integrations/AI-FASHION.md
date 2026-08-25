# AI Fashion Studio

Admin-only feature for generating professional on-model fashion images from product photos.

## Architecture

```text
Admin UI (/ai-fashion)
  → POST /api/v1/admin/ai-fashion/generate
  → AiFashionService (job row + usage + enqueue)
  → BullMQ queue `t360-ai-fashion`
  → Worker polls FashionAIProvider
  → FashnProvider → https://api.fashn.ai/v1/run + /v1/status/{id}
  → MediaStorage.uploadFromUrl (Cloudinary or mock)
  → AiGeneratedImage COMPLETED
  → Admin approves → ProductImage
```

Chat AI (`apps/api/src/ai`) is separate. Fashion Studio lives in `apps/api/src/ai-fashion`.

Customer **TRY ME** virtual try-on reuses this same provider + queue with a separate `TryOnSession` model — see [TRY-ON.md](./TRY-ON.md).

## Provider abstraction

`FashionAIProvider` methods:

- `productToModel`
- `virtualTryOn`
- `createModel`
- `removeBackground` (stub)
- `generateVideo` (stub)
- `getJobStatus`

### FASHN mapping

| Studio mode | FASHN `model_name` |
| --- | --- |
| Product → model (no library model) | `product-to-model` |
| Product → library model | `tryon-max` (`product_image` + `model_image`) |
| Generate model | `model-create` |
| Virtual try-on (admin/API) | `tryon-max` |
| Image-to-video | interface only (not wired in v1 UI) |

All FASHN-specific request shapes stay inside `FashnProvider`.

To add another provider: implement `FashionAIProvider`, register in `ai-fashion.module.ts` factory based on `FASHION_AI_PROVIDER`.

## Environment variables

```env
FASHION_AI_PROVIDER=fashn   # Path A: stills via FASHN; use disabled when no key
FASHN_API_KEY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Path A defaults (stills only, low cost): `videoEnabled=false`, `defaultGenerationMode=fast`, `defaultResolution=1k`, tighter daily/monthly limits. Video stays off until you enable it in Admin settings.

- Secrets stay server-side only.
- If provider is `disabled` or key missing, the API returns a clear configuration error (no fake success).
- Without Cloudinary credentials, `MockMediaStorage` pass-through is used (fine for local; production should configure Cloudinary so FASHN CDN URLs are persisted before expiry).

## Database models

- `AiFashionModel` — model library
- `AiGeneratedImage` — generation jobs/results
- `AiFashionUsage` — usage/credits ledger

Permission: `ai.fashion` (SuperAdmin, Manager, MarketingStaff).

Settings keys:

- `ai.fashion.enabled`
- `ai.fashion.config` (defaults, limits, auto-generate) — never stores API keys

## Generation workflow

1. Admin selects product + product image (+ optional library model).
2. `POST /admin/ai-fashion/generate` creates `QUEUED` job and enqueues BullMQ work.
3. Worker sets `PROCESSING`, calls provider, polls until completed/failed.
4. On success, uploads output via MediaStorage, sets `COMPLETED`.
5. Admin previews and approves as **gallery** or **primary** product image.
6. Failed jobs support **Retry** (same row requeued; no duplicate COMPLETED assets).

Duplicate active jobs for the same product image + type + model are rejected.

## Product create auto-generation

Optional checkbox **Generate AI Fashion Images** on product create (`generateAiFashion: true`), or Settings → `autoGenerateOnCreate`. Product create returns immediately; generation runs in the background.

## API (admin)

All under `/api/v1/admin/ai-fashion`, require `ai.fashion`:

- `GET /dashboard`
- `POST /generate`
- `GET|POST /jobs`, `/jobs/:id`, `/jobs/:id/retry`, `/jobs/:id/approve`, `DELETE /jobs/:id`
- `GET|POST|PATCH|DELETE /models`, `POST /models/generate`
- `GET|PATCH /settings`
- `GET /usage`

## Admin UI

- `/ai-fashion` — dashboard
- `/ai-fashion/generate`
- `/ai-fashion/models`
- `/ai-fashion/images`
- `/ai-fashion/settings`
- Product edit page → AI Fashion card
- Product create → Generate AI Fashion Images checkbox

## How to test Product → AI Model

1. Set `FASHION_AI_PROVIDER=fashn` and `FASHN_API_KEY` on the API.
2. Enable AI Fashion in Admin → AI Fashion → Settings.
3. Ensure Redis worker is running (`pnpm --filter @t360/api worker`).
4. Open a product with a clear front-facing garment image.
5. AI Fashion → Generate → select product image → Generate.
6. Wait for Completed → Approve (gallery or primary).

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Provider not configured | `FASHION_AI_PROVIDER`, `FASHN_API_KEY` |
| Jobs stay Queued | Worker process + `REDIS_URL` |
| Generation failed / image invalid | Input URL reachable by FASHN; clear product photo |
| Rate limit / credits | FASHN dashboard credits and rate limits |
| Output missing after days | Configure Cloudinary so outputs are re-hosted |

## Tests

Unit tests use `MockFashionAiProvider` only in Jest. It is never selected by `FASHION_AI_PROVIDER` in production modules.
