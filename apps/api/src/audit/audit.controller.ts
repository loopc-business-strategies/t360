import { Controller, Get, Query, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { Prisma } from "@prisma/client";
import { RequirePermissions } from "../common/decorators";
import { PrismaService } from "../prisma/prisma.service";

const SECRET_META_KEYS = /password|secret|token|apikey|api_key|credential|refresh/i;

function sanitizeMetadata(meta: unknown): unknown {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return meta;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta as Record<string, unknown>)) {
    if (SECRET_META_KEYS.test(k)) continue;
    out[k] = v;
  }
  return out;
}

@ApiTags("audit")
@ApiBearerAuth()
@Controller("audit")
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermissions("audit.read")
  async list(
    @Query("take") take = "20",
    @Query("q") q: string | undefined,
    @Query("action") action: string | undefined,
    @Req() req: Request,
  ) {
    const where: Prisma.AuditLogWhereInput = {};
    if (action?.trim()) {
      where.action = { contains: action.trim(), mode: "insensitive" };
    }
    if (q?.trim()) {
      const term = q.trim();
      where.OR = [
        { action: { contains: term, mode: "insensitive" } },
        { entityType: { contains: term, mode: "insensitive" } },
        { entityId: { contains: term, mode: "insensitive" } },
      ];
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(Number(take) || 20, 100),
    });
    return {
      success: true,
      data: logs.map((row) => ({
        ...row,
        metadata: sanitizeMetadata(row.metadata),
      })),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
