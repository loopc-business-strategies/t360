import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { DemoDataController } from "./demo-data.controller";
import { DemoDataService } from "./demo-data.service";

@Module({
  imports: [AuditModule],
  controllers: [DemoDataController],
  providers: [DemoDataService],
  exports: [DemoDataService],
})
export class DemoDataModule {}
