# Environment variables — t360

## Production mock-provider ban

When `NODE_ENV=production`, the API refuses to boot if any of these are `mock` **unless** `ALLOW_MOCK_PROVIDERS=1`:

- `PAYMENT_PROVIDER`
- `NOTIFICATION_PROVIDER` (or channel defaults that imply mock-only)
- `AI_PROVIDER`
- `POS_PROVIDER`

Use the escape hatch only for emergency staging/hotfix sandboxes — never as a permanent prod setting.

## API / worker (Railway)

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | yes | Postgres |
| `REDIS_URL` | yes | BullMQ + rate limits |
| `JWT_ACCESS_SECRET` | yes | ≥32 chars |
| `JWT_REFRESH_SECRET` | yes | ≥32 chars |
| `CORS_ORIGINS` | yes | Comma-separated exact origins |
| `NODE_ENV` | yes | `production` |
| `PORT` | no | Default 4000 |
| `PAYMENT_PROVIDER` | yes | `razorpay` in prod |
| `RAZORPAY_*` | if razorpay | keys + webhook secret |
| `NOTIFICATION_PROVIDER` / channel providers | recommended | avoid mock in prod |
| `AI_PROVIDER` | no | `openai` + key, or disable AI setting |
| `POS_PROVIDER` | no | `mock` banned in prod without escape hatch |
| `SENTRY_DSN` | no | Enables API Sentry |
| `GIT_SHA` / `APP_VERSION` | no | Surfaced on health |
| `ALLOW_MOCK_PROVIDERS` | no | Emergency only |

## Web / admin (Vercel)

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_API_URL` | yes | `https://api…/api/v1` |
| `NEXT_PUBLIC_SITE_URL` | web | Canonical URL |
| `NEXT_PUBLIC_SENTRY_DSN` | no | Enables client Sentry stub wiring |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | checkout | Public key |

See also `apps/api/.env.example`, `apps/web/.env.example`, `apps/admin/.env.example`, and root `.env.example`.
