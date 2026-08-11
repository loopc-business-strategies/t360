import { Controller, Get, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { Public } from "../common/decorators";
import { PrismaService } from "../prisma/prisma.service";

@ApiTags("branches-public")
@Controller("branches")
export class BranchesPublicController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async list(@Req() req: Request) {
    const data = await this.prisma.branch.findMany({
      where: { deletedAt: null, status: "active" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        address: true,
        phone: true,
        hours: true,
        status: true,
      },
    });
    return {
      success: true,
      data,
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
