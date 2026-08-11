import { Body, Controller, HttpCode, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import {
  adminLoginSchema,
  otpRequestSchema,
  otpVerifySchema,
  refreshSchema,
} from "@t360/validation";
import { Public } from "../common/decorators";
import { AuthService } from "./auth.service";
import { ZodValidationPipe } from "../common/zod-validation.pipe";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @HttpCode(200)
  @Post("otp/request")
  async requestOtp(
    @Body(new ZodValidationPipe(otpRequestSchema)) body: { mobile: string },
    @Req() req: Request,
  ) {
    const data = await this.auth.requestOtp(body.mobile, req.ip);
    return { success: true, data, requestId: (req as Request & { requestId?: string }).requestId };
  }

  @Public()
  @HttpCode(200)
  @Post("otp/verify")
  async verifyOtp(
    @Body(new ZodValidationPipe(otpVerifySchema)) body: { mobile: string; code: string },
    @Req() req: Request,
  ) {
    const data = await this.auth.verifyOtp(body.mobile, body.code, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    return { success: true, data, requestId: (req as Request & { requestId?: string }).requestId };
  }

  @Public()
  @HttpCode(200)
  @Post("login")
  async login(
    @Body(new ZodValidationPipe(adminLoginSchema))
    body: { email: string; password: string; mfaCode?: string },
    @Req() req: Request,
  ) {
    const data = await this.auth.adminLogin(body.email.toLowerCase(), body.password, body.mfaCode, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    return { success: true, data, requestId: (req as Request & { requestId?: string }).requestId };
  }

  @Public()
  @HttpCode(200)
  @Post("refresh")
  async refresh(
    @Body(new ZodValidationPipe(refreshSchema)) body: { refreshToken: string },
    @Req() req: Request,
  ) {
    const data = await this.auth.refresh(body.refreshToken, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    return { success: true, data, requestId: (req as Request & { requestId?: string }).requestId };
  }

  @Public()
  @HttpCode(200)
  @Post("logout")
  async logout(
    @Body(new ZodValidationPipe(refreshSchema)) body: { refreshToken: string },
    @Req() req: Request,
  ) {
    const data = await this.auth.logout(body.refreshToken);
    return { success: true, data, requestId: (req as Request & { requestId?: string }).requestId };
  }
}
