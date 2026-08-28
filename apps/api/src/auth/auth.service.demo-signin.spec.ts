import { ForbiddenException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";

describe("AuthService.demoSignIn", () => {
  function build(opts: { demoEnabled?: string }) {
    const prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
      customer: { create: jest.fn() },
    };
    const loyalty = { ensureAccount: jest.fn().mockResolvedValue(undefined) };
    const audit = { log: jest.fn().mockResolvedValue(undefined) };
    const config = {
      get: jest.fn((key: string) => {
        if (key === "DEMO_LOGIN_ENABLED") return opts.demoEnabled;
        if (key === "SEED_ADMIN_EMAIL") return "owner@tharagai.local";
        if (key === "SEED_ADMIN_PASSWORD") return "TharagaiOwner!123";
        return undefined;
      }),
    } as unknown as ConfigService;

    const service = new AuthService(
      prisma as never,
      {} as never,
      {} as never,
      config,
      audit as never,
      loyalty as never,
      { providerName: "mock", sendOtp: jest.fn(), send: jest.fn() },
      { send: jest.fn() } as never,
    );
    return { service, prisma, loyalty, audit };
  }

  it("throws DEMO_LOGIN_DISABLED when flag is off", async () => {
    const { service } = build({});
    await expect(service.demoSignIn("customer")).rejects.toMatchObject({
      response: { code: "DEMO_LOGIN_DISABLED" },
    });
  });

  it("throws DEMO_LOGIN_DISABLED when flag is false", async () => {
    const { service } = build({ demoEnabled: "false" });
    await expect(service.demoSignIn("staff")).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("delegates staff demo to adminLogin when enabled", async () => {
    const { service } = build({ demoEnabled: "1" });
    const adminLogin = jest.spyOn(service, "adminLogin").mockResolvedValue({
      accessToken: "access",
      refreshToken: "refresh",
      tokenType: "Bearer",
      expiresIn: "15m",
    });

    const result = await service.demoSignIn("staff");

    expect(adminLogin).toHaveBeenCalledWith(
      { email: "owner@tharagai.local", password: "TharagaiOwner!123" },
      undefined,
    );
    expect(result.role).toBe("staff");
    expect(result.isNewCustomer).toBe(false);
    expect(result.accessToken).toBe("access");
  });

  it("issues customer tokens for demo mobile when enabled", async () => {
    const { service, prisma, loyalty, audit } = build({ demoEnabled: "true" });
    const user = { id: "user-1", customer: { id: "cust-1" } };
    prisma.user.findUnique.mockResolvedValue(user);
    const issueTokens = jest.spyOn(service as never as { issueTokens: () => Promise<unknown> }, "issueTokens").mockResolvedValue({
      accessToken: "access",
      refreshToken: "refresh",
      tokenType: "Bearer",
      expiresIn: "15m",
    });

    const result = await service.demoSignIn("customer", { ip: "127.0.0.1" });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { mobile: "+919999000001" },
      include: { customer: true },
    });
    expect(loyalty.ensureAccount).toHaveBeenCalledWith("cust-1");
    expect(issueTokens).toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "auth.demo.login", actorId: "user-1" }),
    );
    expect(result.role).toBe("customer");
    expect(result.isNewCustomer).toBe(false);
  });
});
