import { parseProductCsv, slugify, validateCsvProductRow } from "./catalog.utils";

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
});
