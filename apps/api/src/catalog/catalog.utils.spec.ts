import { isUuid, parseProductCsv, slugify, validateCsvProductRow } from "./catalog.utils";

describe("catalog.utils", () => {
  it("slugifies names", () => {
    expect(slugify("Men's Premium Shirt!")).toBe("men-s-premium-shirt");
  });

  it("parses csv and validates rows", () => {
    const rows = parseProductCsv(
      "name,category_slug,sku,price\nBlue Shirt,mens-shirts,SKU-1,1299\n,bad,,x",
    );
    expect(rows).toHaveLength(2);
    expect(validateCsvProductRow(rows[0])).toHaveLength(0);
    expect(validateCsvProductRow(rows[1]).length).toBeGreaterThan(0);
  });

  it("detects UUID strings for product id lookup", () => {
    expect(isUuid("5fc9ef48-0309-4144-92a0-9f7c9e81c468")).toBe(true);
    expect(isUuid("kids-party-dress-30")).toBe(false);
    expect(isUuid("not-a-uuid")).toBe(false);
  });
});
