import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY, PERMISSIONS_KEY } from "../common/decorators";

/** Legacy `ai.fashion` grants any granular ai_fashion.* / ai_models.* / ai_settings.* check */
const AI_FASHION_ALIAS_PREFIXES = ["ai_fashion.", "ai_models.", "ai_settings."];

function hasPermission(perms: string[], required: string): boolean {
  if (perms.includes(required)) return true;
  if (perms.includes("ai.fashion") && AI_FASHION_ALIAS_PREFIXES.some((p) => required.startsWith(p))) {
    return true;
  }
  return false;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as { permissions?: string[] } | undefined;
    const perms = user?.permissions ?? [];
    const ok = required.every((p) => hasPermission(perms, p));
    if (!ok) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "Missing required permissions",
        details: { required },
      });
    }
    return true;
  }
}
