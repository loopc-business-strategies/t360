import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async status() {
    return {
      status: "ok",
      service: "t360-api",
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION ?? "0.0.0",
      gitSha: process.env.GIT_SHA ?? null,
    };
  }

  async readiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const pong = await this.redis.ping();
      if (pong !== "PONG") {
        throw new Error("Redis not ready");
      }
      const cloudinary =
        Boolean(process.env.CLOUDINARY_CLOUD_NAME?.trim()) &&
        Boolean(process.env.CLOUDINARY_API_KEY?.trim()) &&
        Boolean(process.env.CLOUDINARY_API_SECRET?.trim());
      const fashionProvider = process.env.FASHION_AI_PROVIDER?.trim() || "disabled";
      const fashionConfigured =
        fashionProvider === "fashn" && Boolean(process.env.FASHN_API_KEY?.trim());
      return {
        status: "ready",
        database: "up",
        redis: "up",
        storage: cloudinary ? "cloudinary" : "mock",
        fashionAi: {
          provider: fashionProvider,
          configured: fashionConfigured,
        },
      };
    } catch {
      throw new ServiceUnavailableException({
        code: "NOT_READY",
        message: "Dependencies not ready",
      });
    }
  }
}
