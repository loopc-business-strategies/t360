import { Module, forwardRef } from "@nestjs/common";
import { CatalogService } from "./catalog.service";
import { CatalogPublicController } from "./catalog-public.controller";
import { CatalogAdminController } from "./catalog-admin.controller";
import { CollectionsPublicController } from "./collections-public.controller";
import { CollectionsAdminController, ReviewsController } from "./collections-admin.controller";
import { CollectionsService } from "./collections.service";
import { ReviewsService } from "./reviews.service";
import { AuditModule } from "../audit/audit.module";
import { MediaModule } from "../media/media.module";
import { InventoryModule } from "../inventory/inventory.module";
import { SearchModule } from "../search/search.module";
import { AiFashionModule } from "../ai-fashion/ai-fashion.module";
import { CustomersModule } from "../customers/customers.module";

@Module({
  imports: [
    AuditModule,
    MediaModule,
    InventoryModule,
    SearchModule,
    CustomersModule,
    forwardRef(() => AiFashionModule),
  ],
  controllers: [
    CatalogPublicController,
    CatalogAdminController,
    CollectionsPublicController,
    CollectionsAdminController,
    ReviewsController,
  ],
  providers: [CatalogService, CollectionsService, ReviewsService],
  exports: [CatalogService, CollectionsService, ReviewsService],
})
export class CatalogModule {}
