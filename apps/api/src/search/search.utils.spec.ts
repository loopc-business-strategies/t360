import { ServiceUnavailableException } from "@nestjs/common";
import { expandSearchQuery } from "./search.utils";
import { OpenSearchSearchProvider } from "./providers/opensearch-search.provider";

describe("expandSearchQuery", () => {
  const synonyms = [
    { term: "chudidar", aliases: ["chudi", "salwar"] },
    { term: "shirt", aliases: ["shirts"] },
  ];

  it("expands matching tokens", () => {
    expect(expandSearchQuery("blue chudidar", synonyms)).toContain("OR");
    expect(expandSearchQuery("chudi", synonyms)).toMatch(/chudidar|chudi|salwar/);
  });

  it("leaves unknown tokens alone", () => {
    expect(expandSearchQuery("blue silk", synonyms)).toBe("blue silk");
  });

  it("returns empty for blank", () => {
    expect(expandSearchQuery("  ", synonyms)).toBe("");
  });
});

describe("OpenSearchSearchProvider stub", () => {
  it("fails closed", async () => {
    const os = new OpenSearchSearchProvider();
    await expect(os.searchProducts({ q: "x" })).rejects.toBeInstanceOf(ServiceUnavailableException);
    await expect(os.suggest("x")).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
