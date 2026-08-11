import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { SearchService } from "./search.service";
import { SearchAdminController, SearchPublicController } from "./search.controller";
import { SEARCH_PROVIDER } from "./providers/search-provider";
import { PostgresSearchProvider } from "./providers/postgres-search.provider";
import { OpenSearchSearchProvider } from "./providers/opensearch-search.provider";

@Module({
  imports: [AuditModule],
  controllers: [SearchPublicController, SearchAdminController],
  providers: [
    SearchService,
    PostgresSearchProvider,
    OpenSearchSearchProvider,
    {
      provide: SEARCH_PROVIDER,
      useFactory: (pg: PostgresSearchProvider, os: OpenSearchSearchProvider) => {
        if (process.env.SEARCH_PROVIDER === "opensearch") return os;
        return pg;
      },
      inject: [PostgresSearchProvider, OpenSearchSearchProvider],
    },
  ],
  exports: [SEARCH_PROVIDER, SearchService],
})
export class SearchModule {}
