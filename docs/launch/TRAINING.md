# Staff Training — Tharagai Admin

Audience: store managers, catalogue ops, pickup desk. Use staging first.

## Roles (high level)

| Role | Typical access |
|------|----------------|
| SuperAdmin | Full CRM |
| Catalogue / Merch | Products, categories, brands, media |
| Inventory | Stock, transfers, reservations |
| Orders / Fulfillment | Orders, pickup verify, returns |
| Marketing | Segments, campaigns, coupons (as permitted) |

Exact permissions: [RBAC.md](../architecture/RBAC.md).

## Catalogue

1. Open Admin → **Products**.
2. Create product or **Import CSV** (see [templates/products.sample.csv](./templates/products.sample.csv)).
3. Dry-run first: `node scripts/launch/csv-dry-run.mjs path/to/file.csv`.
4. Publish only after images + category + price are correct.
5. **Export CSV** for backup before bulk edits.

## Inventory

1. Admin → **Inventory** / branches.
2. Adjust stock per SKU; prefer transfers over silent edits when moving between branches.
3. Watch reservations during peak (checkout holds stock briefly).
4. POS inventory CSV: Admin → **Integrations** (mock until live vendor).

## Orders & pickup

1. Admin → **Orders** — filter by status.
2. Pickup: verify customer **pickup code** at counter; mark fulfilled.
3. Cancel / return: follow allowed state machine; do not invent refunds outside payment provider.

## Coupons & loyalty

1. Admin → **Coupons** / **Loyalty**.
2. Test codes on staging cart before publishing campaign.
3. Document start/end dates; avoid overlapping exclusive codes without intent.

## Integrations CSV

1. Product catalogue CSV via Products page.
2. Inventory CSV via Integrations (POS bridge).
3. Never paste production secrets into chat or tickets.

## Communication

- Prefer documented templates for WhatsApp/SMS (see communication docs).
- Customer data access is need-to-know; follow [SECURITY.md](../security/SECURITY.md).
