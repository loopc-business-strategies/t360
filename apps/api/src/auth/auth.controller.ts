import { Body, Controller, Delete, Get, Headers, HttpCode, Param, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import {
  adminLoginSchema,
  changePasswordSchema,
  demoSignInSchema,
  otpRequestSchema,
  otpVerifySchema,
  passwordForgotSchema,
  passwordResetSchema,
  refreshSchema,
  type AdminLoginInput,
  type ChangePasswordInput,
  type DemoSignInInput,
  type PasswordForgotInput,
  type PasswordResetInput,
} from "@t360/validation";
import { CurrentUser, Public } from "../common/decorators";
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
  @Post("demo/sign-in")
  async demoSignIn(
    @Body(new ZodValidationPipe(demoSignInSchema)) body: DemoSignInInput,
    @Req() req: Request,
  ) {
    const data = await this.auth.demoSignIn(body.role, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    return { success: true, data, requestId: (req as Request & { requestId?: string }).requestId };
  }

  @Public()
  @HttpCode(200)
  @Post("login")
  async login(
    @Body(new ZodValidationPipe(adminLoginSchema)) body: AdminLoginInput,
    @Req() req: Request,
  ) {
    const data = await this.auth.adminLogin(
      {
        email: body.email,
        employeeCode: body.employeeCode,
        password: body.password,
        mfaCode: body.mfaCode,
      },
      {
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      },
    );
    return { success: true, data, requestId: (req as Request & { requestId?: string }).requestId };
  }

  @Public()
  @HttpCode(200)
  @Post("password/forgot")
  async forgotPassword(
    @Body(new ZodValidationPipe(passwordForgotSchema)) body: PasswordForgotInput,
    @Req() req: Request,
  ) {
    const data = await this.auth.forgotPassword(body.email, req.ip);
    return { success: true, data, requestId: (req as Request & { requestId?: string }).requestId };
  }

  @Public()
  @HttpCode(200)
  @Post("password/reset")
  async resetPassword(
    @Body(new ZodValidationPipe(passwordResetSchema)) body: PasswordResetInput,
    @Req() req: Request,
  ) {
    const data = await this.auth.resetPassword(body.token, body.newPassword);
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

  @ApiBearerAuth()
  @HttpCode(200)
  @Post("change-password")
  async changePassword(
    @CurrentUser() user: { userId: string },
    @Body(new ZodValidationPipe(changePasswordSchema)) body: ChangePasswordInput,
    @Req() req: Request,
  ) {
    const data = await this.auth.changePassword(user.userId, body.currentPassword, body.newPassword);
    return { success: true, data, requestId: (req as Request & { requestId?: string }).requestId };
  }

  @ApiBearerAuth()
  @HttpCode(200)
  @Post("reauth")
  async reauth(
    @CurrentUser() user: { userId: string },
    @Body() body: { password?: string },
    @Req() req: Request,
  ) {
    const data = await this.auth.reauth(user.userId, body.password ?? "");
    return { success: true, data, requestId: (req as Request & { requestId?: string }).requestId };
  }

  @ApiBearerAuth()
  @HttpCode(200)
  @Post("logout-all")
  async logoutAll(@CurrentUser() user: { userId: string }, @Req() req: Request) {
    const data = await this.auth.logoutAll(user.userId);
    return { success: true, data, requestId: (req as Request & { requestId?: string }).requestId };
  }

  @ApiBearerAuth()
  @Get("sessions")
  async sessions(
    @CurrentUser() user: { userId: string },
    @Headers("x-refresh-token") refreshToken: string | undefined,
    @Req() req: Request,
  ) {
    const data = await this.auth.listSessions(user.userId, refreshToken);
    return { success: true, data, requestId: (req as Request & { requestId?: string }).requestId };
  }

  @ApiBearerAuth()
  @HttpCode(200)
  @Delete("sessions/:id")
  async revokeSession(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
    @Req() req: Request,
  ) {
    const data = await this.auth.revokeSession(user.userId, id);
    return { success: true, data, requestId: (req as Request & { requestId?: string }).requestId };
  }
}
