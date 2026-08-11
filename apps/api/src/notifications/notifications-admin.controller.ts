import { Controller, Get, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { RequirePermissions } from "../common/decorators";
import { NotificationsService } from "./notifications.service";

@ApiTags("admin-notifications")
@ApiBearerAuth()
@Controller("admin")
export class NotificationsAdminController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get("notification-templates")
  @RequirePermissions("notifications.manage")
  async templates(@Req() req: Request) {
    return {
      success: true,
      data: await this.notifications.listTemplates(),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }

  @Get("notifications")
  @RequirePermissions("notifications.manage")
  async list(@Req() req: Request) {
    return {
      success: true,
      data: await this.notifications.listAdminNotifications(),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
