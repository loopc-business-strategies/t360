import { Module } from "@nestjs/common";
import { CatalogModule } from "../catalog/catalog.module";
import { InventoryModule } from "../inventory/inventory.module";
import { OrdersModule } from "../orders/orders.module";
import { LoyaltyModule } from "../loyalty/loyalty.module";
import { AiToolsService } from "./ai-tools.service";
import { AiService } from "./ai.service";
import { AiController } from "./ai.controller";
import { AiAdminController } from "./ai-admin.controller";
import { AI_PROVIDER } from "./providers/ai-provider";
import { MockAiProvider } from "./providers/mock-ai.provider";
import { OpenAiProvider } from "./providers/openai-ai.provider";

@Module({
  imports: [CatalogModule, InventoryModule, OrdersModule, LoyaltyModule],
  controllers: [AiController, AiAdminController],
  providers: [
    AiToolsService,
    AiService,
    MockAiProvider,
    OpenAiProvider,
    {
      provide: AI_PROVIDER,
      useFactory: (mock: MockAiProvider, openai: OpenAiProvider) => {
        if (process.env.AI_PROVIDER === "openai" && process.env.OPENAI_API_KEY) {
          return openai;
        }
        return mock;
      },
      inject: [MockAiProvider, OpenAiProvider],
    },
  ],
  exports: [AiService, AiToolsService],
})
export class AiModule {}
