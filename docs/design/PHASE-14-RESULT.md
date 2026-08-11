# Phase 14 Result — Advanced search (Postgres-first)

**Status:** Complete  
**Date:** 2026-08-11

## Decision

**OpenSearch deferred.** Postgres `search_vector` + `pg_trgm` remains the production search engine. Catalogue scale does not justify an OpenSearch cluster. An `OpenSearchSearchProvider` stub fails closed if `SEARCH_PROVIDER=opensearch`.

## Delivered

| Item | Location |
|------|----------|
| `SearchSynonym` + seed | `database/prisma` + migration `20260811700000_search_synonyms` |
| `SearchProvider` (Postgres default) | `apps/api/src/search` |
| Catalog list via provider + synonym expansion | `CatalogService.listProducts` |
| Suggest + facets | `GET /products/suggest`, `/products/facets` |
| Admin synonyms CRUD | `/admin/search/synonyms` |
| Web suggest dropdown | `products-browser.tsx` |
| Admin Search page | `/search` |
| API notes | [docs/api/SEARCH.md](../api/SEARCH.md) |

## Verification

- `pnpm --filter @t360/api test` — passed (incl. synonym expansion + OpenSearch stub)
- `pnpm --filter @t360/api build` — passed
- `pnpm --filter @t360/web build` — passed
- `pnpm --filter @t360/admin build` — passed

## Explicitly out of scope (Phase 15+)

OpenSearch/Elasticsearch cluster, production hardening (CI/CD, Docker prod, monitoring), store listings, full CMS.

## Next gate

Phase 15 Production is **NO-GO** until approved.
