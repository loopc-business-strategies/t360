import {
  Body,
  Controller,
  Get,
  Post,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { CurrentUser, RequirePermissions } from "../common/decorators";
import { DemoDataService } from "./demo-data.service";

@ApiTags("admin-demo-data")
@ApiBearerAuth()
@Controller("admin/demo-data")
export class DemoDataController {
  constructor(private readonly demo: DemoDataService) {}

  private reqId(req: Request) {
    return (req as Request & { requestId?: string }).requestId;
  }

  @Get("status")
  @RequirePermissions("settings.manage")
  async status(@Req() req: Request) {
    return { success: true, data: await this.demo.status(), requestId: this.reqId(req) };
  }

  @Post("seed")
  @RequirePermissions("settings.manage")
  async seed(@CurrentUser() user: { userId: string }, @Req() req: Request) {
    return {
      success: true,
      data: await this.demo.seed(user.userId),
      requestId: this.reqId(req),
    };
  }

  @Post("remove")
  @RequirePermissions("settings.manage")
  async remove(
    @Body() body: { confirm?: string },
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    if (body?.confirm !== "REMOVE_DEMO_DATA") {
      return {
        success: false,
        error: {
          code: "CONFIRMATION_REQUIRED",
          message: 'Pass confirm: "REMOVE_DEMO_DATA" to proceed',
        },
        requestId: this.reqId(req),
      };
    }
    return {
      success: true,
      data: await this.demo.remove(user.userId),
      requestId: this.reqId(req),
    };
  }

  @Post("reset")
  @RequirePermissions("settings.manage")
  async reset(
    @Body() body: { confirm?: string },
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    if (body?.confirm !== "RESET_DEMO_DATA") {
      return {
        success: false,
        error: {
          code: "CONFIRMATION_REQUIRED",
          message: 'Pass confirm: "RESET_DEMO_DATA" to proceed',
        },
        requestId: this.reqId(req),
      };
    }
    return {
      success: true,
      data: await this.demo.reset(user.userId),
      requestId: this.reqId(req),
    };
  }
}
