# AI Architecture — Tharagai AI (t360)

## Product

**Tharagai AI** — customer shopping assistant and optional admin business assistant.

## Non-negotiable rules

1. LLM has **no unrestricted database access**.
2. Only **registered tools** may fetch business data.
3. Tools enforce authentication, authorization, validation, rate limits, and business rules.
4. AI must **never hallucinate** price, stock, availability, delivery promise, discount, or product existence.
5. If data is unavailable, the assistant **clearly says so**.
6. AI cannot change price, inventory, issue refunds, cancel orders, or modify accounts without a separate authorized backend workflow (not a free-form tool).

## Provider port

```ts
interface AiProvider {
  chat(input: ChatInput): Promise<ChatResult> // tool-calling capable
}
```

Initial adapter: OpenAI. Replaceable later.

## Customer tools

| Tool | Purpose |
|------|---------|
| `searchProducts` | Catalogue search with filters |
| `getProduct` | Product + variant details |
| `checkStock` | Available qty |
| `getBranchAvailability` | Per-branch availability |
| `getOrderStatus` | Caller’s order only |
| `getCustomerLoyalty` | Caller’s loyalty |
| `getOffers` | Active public offers |
| `searchCategories` | Category navigation |

## Admin tools (RBAC-gated)

Examples: best sellers summary, declining categories, low-stock high-sellers, sales summary, caption draft for a product.  
Each tool checks the employee’s permissions and branch scope.

## Flow

```
User message → AiModule (auth + rate limit)
  → AiProvider with tool definitions
  → Tool execution (Nest services)
  → Model final answer grounded in tool results
  → Persist AIConversation / AIMessage
```

## Safety

- Max tokens / max tool rounds
- PII minimization in logs
- Sentry for tool failures
- Feature flag to disable AI if provider outage

## Testing

- Unit tests: tool authz denials
- Integration: “under ₹1500 shirts” returns only matching real products
- Golden tests: empty stock → unavailable statement
