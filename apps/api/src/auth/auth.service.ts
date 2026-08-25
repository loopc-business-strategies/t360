import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as argon2 from "argon2";
import { createHash, randomInt, randomUUID } from "crypto";
import { authenticator } from "otplib";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { Inject } from "@nestjs/common";
import { SMS_PROVIDER, SmsProvider } from "../notifications/providers/sms-provider";
import { AuditService } from "../audit/audit.service";
import { LoyaltyService } from "../loyalty/loyalty.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
    private readonly loyalty: LoyaltyService,
    @Inject(SMS_PROVIDER) private readonly sms: SmsProvider,
  ) {}

  private otpKey(mobile: string) {
    return `otp:${mobile}`;
  }

  private rateKey(kind: string, id: string) {
    return `rate:${kind}:${id}`;
  }

  async assertRateLimit(kind: string, id: string, limit: number, windowSec: number) {
    const key = this.rateKey(kind, id);
    const count = await this.redis.client.incr(key);
    if (count === 1) {
      await this.redis.client.expire(key, windowSec);
    }
    if (count > limit) {
      throw new ForbiddenException({
        code: "RATE_LIMITED",
        message: "Too many attempts. Try again later.",
      });
    }
  }

  async requestOtp(mobile: string, ip?: string) {
    await this.assertRateLimit("otp-request", mobile, 5, 600);
    if (ip) await this.assertRateLimit("otp-request-ip", ip, 20, 600);

    const code = String(randomInt(100000, 999999));
    await this.redis.client.set(this.otpKey(mobile), code, "EX", 300);
    await this.sms.sendOtp(mobile, code);
    return { sent: true, expiresInSeconds: 300, provider: "mock" };
  }

  async verifyOtp(mobile: string, code: string, meta?: { ip?: string; userAgent?: string }) {
    await this.assertRateLimit("otp-verify", mobile, 10, 600);
    const stored = await this.redis.client.get(this.otpKey(mobile));
    if (!stored || stored !== code) {
      throw new UnauthorizedException({ code: "INVALID_OTP", message: "Invalid or expired OTP" });
    }
    await this.redis.client.del(this.otpKey(mobile));

    let user = await this.prisma.user.findUnique({
      where: { mobile },
      include: { customer: true },
    });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          mobile,
          customer: { create: { name: null } },
        },
        include: { customer: true },
      });
    } else if (!user.customer) {
      await this.prisma.customer.create({ data: { userId: user.id } });
      user = await this.prisma.user.findUniqueOrThrow({
        where: { id: user.id },
        include: { customer: true },
      });
    }
    if (user.customer) {
      await this.loyalty.ensureAccount(user.customer.id);
    }

    const tokens = await this.issueTokens(user.id, meta);
    await this.audit.log({
      actorId: user.id,
      action: "auth.otp.login",
      ip: meta?.ip,
    });
    return tokens;
  }

  async adminLogin(
    input: { email?: string; employeeCode?: string; password: string; mfaCode?: string },
    meta?: { ip?: string; userAgent?: string },
  ) {
    const rateId = (input.email ?? input.employeeCode ?? "unknown").toLowerCase();
    await this.assertRateLimit("admin-login", rateId, 10, 900);

    let user = input.email
      ? await this.prisma.user.findUnique({
          where: { email: input.email.toLowerCase() },
          include: { employee: true },
        })
      : null;

    if (!user && input.employeeCode) {
      const emp = await this.prisma.employee.findFirst({
        where: {
          employeeCode: { equals: input.employeeCode.trim(), mode: "insensitive" },
          deletedAt: null,
        },
        include: { user: { include: { employee: true } } },
      });
      user = emp?.user ?? null;
    }

    if (!user?.passwordHash) {
      throw new UnauthorizedException({ code: "INVALID_CREDENTIALS", message: "Invalid credentials" });
    }
    if (user.status !== "active") {
      throw new ForbiddenException({ code: "ACCOUNT_INACTIVE", message: "Account is inactive" });
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException({ code: "ACCOUNT_LOCKED", message: "Account temporarily locked" });
    }

    const ok = await argon2.verify(user.passwordHash, input.password);
    if (!ok) {
      const failed = user.failedLogins + 1;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLogins: failed,
          lockedUntil: failed >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
        },
      });
      throw new UnauthorizedException({ code: "INVALID_CREDENTIALS", message: "Invalid credentials" });
    }

    if (user.mfaEnabled) {
      if (!input.mfaCode || !user.mfaSecret || !authenticator.check(input.mfaCode, user.mfaSecret)) {
        throw new UnauthorizedException({ code: "MFA_REQUIRED", message: "Valid MFA code required" });
      }
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLogins: 0, lockedUntil: null },
    });

    const tokens = await this.issueTokens(user.id, meta);
    await this.audit.log({ actorId: user.id, action: "auth.admin.login", ip: meta?.ip });
    return tokens;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.passwordHash) {
      throw new BadRequestException({ code: "NO_PASSWORD", message: "Account has no password" });
    }
    const ok = await argon2.verify(user.passwordHash, currentPassword);
    if (!ok) {
      throw new UnauthorizedException({ code: "INVALID_CREDENTIALS", message: "Current password is incorrect" });
    }
    const passwordHash = await argon2.hash(newPassword);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.audit.log({ actorId: userId, action: "auth.password.change" });
    return { changed: true, sessionsRevoked: true };
  }

  async logoutAll(userId: string) {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.audit.log({ actorId: userId, action: "auth.logout_all" });
    return { revoked: true };
  }

  async listSessions(userId: string, currentRefreshToken?: string) {
    const currentHash = currentRefreshToken ? this.hashToken(currentRefreshToken) : null;
    const sessions = await this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userAgent: true,
        ip: true,
        createdAt: true,
        expiresAt: true,
        refreshTokenHash: true,
      },
    });
    return sessions.map((s) => ({
      id: s.id,
      userAgent: s.userAgent,
      ip: s.ip,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      current: currentHash ? s.refreshTokenHash === currentHash : false,
    }));
  }

  async refresh(refreshToken: string, meta?: { ip?: string; userAgent?: string }) {
    const hash = this.hashToken(refreshToken);
    const session = await this.prisma.session.findFirst({
      where: { refreshTokenHash: hash, revokedAt: null },
    });
    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException({ code: "INVALID_REFRESH", message: "Invalid refresh token" });
    }

    // Rotation: revoke current, issue new in same family
    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    // Reuse detection: if already revoked twin used, kill family
    const reused = await this.prisma.session.findFirst({
      where: { refreshTokenHash: hash, revokedAt: { not: null }, id: { not: session.id } },
    });
    if (reused) {
      await this.prisma.session.updateMany({
        where: { familyId: session.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException({ code: "REFRESH_REUSE", message: "Refresh token reuse detected" });
    }

    return this.issueTokens(session.userId, meta, session.familyId);
  }

  async logout(refreshToken: string) {
    const hash = this.hashToken(refreshToken);
    await this.prisma.session.updateMany({
      where: { refreshTokenHash: hash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { revoked: true };
  }

  async enableMfaSetup(userId: string) {
    const secret = authenticator.generateSecret();
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret, mfaEnabled: false },
    });
    return {
      secret,
      otpauthUrl: authenticator.keyuri("tharagai", "t360-admin", secret),
      note: "Confirm with mfa/enable using a TOTP code to activate",
    };
  }

  async confirmMfa(userId: string, code: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.mfaSecret || !authenticator.check(code, user.mfaSecret)) {
      throw new BadRequestException({ code: "INVALID_MFA", message: "Invalid MFA code" });
    }
    await this.prisma.user.update({ where: { id: userId }, data: { mfaEnabled: true } });
    return { mfaEnabled: true };
  }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  private async issueTokens(
    userId: string,
    meta?: { ip?: string; userAgent?: string },
    familyId?: string,
  ) {
    const sessionFamilyId = familyId ?? randomUUID();
    const permissions = await this.getUserPermissions(userId);
    const accessToken = await this.jwt.signAsync(
      { sub: userId, permissions, typ: "access" },
      {
        secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
        expiresIn: (this.config.get<string>("JWT_ACCESS_TTL") ?? "15m") as `${number}m`,
      },
    );

    const refreshToken = `${randomUUID()}.${randomUUID()}`;
    const days = Number(this.config.get("JWT_REFRESH_TTL_DAYS") ?? 30);
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: this.hashToken(refreshToken),
        familyId: sessionFamilyId,
        expiresAt,
        ip: meta?.ip,
        userAgent: meta?.userAgent,
      },
    });

    return {
      accessToken,
      refreshToken,
      tokenType: "Bearer",
      expiresIn: this.config.get<string>("JWT_ACCESS_TTL") ?? "15m",
    };
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const rows = await this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } },
          },
        },
      },
    });
    const set = new Set<string>();
    for (const ur of rows) {
      for (const rp of ur.role.permissions) {
        set.add(rp.permission.code);
      }
    }
    return [...set];
  }
}
