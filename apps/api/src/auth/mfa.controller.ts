import { Body, Controller, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";
import { Request } from "express";
import { CurrentUser, RequirePermissions } from "../common/decorators";
import { AuthService } from "./auth.service";

class MfaCodeDto {
  @IsString()
  @Length(6, 6)
  code!: string;
}

@ApiTags("auth")
@ApiBearerAuth()
@Controller("auth/mfa")
export class MfaController {
  constructor(private readonly auth: AuthService) {}

  @Post("setup")
  @RequirePermissions("settings.manage")
  async setup(@CurrentUser() user: { userId: string }, @Req() req: Request) {
    const data = await this.auth.enableMfaSetup(user.userId);
    return { success: true, data, requestId: (req as Request & { requestId?: string }).requestId };
  }

  @Post("enable")
  @RequirePermissions("settings.manage")
  async enable(
    @CurrentUser() user: { userId: string },
    @Body() body: MfaCodeDto,
    @Req() req: Request,
  ) {
    const data = await this.auth.confirmMfa(user.userId, body.code);
    return { success: true, data, requestId: (req as Request & { requestId?: string }).requestId };
  }
}
