import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PermissionsGuard } from "../rbac/permissions.guard";

function mockContext(user: { permissions?: string[] } | undefined, handlerMeta: Record<string, unknown>) {
  const reflector = {
    getAllAndOverride: (key: string) => handlerMeta[key],
  } as unknown as Reflector;
  const guard = new PermissionsGuard(reflector);
  const context = {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
  return { guard, context };
}

describe("PermissionsGuard", () => {
  it("allows when permission present", () => {
    const { guard, context } = mockContext(
      { permissions: ["customers.read"] },
      { permissions: ["customers.read"] },
    );
    expect(guard.canActivate(context)).toBe(true);
  });

  it("blocks when permission missing", () => {
    const { guard, context } = mockContext({ permissions: [] }, { permissions: ["customers.read"] });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it("allows granular AI studio perms when legacy ai.fashion is present", () => {
    const { guard, context } = mockContext(
      { permissions: ["ai.fashion"] },
      { permissions: ["ai_fashion.generate"] },
    );
    expect(guard.canActivate(context)).toBe(true);
  });

  it("blocks ai_settings.update via legacy ai.fashion", () => {
    const { guard, context } = mockContext(
      { permissions: ["ai.fashion"] },
      { permissions: ["ai_settings.update"] },
    );
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it("blocks ai_fashion.delete via legacy ai.fashion", () => {
    const { guard, context } = mockContext(
      { permissions: ["ai.fashion"] },
      { permissions: ["ai_fashion.delete"] },
    );
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it("allows any-of mode when one permission matches", () => {
    const { guard, context } = mockContext(
      { permissions: ["products.create"] },
      { permissions: ["products.update", "products.create"], permissionsMode: "any" },
    );
    expect(guard.canActivate(context)).toBe(true);
  });
});
