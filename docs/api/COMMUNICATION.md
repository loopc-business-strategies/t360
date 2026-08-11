# Communication API — Phase 10

Notification engine + channel ports (Email, Push, SMS, WhatsApp). Default providers are **mock** (log payloads). Live providers activate via env when credentials exist.

## Env

| Variable | Purpose | Default |
|----------|---------|---------|
| `NOTIFICATION_PROVIDER` | `mock` forces all channel mocks | `mock` |
| `EMAIL_PROVIDER` | `mock` \| `resend` | `mock` |
| `RESEND_API_KEY` | Resend | — |
| `PUSH_PROVIDER` | `mock` \| `fcm` | `mock` |
| `FCM_SERVER_KEY` | Legacy FCM HTTP | — |
| `WHATSAPP_PROVIDER` | `mock` \| `cloud` | `mock` |
| `WHATSAPP_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` / `WHATSAPP_VERIFY_TOKEN` / `WHATSAPP_APP_SECRET` | Cloud API | — |
| `SMS_PROVIDER` | `mock` (India provider later) | `mock` |

## Event catalogue (shipped)

Transactional (ignore marketing preference flags):

| Event code | Templates |
|------------|-----------|
| `order.confirmed` | email, sms, push, whatsapp |
| `order.shipped` | email, sms, push, whatsapp |
| `order.delivered` | email, sms, push, whatsapp |
| `order.cancelled` | email, sms, push, whatsapp |

OTP continues via `SmsProvider.sendOtp` (auth), not the notification inbox.

## Customer endpoints

| Method | Path | Notes |
|--------|------|-------|
| GET/PATCH | `/api/v1/notifications/me/preferences` | marketing channel toggles |
| GET | `/api/v1/notifications/me` | recent notifications |
| POST | `/api/v1/notifications/me/devices` | `{ token, platform }` |
| DELETE | `/api/v1/notifications/me/devices/:token` | unregister |

## Admin

| Method | Path | Permission |
|--------|------|------------|
| GET | `/api/v1/admin/notification-templates` | `notifications.manage` |
| GET | `/api/v1/admin/notifications` | `notifications.manage` |

## WhatsApp webhook

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/v1/whatsapp/webhook` | Meta challenge (`hub.mode`, `hub.verify_token`, `hub.challenge`) — **public** |
| POST | `/api/v1/whatsapp/webhook` | verify signature (skipped in mock); upsert `WebhookEvent`; enqueue handle — **public** |

## Pattern

```
Domain event → NotificationsService.dispatch
  → templates + prefs → Notification(queued) → BullMQ notifications
  → channel adapter → status sent/failed
```

See also [NOTIFICATIONS.md](../integrations/NOTIFICATIONS.md), [WHATSAPP-INTEGRATION.md](../integrations/WHATSAPP-INTEGRATION.md).

## Flutter / FCM

Real FCM SDK wiring is deferred until a Firebase project exists. The mobile app exposes prefs UI and a device-token register stub calling `POST /notifications/me/devices`.
