import { Module } from "@nestjs/common";
import { RbacController } from "./rbac.controller";
import { PermissionsGuard } from "./permissions.guard";
import { AuditModule } from "../audit/audit.module";

@Module({
  imports: [AuditModule],
  controllers: [RbacController],
  providers: [PermissionsGuard],
  exports: [PermissionsGuard],
})
export class RbacModule {}
