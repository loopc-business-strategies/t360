# RBAC Architecture — t360

## Model

```
User ──< UserRole >── Role ──< RolePermission >── Permission
```

- **Permission:** string code `resource.action` (e.g. `products.read`).
- **Role:** named bundle of permissions (Owner, Manager, Inventory Manager, …).
- **UserRole:** assigns one or more roles to a user.
- Frontend may hide controls; **API always enforces**.

## Seed roles (initial)

| Role | Intent |
|------|--------|
| SuperAdmin / Owner | Full access |
| Manager | Branch operations |
| InventoryManager | Stock, transfers, barcodes |
| SalesStaff | Lookup, pack, pickup verify, limited order updates |
| MarketingStaff | Coupons, offers, campaigns, social drafts |
| CustomerSupport | Tickets, customer/order read, return assist |
| DeliveryStaff | Delivery assignments/status |
| Accountant | Payments, refunds, financial reports |
| SystemAdministrator | Integrations, health, settings, audit |

Customer end-users are not granted admin permissions; customer APIs use “self” ownership checks instead.

## Permission catalogue (representative)

```
products.read | products.create | products.update | products.delete
categories.* | brands.*
inventory.read | inventory.update | inventory.transfer | inventory.adjust
orders.read | orders.update | orders.cancel
customers.read | customers.update
payments.read | payments.refund
shipments.read | shipments.update
coupons.manage | offers.manage | loyalty.manage
reviews.moderate
reports.read
staff.manage | roles.manage
settings.manage
integrations.manage
audit.read
cms.manage
ai.admin
whatsapp.manage
support.manage
```

Exact matrix is finalized in Phase 3 seed data; this list is the architecture baseline.

## Enforcement

- NestJS guards: JWT auth → load permissions → `@RequirePermissions('inventory.update')`.
- Optional CASL ability layer for complex object-level rules (e.g. branch-scoped manager).
- Branch scoping: managers/staff may be limited to assigned branches.
- Staff mode UI only requests staff-safe routes; backend still checks permissions.

## Audit

Sensitive permission uses (role changes, refunds, stock adjust, settings) write `AuditLog`.
