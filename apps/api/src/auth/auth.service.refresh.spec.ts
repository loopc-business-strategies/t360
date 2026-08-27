import { UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";

describe("AuthService.refresh reuse", () => {
  it("kills family when a revoked refresh token is replayed", async () => {
    const familyId = "fam-1";
    const session = {
      id: "sess-old",
      userId: "user-1",
      familyId,
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      refreshTokenHash: "hash",
    };
    const prisma = {
      session: {
        findFirst: jest.fn().mockResolvedValue(session),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn(),
        create: jest.fn(),
      },
      user: { findUnique: jest.fn() },
    };
    const audit = { log: jest.fn() };
    const service = new AuthService(
      prisma as never,
      {} as never,
      {} as never,
      { get: jest.fn(), getOrThrow: jest.fn() } as never,
      audit as never,
      {} as never,
      { providerName: "mock", sendOtp: jest.fn(), send: jest.fn() } as never,
      { send: jest.fn() } as never,
    );
    (service as unknown as { hashToken: (t: string) => string }).hashToken = () => "hash";

    await expect(service.refresh("old-token")).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.session.updateMany).toHaveBeenCalledWith({
      where: { familyId, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "auth.refresh.reuse" }),
    );
  });
});
