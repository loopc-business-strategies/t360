import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";
import { AuditModule } from "../audit/audit.module";
import { LoyaltyModule } from "../loyalty/loyalty.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { MfaController } from "./mfa.controller";

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    AuditModule,
    LoyaltyModule,
    NotificationsModule,
  ],
  controllers: [AuthController, MfaController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
