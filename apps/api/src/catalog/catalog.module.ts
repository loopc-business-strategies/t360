import { Module } from "@nestjs/common";
import { CatalogService } from "./catalog.service";
import { CatalogPublicController } from "./catalog-public.controller";
import { CatalogAdminController } from "./catalog-admin.controller";
import { AuditModule } from "../audit/audit.module";
import { MediaModule } from "../media/media.module";
import { InventoryModule } from "../inventory/inventory.module";
import { SearchModule } from "../search/search.module";

@Module({
  imports: [AuditModule, MediaModule, InventoryModule, SearchModule],
  controllers: [CatalogPublicController, CatalogAdminController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
