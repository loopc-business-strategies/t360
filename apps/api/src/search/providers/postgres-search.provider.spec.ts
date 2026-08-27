import { PostgresSearchProvider } from "./postgres-search.provider";

describe("PostgresSearchProvider category filter", () => {
  const captured: { sql: string; params: unknown[] }[] = [];
  const prisma = {
    $queryRawUnsafe: jest.fn(async (sql: string, ...params: unknown[]) => {
      captured.push({ sql, params });
      // First call is count, second is items
      if (sql.includes("COUNT")) return [{ count: BigInt(2) }];
      return [];
    }),
    searchSynonym: { findMany: jest.fn().mockResolvedValue([]) },
  };

  beforeEach(() => {
    captured.length = 0;
    jest.clearAllMocks();
    process.env.NODE_ENV = "development";
    process.env.DEMO_CATALOG_ENABLED = "true";
  });

  function create() {
    return new PostgresSearchProvider(prisma as never);
  }

  it("scopes leaf category to slug and includes descendant CTE", async () => {
    await create().searchProducts({ category: "men-t-shirts", page: 1, pageSize: 24 });
    expect(captured.length).toBeGreaterThanOrEqual(1);
    const sql = captured[0].sql;
    expect(sql).toContain("cat_tree");
    expect(captured[0].params).toContain("men-t-shirts");
  });

  it("applies size filter without dropping category", async () => {
    await create().searchProducts({
      category: "men-t-shirts",
      size: "M",
      page: 1,
      pageSize: 12,
    });
    expect(captured[0].params).toContain("men-t-shirts");
    expect(captured[0].params.some((p) => String(p).includes("M"))).toBe(true);
  });

  it("keeps category filter when q is set (AND, not override)", async () => {
    await create().searchProducts({
      category: "women-casual-dresses",
      q: "dress",
      page: 1,
      pageSize: 12,
    });
    expect(captured[0].params).toContain("women-casual-dresses");
    expect(captured[0].params.some((p) => String(p).toLowerCase().includes("dress"))).toBe(true);
  });

  it("parent men category still uses same category param (descendants via CTE)", async () => {
    await create().searchProducts({ category: "men", page: 1, pageSize: 24 });
    expect(captured[0].params).toContain("men");
    expect(captured[0].sql).toContain("cat_tree");
  });
});
