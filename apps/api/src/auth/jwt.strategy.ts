import { ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../prisma/prisma.service";

export type JwtPayload = {
  sub: string;
  permissions: string[];
  typ: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>("JWT_ACCESS_SECRET"),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, status: true },
    });
    if (!user) {
      throw new UnauthorizedException({ code: "INVALID_TOKEN", message: "Invalid token" });
    }
    if (user.status !== "active") {
      throw new ForbiddenException({ code: "ACCOUNT_INACTIVE", message: "Account is inactive" });
    }
    return {
      userId: payload.sub,
      permissions: payload.permissions ?? [],
    };
  }
}
