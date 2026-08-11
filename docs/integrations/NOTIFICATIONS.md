# Notifications Architecture — t360

## Channels

| Channel | Initial provider | Port |
|---------|------------------|------|
| Push | Firebase Cloud Messaging | `PushProvider` |
| Email | Resend | `EmailProvider` (SES later) |
| SMS / OTP | India SMS provider TBD | `SmsProvider` |
| WhatsApp | Cloud API | `WhatsappProvider` |

## Pattern

```
Domain event
  → resolve NotificationTemplate + user preferences + consent
  → enqueue BullMQ job
  → channel adapter send
  → record Notification status
  → retry / DLQ on persistent failure
```

## Event catalogue (initial)

- Registration
- Order placed / payment successful / order confirmed
- Packed / shipped / out for delivery / delivered
- Cancelled / refunded
- New offer / loyalty reward
- Wishlist back in stock
- Low stock (ops)
- Abandoned cart reminder (prefs + caps)
- Marketing campaigns (consent-aware)

## Preferences

Customers control channel preferences where legally/platform allowed.  
Transactional messages (order/payment) may still send on essential channels per policy.

## Templates

Stored in `NotificationTemplate` with locale (EN/TA) and channel.  
Admin-editable without redeploy where safe; code defaults for system templates.

## Jobs (BullMQ)

Also related: invoice generation, image processing hooks, loyalty expiry, analytics aggregation, report generation, AI post-processing where appropriate.

## Dev mock

When providers unset: `NOTIFICATION_PROVIDER=mock` logs payloads; clearly labeled; disabled in production config validation.
