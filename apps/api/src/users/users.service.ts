import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuthService } from "../auth/auth.service";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        customer: true,
        employee: true,
        roles: { include: { role: true } },
      },
    });
    if (!user) {
      throw new NotFoundException({ code: "USER_NOT_FOUND", message: "User not found" });
    }
    const permissions = await this.auth.getUserPermissions(userId);
    return {
      id: user.id,
      email: user.email,
      mobile: user.mobile,
      mfaEnabled: user.mfaEnabled,
      roles: user.roles.map((r) => r.role.code),
      permissions,
      customer: user.customer,
      employee: user.employee,
    };
  }
}
