import { Controller, Get, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { CurrentUser } from "../common/decorators";
import { UsersService } from "./users.service";

@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get("me")
  async me(@CurrentUser() user: { userId: string }, @Req() req: Request) {
    const data = await this.users.getMe(user.userId);
    return {
      success: true,
      data,
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
