# Business Workflows — Tharagai Digital (t360)

## Order lifecycle

```
Pending
  → PaymentPending
  → Confirmed
  → Processing
  → Packed
  → ReadyForPickup | OutForDelivery
  → Delivered

Side paths:
  → Cancelled
  → ReturnRequested → Returned
  → RefundPending → Refunded
```

Rules:

- Every transition is recorded on an order timeline.
- Notifications fire from configured templates per event.
- Cancellation/return eligibility is rule-based (admin-configurable where appropriate).

## Stock & reservation

1. **Available** = `physicalQty - reservedQty` (per variant per branch).
2. On checkout / payment intent: create `StockReservation` inside a DB transaction; fail if insufficient.
3. On payment confirm: convert reservation to sold (decrement physical, clear reservation) + movement row.
4. On cancel / payment timeout: release reservation + movement row.
5. Adjustments/transfers always write `InventoryMovement` with actor + reason.
6. Optimistic concurrency (`version`) on inventory rows where useful.

## Payment workflow

1. Client sends create-order with `Idempotency-Key`.
2. API creates order (PaymentPending), reserves stock, creates Razorpay order via `PaymentProvider`.
3. Client completes checkout with Razorpay SDK.
4. Razorpay webhook (signed) → verify → idempotent process → Confirmed.
5. Never trust client-only “payment success” without server verification.
6. COD: confirm per policy; still reserve stock; mark payment method COD.

## Store pickup workflow

1. Customer selects branch; system stores fulfillment = PICKUP.
2. Generate unique pickup code (single use).
3. Staff verifies code + order identity; mark fulfilled.
4. Duplicate verify attempts are rejected.

## Delivery workflow

1. Address validated against delivery zones.
2. Fee from zone rules or free-delivery threshold.
3. Shipment record + status updates; assignment to delivery staff when used.
4. Future: external delivery provider adapter (same module boundary).

## Loyalty workflow

1. Configurable earn rules (not hardcoded ₹100 = X).
2. On eligible delivered/confirmed events: create `LoyaltyTransaction`.
3. Redemption at checkout validates balance + caps.
4. Tiers, expiry, referral bonuses via config + scheduled jobs.

## Coupon / offer application

1. Validate code: dates, usage limits, per-customer limits, min order, applicability.
2. Compute discount server-side only.
3. Record `CouponUsage` on successful order; release on cancel if rules say so.

## Refund workflow

1. Approved return/refund request.
2. Idempotent refund via payment provider.
3. Stock restock if configured.
4. Notify customer; audit log.

## WhatsApp inbound/outbound

1. Verify webhook signature.
2. Persist `WebhookEvent`; enqueue handler (idempotent by provider event id).
3. Outbound templates only when consented / platform-allowed.

## AI tool invocation

1. Authenticate caller; apply rate limits.
2. LLM may call only registered tools.
3. Tools re-check authz and return structured catalogue/order data.
4. Mutating business actions are **not** exposed as unconstrained AI tools.
