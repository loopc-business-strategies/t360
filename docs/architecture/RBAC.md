# RBAC Architecture — t360

## Model

```
User ──< UserRole >── Role ──< RolePermission >── Permission
```

- **Permission:** string code `resource.action` (e.g. `products.read`).
- **Role:** named bundle of permissions (Owner, Manager, Inventory Manager, …).
- **UserRole:** assigns one or more roles to a user.
- Frontend may hide controls; **API always enforces**.

## Canonical live permission vocabulary

Do **not** rename production codes without a migration. Preferred “view” wording maps to existing `.read` / `.manage` codes:

| Preferred / docs wording | Live seed code |
| --- | --- |
| products.view | `products.read` |
| inventory.view | `inventory.read` |
| orders.view | `orders.read` |
| customers.view | `customers.read` |
| users.* | `staff.manage` (+ `roles.manage` for role assign) |
| roles.view / update | `roles.manage` |
| audit_logs.view | `audit.read` |
| settings.view / update | `settings.manage` |
| ai_usage.view | `ai_fashion.view` (usage endpoint) |
| system_settings.* | `settings.manage` |

AI Fashion granular codes (live):

```
ai_fashion.view | generate | approve | retry | delete
ai_models.view | create | update | delete
ai_settings.view | update
```

Legacy `ai.fashion` is a **compatibility alias** for studio workflow only (`view/generate/approve/retry` + `ai_models.view/create/update`). It does **not** grant `ai_settings.*` or delete permissions.

## Seed roles (initial)

| Role | Intent |
|------|--------|
| SuperAdmin / Owner | Full access |
| Manager | Branch operations |
| ProductManager | Catalog + AI generate/approve |
| SalesManager | Orders/customers/reports |
| InventoryManager | Stock, transfers, barcodes |
| SalesStaff | Lookup, pack, pickup verify, limited order updates |
| MarketingStaff | Coupons, offers, campaigns, AI studio (not settings) |
| CustomerSupport | Tickets, customer/order read, return assist |
| DeliveryStaff | Delivery assignments/status |
| Accountant | Payments, refunds, financial reports |
| SystemAdministrator | Integrations, health, settings, audit, AI settings |

Customer end-users are not granted admin permissions; customer APIs use “self” ownership checks instead.

## Permission catalogue (live baseline)

```
dashboard.view
products.read | products.create | products.update | products.delete
categories.manage | brands.manage
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
ai.admin | ai.fashion
ai_fashion.* | ai_models.* | ai_settings.*
whatsapp.manage | notifications.manage
support.manage | branches.manage
```

## Enforcement

- NestJS guards: JWT auth → load permissions → `@RequirePermissions(...)` (AND) or `@RequireAnyPermissions(...)` (OR).
- Branch scoping: managers/staff may be limited to assigned branches.
- Staff mobile UI only requests staff-safe routes; backend still checks permissions (`feature.mobile_admin.enabled` + `X-T360-Client: mobile-admin`).

## Audit

Sensitive permission uses (role changes, refunds, stock adjust, settings, AI approve/settings) write `AuditLog`. Metadata must never include passwords, API keys, or tokens.

## Mobile Reject UX

There is no separate “Rejected” job status. Mobile **Reject** maps to `DELETE /admin/ai-fashion/jobs/:id` (cancel in-flight or delete finished), matching web cancel/delete.
