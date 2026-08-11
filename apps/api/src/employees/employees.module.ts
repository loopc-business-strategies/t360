import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { EmployeesController } from "./employees.controller";

@Module({
  imports: [AuditModule],
  controllers: [EmployeesController],
})
export class EmployeesModule {}
