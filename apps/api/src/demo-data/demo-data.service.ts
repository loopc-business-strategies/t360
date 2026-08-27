import { BadRequestException, Injectable } from "@nestjs/common";
import { DEMO_BATCH_ID } from "./engine/constants";
import {
  demoCatalogStatus,
  removeDemoCatalog,
  resetDemoCatalog,
  seedDemoCatalog,
} from "./engine/seed";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class DemoDataService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private assertAllowed() {
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
      throw new BadRequestException({
        code: "DEMO_SEED_BLOCKED",
        message: "Demo seed is blocked in production. Set ALLOW_DEMO_SEED=true to allow.",
      });
    }
  }

  status() {
    return demoCatalogStatus(this.prisma);
  }

  async seed(actorId?: string) {
    this.assertAllowed();
    const data = await seedDemoCatalog(this.prisma);
    await this.audit.log({
      actorId,
      action: "demo.seed",
      entityType: "DemoCatalog",
      entityId: DEMO_BATCH_ID,
      metadata: data as never,
    });
    return data;
  }

  async remove(actorId?: string) {
    this.assertAllowed();
    const data = await removeDemoCatalog(this.prisma);
    await this.audit.log({
      actorId,
      action: "demo.remove",
      entityType: "DemoCatalog",
      entityId: DEMO_BATCH_ID,
      metadata: data as never,
    });
    return data;
  }

  async reset(actorId?: string) {
    this.assertAllowed();
    const data = await resetDemoCatalog(this.prisma);
    await this.audit.log({
      actorId,
      action: "demo.reset",
      entityType: "DemoCatalog",
      entityId: DEMO_BATCH_ID,
      metadata: data as never,
    });
    return data;
  }
}
