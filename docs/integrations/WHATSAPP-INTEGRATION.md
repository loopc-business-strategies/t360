# WhatsApp Integration — t360

## Rule

Use the **official WhatsApp Business Platform / Cloud API** only.  
Do **not** use unofficial WhatsApp automation or scrapers.

## Capabilities

| Feature | Notes |
|---------|--------|
| Product enquiry | Deep link / context with name, SKU, price, URL |
| Availability enquiry | Staff or automated reply via controlled data |
| Order / payment / shipping / delivery updates | Template messages subject to Meta approval |
| Support | Inbound webhook → queue → agent/ticket |
| Promotions | Only with consent + platform rules |

## Architecture

```
Meta WhatsApp Cloud API
        ↓ signed webhook
  Nest WhatsappModule
        ↓ persist WebhookEvent
  BullMQ handler
        ↓
  Orders / Support / Notifications
```

Outbound:

```
Domain event → Notification engine → WhatsApp adapter → Cloud API
```

## Product message content

Include at minimum:

- Product name
- SKU
- Price
- Storefront URL

## Security

- Verify `X-Hub-Signature-256` (or current Meta signature scheme)
- Challenge verification for webhook setup
- Idempotent processing by WAMID / event id
- Secrets only in Railway env

## Consent & compliance

- Marketing templates require opt-in per platform policy
- Document operational consent capture in admin settings
- Legal review for promotional messaging (see SECURITY.md)

## Dependencies

- Meta Business portfolio + WhatsApp Business account
- Phone number registration
- Template approvals (can delay go-live of notifications)
