# AI API — Phase 12 (Tharagai AI)

Tool-gated shopping and admin assistants. The LLM has **no unrestricted database access**; only registered tools fetch business data. Tools re-check authz and return structured results. If data is missing, the assistant must say so — no invented prices, stock, or products.

## Env

| Variable | Values | Default |
|----------|--------|---------|
| `AI_PROVIDER` | `mock` \| `openai` | `mock` |
| `OPENAI_API_KEY` | secret | — (required when `openai`) |
| `OPENAI_MODEL` | model id | `gpt-4o-mini` |

Feature flag: SystemSetting `ai.enabled` (boolean). When false, chat endpoints return `AI_DISABLED`.

## Permissions

| Permission | Use |
|------------|-----|
| (JWT customer) | `/ai/*` customer tools |
| `ai.admin` | `/admin/ai/*` admin tools |

## Endpoints

| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/v1/ai/chat` | `{ conversationId?, message }` |
| GET | `/api/v1/ai/conversations` | list mine (customer) |
| GET | `/api/v1/ai/conversations/:id` | messages |
| POST | `/api/v1/admin/ai/chat` | admin audience + tools |
| GET | `/api/v1/admin/ai/conversations` | admin conversations |

Rate limit: Redis `rate:ai:{userId}` (e.g. 30 / 10 min).

## Customer tools

`searchProducts`, `getProduct`, `checkStock`, `getBranchAvailability`, `getOrderStatus`, `getCustomerLoyalty`, `getOffers`, `searchCategories`

## Admin tools

`salesSummary`, `bestSellers`, `lowStockHighSellers`, `draftProductCaption`

No mutating tools (price, inventory, refunds, cancel, account changes).
