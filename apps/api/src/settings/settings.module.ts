import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AdminSettingsController, SettingsController } from "./settings.controller";
import { SettingsService } from "./settings.service";

@Module({
  imports: [AuditModule],
  controllers: [SettingsController, AdminSettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
