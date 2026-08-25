import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "../../common/decorators";
import { PrismaService } from "../../prisma/prisma.service";

export const MOBILE_ADMIN_CLIENT = "mobile-admin";

@Injectable()
export class MobileAdminGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<{
      headers?: Record<string, string | string[] | undefined>;
      path?: string;
      url?: string;
    }>();
    const client = String(req.headers?.["x-t360-client"] ?? "").toLowerCase();
    if (client !== MOBILE_ADMIN_CLIENT) return true;

    // Allow auth endpoints so staff can still log in / refresh when flag is off (to see error after login via /users/me).
    const path = `${req.path ?? ""}${req.url ?? ""}`;
    if (path.includes("/auth/")) return true;

    const row = await this.prisma.systemSetting.findUnique({
      where: { key: "feature.mobile_admin.enabled" },
    });
    const enabled = row?.value === true || row?.value === "true";
    if (!enabled) {
      throw new ForbiddenException({
        code: "MOBILE_ADMIN_DISABLED",
        message: "Mobile admin is disabled by the administrator",
      });
    }
    return true;
  }
}
