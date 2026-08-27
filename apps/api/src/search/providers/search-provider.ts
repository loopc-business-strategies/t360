import type { ProductListQuery } from "@t360/validation";

export type SearchHit = {
  ids: string[];
  total: number;
  scores?: Record<string, number>;
};

export type SuggestItem = {
  text: string;
  type: "product" | "category" | "brand" | "collection";
  slug?: string;
  tryOnEnabled?: boolean;
};

export interface SearchProvider {
  searchProducts(
    query: ProductListQuery,
    opts?: { admin?: boolean },
  ): Promise<SearchHit>;
  suggest(q: string, limit?: number): Promise<SuggestItem[]>;
}

export const SEARCH_PROVIDER = Symbol("SEARCH_PROVIDER");
