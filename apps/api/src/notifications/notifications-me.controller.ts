import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { deviceTokenSchema, notificationPrefsUpdateSchema } from "@t360/validation";
import { CurrentUser } from "../common/decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { NotificationsService } from "./notifications.service";

@ApiTags("notifications")
@ApiBearerAuth()
@Controller("notifications/me")
export class NotificationsMeController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get("preferences")
  async prefs(@CurrentUser() user: { userId: string }, @Req() req: Request) {
    return {
      success: true,
      data: await this.notifications.getPrefs(user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Patch("preferences")
  async updatePrefs(
    @CurrentUser() user: { userId: string },
    @Body(new ZodValidationPipe(notificationPrefsUpdateSchema))
    body: {
      marketingEmail?: boolean;
      marketingSms?: boolean;
      marketingPush?: boolean;
      marketingWhatsapp?: boolean;
    },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.notifications.updatePrefs(user.userId, body, user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Get()
  async list(@CurrentUser() user: { userId: string }, @Req() req: Request) {
    return {
      success: true,
      data: await this.notifications.listMine(user.userId),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Post("devices")
  async registerDevice(
    @CurrentUser() user: { userId: string },
    @Body(new ZodValidationPipe(deviceTokenSchema)) body: { token: string; platform: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.notifications.registerDevice(user.userId, body.token, body.platform),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Delete("devices/:token")
  async unregister(
    @Param("token") token: string,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    return {
      success: true,
      data: await this.notifications.unregisterDevice(user.userId, decodeURIComponent(token)),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
