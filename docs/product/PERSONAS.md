# User Personas — Tharagai Digital (t360)

## Customer

- **Who:** Shoppers discovering and buying fashion/readymades online or preparing store visits.
- **Goals:** Browse in English/Tamil; find sizes/colours; check availability; buy with UPI/card/COD; choose delivery or pickup; track orders; use loyalty; get help via WhatsApp/AI.
- **Frustrations:** Out-of-stock after add-to-cart; unclear pickup process; English-only UX; slow mobile pages.
- **Primary channels:** Web, Flutter app, WhatsApp.

## Owner / Super Admin

- **Who:** Business owner or LoopC-designated superuser.
- **Goals:** Full control of catalogue, inventory, orders, staff, payments visibility, settings, reports.
- **Needs:** Single dashboard truth; auditability; no silent data loss.

## Manager

- **Who:** Branch or operations manager.
- **Goals:** Day-to-day orders, stock visibility, staff coordination for one or more branches.
- **Constraints:** Not all owner financial/settings permissions.

## Inventory Manager

- **Who:** Stock specialist.
- **Goals:** Accurate stock, transfers, adjustments, barcode workflows, low-stock action.
- **Critical:** Every change must be auditable; no oversell.

## Sales Staff

- **Who:** Floor / packing staff.
- **Goals:** Product lookup, packing, pickup verification, limited order status updates.
- **Constraints:** No owner-only settings, refunds policy, or role management unless granted.

## Marketing Staff

- **Who:** Promotions owner.
- **Goals:** Coupons, offers, campaigns, social content drafts, segment targeting.
- **Constraints:** Must respect consent and WhatsApp platform rules.

## Customer Support

- **Who:** Support agents.
- **Goals:** Tickets, order help, returns guidance, conversation history.
- **Needs:** PII access limited to job need; audit of sensitive actions.

## Delivery Staff

- **Who:** In-house or assigned delivery personnel.
- **Goals:** See assignments; update delivery status.
- **Constraints:** No catalogue or pricing edits.

## Accountant

- **Who:** Finance role.
- **Goals:** Payments, refunds, invoices, financial reports.
- **Needs:** Accurate payment state; idempotent refunds.

## System Administrator

- **Who:** Technical admin (LoopC or client IT).
- **Goals:** Integrations, system health, secrets policy, audit logs.
- **Constraints:** Production changes via controlled processes.
