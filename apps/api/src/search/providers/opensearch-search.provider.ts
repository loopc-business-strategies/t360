import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import type { ProductListQuery } from "@t360/validation";
import type { SearchHit, SearchProvider, SuggestItem } from "./search-provider";

/**
 * Stub — OpenSearch is deferred (not justified). Selecting this provider fails closed.
 */
@Injectable()
export class OpenSearchSearchProvider implements SearchProvider {
  async searchProducts(_query: ProductListQuery, _opts?: { admin?: boolean }): Promise<SearchHit> {
    throw new ServiceUnavailableException({
      code: "SEARCH_PROVIDER_UNAVAILABLE",
      message: "OpenSearch is not configured. Use SEARCH_PROVIDER=postgres.",
    });
  }

  async suggest(_q: string, _limit?: number): Promise<SuggestItem[]> {
    throw new ServiceUnavailableException({
      code: "SEARCH_PROVIDER_UNAVAILABLE",
      message: "OpenSearch is not configured. Use SEARCH_PROVIDER=postgres.",
    });
  }
}
