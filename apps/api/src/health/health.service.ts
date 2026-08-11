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
      return { status: "ready", database: "up", redis: "up" };
    } catch {
      throw new ServiceUnavailableException({
        code: "NOT_READY",
        message: "Dependencies not ready",
      });
    }
  }
}
