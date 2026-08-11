# User Journeys — Tharagai Digital (t360)

## J1 — Discover → Purchase (web/app)

1. Land on homepage (CMS hero, new arrivals, categories).
2. Browse category or search (“blue shirt”, Tamil queries supported via i18n UI + search).
3. Filter by size/colour/price/availability; open PDP.
4. Select variant; see branch availability when applicable.
5. Add to cart or Buy Now; optionally add to wishlist.
6. Checkout: address → delivery or pickup → coupon → payment.
7. Pay via Razorpay (or COD if enabled); server confirms via webhook.
8. Order confirmation + notifications; track status until delivered/picked up.

**Acceptance signals:** Stock reserved correctly; no oversell; payment verified server-side; order timeline recorded.

## J2 — Store pickup

1. At checkout, select Store Pickup and branch.
2. See address, hours, preparation estimate.
3. Pay/confirm; receive pickup code.
4. Staff looks up order / scans; verifies code once.
5. Status → Ready for Pickup → Delivered/Collected; code cannot be reused.

## J3 — Customer OTP registration / login

1. Enter mobile; receive OTP (rate-limited).
2. Verify; create or attach Customer profile.
3. Manage addresses, wishlist, orders, loyalty, notification prefs.
4. Request account deletion when required by policy.

## J4 — Admin catalogue publish

1. Create/edit category, brand, product, variants, attributes, images (Cloudinary).
2. Set prices/SKUs/barcodes; assign stock per branch.
3. Publish; appears in search and storefront.
4. Optional CSV import with validation report.

## J5 — Inventory transfer / adjustment

1. Inventory manager initiates transfer or adjustment with reason.
2. Transaction updates physical stock + `InventoryMovement`.
3. Low-stock job may alert if below threshold.

## J6 — WhatsApp product enquiry

1. Customer taps WhatsApp CTA on PDP.
2. Prefilled/context message includes name, SKU, price, URL.
3. Inbound webhook handled officially; support can continue in WhatsApp or ticket.

## J7 — AI shopping (Tharagai AI)

1. Customer asks: “Men’s shirts under ₹1500” / “Wedding saree under ₹10000”.
2. Backend LLM uses only registered tools with auth/rate limits.
3. Responses cite real product/stock; if unknown, AI states unavailability (no hallucination).

## J8 — Return and refund

1. Customer requests return on eligible order.
2. Support/admin reviews; status Return Requested → Returned.
3. Refund issued via payment provider abstraction (idempotent).
4. Customer notified; loyalty adjustments if configured.

## J9 — Staff packing & status

1. Staff opens order; packs items; updates Processing → Packed.
2. For delivery: Out for Delivery; for pickup: Ready for Pickup.
3. Permissions prevent unauthorized refunds or price changes.

## J10 — Abandoned cart reminder

1. Cart idle beyond configurable window.
2. Job enqueues permitted reminder (push/email/SMS/WA per prefs + consent).
3. No spam: frequency caps and preference checks.
