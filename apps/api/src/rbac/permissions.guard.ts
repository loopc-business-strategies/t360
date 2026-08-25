import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY, PERMISSIONS_KEY, PERMISSIONS_MODE_KEY } from "../common/decorators";

/**
 * Legacy `ai.fashion` grants studio workflow perms only — not settings or destructive deletes.
 */
const AI_FASHION_ALIAS_ALLOWED = new Set([
  "ai_fashion.view",
  "ai_fashion.generate",
  "ai_fashion.approve",
  "ai_fashion.retry",
  "ai_models.view",
  "ai_models.create",
  "ai_models.update",
]);

export function hasPermission(perms: string[], required: string): boolean {
  if (perms.includes(required)) return true;
  if (perms.includes("ai.fashion") && AI_FASHION_ALIAS_ALLOWED.has(required)) {
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

    const mode =
      this.reflector.getAllAndOverride<"all" | "any">(PERMISSIONS_MODE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? "all";

    const request = context.switchToHttp().getRequest();
    const user = request.user as { permissions?: string[] } | undefined;
    const perms = user?.permissions ?? [];
    const ok =
      mode === "any"
        ? required.some((p) => hasPermission(perms, p))
        : required.every((p) => hasPermission(perms, p));
    if (!ok) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "Missing required permissions",
        details: { required, mode },
      });
    }
    return true;
  }
}
