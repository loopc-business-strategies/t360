# Catalogue API — Phase 4

## Public

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/v1/categories` | Tree of active categories |
| GET | `/api/v1/brands` | Active brands |
| GET | `/api/v1/products` | Search/filter/sort/paginate published products |
| GET | `/api/v1/products/:slugOrId` | Product detail with variants + images |

### Product list query params

`q`, `category` (slug or id), `brand`, `minPrice`, `maxPrice`, `size`, `colour`, `sort` (`relevance|newest|price_asc|price_desc`), `page`, `pageSize`, `availability` (`in_stock|any`), `branch` (id or code)

Responses include `inStock` and `availableQty` (aggregated; scoped when `branch` is set). See [INVENTORY.md](./INVENTORY.md).

Search uses Postgres `tsvector` + `pg_trgm` for typo tolerance.

## Admin (Bearer + RBAC)

| Method | Path | Permission |
|--------|------|------------|
| CRUD | `/api/v1/admin/categories` | `categories.manage` |
| CRUD | `/api/v1/admin/brands` | `brands.manage` |
| CRUD | `/api/v1/admin/products` | `products.*` |
| POST | `/api/v1/admin/products/import` | `products.create` |
| GET | `/api/v1/admin/products/export` | `products.read` |

## Media

`MediaStorage` port: mock pass-through by default; Cloudinary when `CLOUDINARY_*` env is set.
