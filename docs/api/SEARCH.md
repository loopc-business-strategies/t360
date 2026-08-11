# Search API — Phase 14 (Postgres-first)

## Decision

**OpenSearch is deferred.** Catalogue search continues on Postgres `search_vector` (FTS) + `pg_trgm`. A `SearchProvider` port allows a future OpenSearch adapter; selecting `SEARCH_PROVIDER=opensearch` without a real cluster returns `SEARCH_PROVIDER_UNAVAILABLE`.

## Env

| Variable | Values | Default |
|----------|--------|---------|
| `SEARCH_PROVIDER` | `postgres` \| `opensearch` | `postgres` |

## Public endpoints

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/v1/products` | Unchanged contract; `q` uses SearchProvider + synonym expansion |
| GET | `/api/v1/products/suggest?q=&limit=` | Prefix / trigram suggestions |
| GET | `/api/v1/products/facets` | Category / brand / size / colour counts for active filters |

## Admin synonyms

| Method | Path | Permission |
|--------|------|------------|
| GET/POST | `/api/v1/admin/search/synonyms` | `products.update` |
| PATCH | `/api/v1/admin/search/synonyms/:id` | `products.update` |

Body example: `{ "term": "saree", "aliases": ["sari", "புடவை"], "locale": "en", "active": true }`.
