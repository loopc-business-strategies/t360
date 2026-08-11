# Analytics — t360

## Tools

- **Primary:** Google Analytics 4  
- **Optional:** PostHog for product analytics  

## Event naming (initial catalogue)

Use consistent, snake_case or GA4-recommended ecommerce names mapped in implementation:

| Event | When |
|-------|------|
| `page_view` | Route changes |
| `view_item` | PDP view |
| `search` | Search submitted |
| `filter_apply` | Filters changed |
| `add_to_wishlist` | Wishlist add |
| `add_to_cart` | Cart add |
| `begin_checkout` | Checkout started |
| `add_payment_info` | Payment started |
| `purchase` | Server-confirmed purchase |
| `coupon_applied` | Coupon used |
| `ai_interaction` | AI chat turn |
| `whatsapp_click` | WhatsApp CTA |
| `store_pickup_selected` | Pickup chosen |
| `delivery_selected` | Delivery chosen |
| `repeat_purchase` | Derived / flagged purchase |

## Rules

- Do not send unnecessary PII to analytics vendors.  
- Prefer server-side confirmation for `purchase`.  
- Admin can disable non-essential tracking via settings where required.

## Implementation phase

Wire in Phases 6–7 (storefront) and 11 (marketing analytics hardening). Architecture only in Phase 1.
