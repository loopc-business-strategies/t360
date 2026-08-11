import {
  BadRequestException,
  Injectable,
} from "@nestjs/common";
import { Inject } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { InventoryService } from "../inventory/inventory.service";
import { POS_ADAPTER, type InventoryDelta, type PosAdapter } from "./providers/pos-provider";
import { parseInventoryCsv } from "./pos.utils";

const PROVIDER = "mock";
const KIND = "pos";
const WEBHOOK_PROVIDER = "pos-mock";

@Injectable()
export class PosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly inventory: InventoryService,
    @Inject(POS_ADAPTER) private readonly adapter: PosAdapter,
  ) {}

  async ensureIntegration() {
    return this.prisma.integration.upsert({
      where: { provider_kind: { provider: PROVIDER, kind: KIND } },
      create: {
        provider: PROVIDER,
        kind: KIND,
        status: "ready",
        credentialsRef: "mock://local",
        syncCursor: {},
        config: { label: "Mock POS adapter" },
      },
      update: {},
    });
  }

  async getStatus() {
    const integration = await this.ensureIntegration();
    const healthy = await this.adapter.healthcheck();
    const recentWebhooks = await this.prisma.webhookEvent.count({
      where: {
        provider: WEBHOOK_PROVIDER,
        createdAt: { gte: new Date(Date.now() - 7 * 86400_000) },
      },
    });
    return {
      integration,
      health: healthy,
      providerMode: "mock",
      liveSynced: false,
      notice: "Mock POS adapter only — not connected to a live POS vendor.",
      recentWebhooks7d: recentWebhooks,
    };
  }

  async updateIntegration(
    input: { status?: string; config?: Record<string, unknown> | null },
    actorId?: string,
  ) {
    await this.ensureIntegration();
    const row = await this.prisma.integration.update({
      where: { provider_kind: { provider: PROVIDER, kind: KIND } },
      data: {
        status: input.status,
        config:
          input.config === undefined
            ? undefined
            : input.config === null
              ? Prisma.JsonNull
              : (input.config as Prisma.InputJsonValue),
        lastError: input.status === "ready" ? null : undefined,
      },
    });
    await this.audit.log({
      actorId,
      action: "pos.integration.update",
      entityType: "Integration",
      entityId: row.id,
      metadata: { status: row.status },
    });
    return row;
  }

  async syncInventory(actorId?: string) {
    const integration = await this.ensureIntegration();
    if (integration.status !== "ready") {
      throw new BadRequestException({
        code: "POS_DISABLED",
        message: "POS integration is not ready",
      });
    }

    const cursor = (integration.syncCursor as { inventorySince?: string } | null) ?? {};
    const since = cursor.inventorySince ? new Date(cursor.inventorySince) : undefined;

    try {
      const deltas = await this.adapter.pullInventory(since);
      const applied = await this.applyDeltas(deltas, actorId, "pos.sync");
      const now = new Date();
      await this.prisma.integration.update({
        where: { id: integration.id },
        data: {
          lastSyncAt: now,
          lastError: null,
          syncCursor: { inventorySince: now.toISOString() },
        },
      });
      await this.audit.log({
        actorId,
        action: "pos.inventory.sync",
        entityType: "Integration",
        entityId: integration.id,
        metadata: { applied: applied.applied, skipped: applied.skipped },
      });
      return { ...applied, liveSynced: false };
    } catch (e) {
      const message = e instanceof Error ? e.message : "sync failed";
      await this.prisma.integration.update({
        where: { id: integration.id },
        data: { lastError: message, status: "error" },
      });
      throw e;
    }
  }

  async importInventoryCsv(csv: string, actorId?: string) {
    let rows;
    try {
      rows = parseInventoryCsv(csv);
    } catch (e) {
      throw new BadRequestException({
        code: "POS_CSV_INVALID",
        message: e instanceof Error ? e.message : "Invalid CSV",
      });
    }
    const deltas: InventoryDelta[] = rows.map((r) => ({
      sku: r.sku,
      barcode: r.barcode,
      branchCode: r.branchCode,
      physicalQty: r.physicalQty,
      qtyDelta: r.qtyDelta,
    }));
    const result = await this.applyDeltas(deltas, actorId, "pos.csv");
    await this.audit.log({
      actorId,
      action: "pos.inventory.csv",
      entityType: "Integration",
      entityId: (await this.ensureIntegration()).id,
      metadata: result,
    });
    return { ...result, liveSynced: false };
  }

  async ingestWebhook(payload: {
    eventId: string;
    type: string;
    sku?: string | null;
    barcode?: string | null;
    branchCode: string;
    qtyDelta?: number;
    physicalQty?: number;
  }) {
    const existing = await this.prisma.webhookEvent.findUnique({
      where: {
        provider_eventId: { provider: WEBHOOK_PROVIDER, eventId: payload.eventId },
      },
    });
    if (existing) {
      return { duplicate: true, processed: Boolean(existing.processedAt) };
    }

    const event = await this.prisma.webhookEvent.create({
      data: {
        provider: WEBHOOK_PROVIDER,
        eventId: payload.eventId,
        payload: payload as object,
      },
    });

    try {
      const result = await this.applyDeltas(
        [
          {
            sku: payload.sku,
            barcode: payload.barcode,
            branchCode: payload.branchCode,
            qtyDelta: payload.qtyDelta,
            physicalQty: payload.physicalQty,
            externalId: payload.eventId,
          },
        ],
        undefined,
        `pos.webhook.${payload.type}`,
      );
      await this.prisma.webhookEvent.update({
        where: { id: event.id },
        data: { processedAt: new Date() },
      });
      return { duplicate: false, ...result, liveSynced: false };
    } catch (e) {
      await this.prisma.integration.updateMany({
        where: { provider: PROVIDER, kind: KIND },
        data: {
          lastError: e instanceof Error ? e.message : "webhook apply failed",
        },
      });
      throw e;
    }
  }

  async applyDeltas(
    deltas: InventoryDelta[],
    actorId: string | undefined,
    reason: string,
  ) {
    let applied = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const d of deltas) {
      try {
        if (!d.sku && !d.barcode) {
          skipped += 1;
          continue;
        }
        const branch = await this.prisma.branch.findFirst({
          where: { code: d.branchCode.toUpperCase(), deletedAt: null },
        });
        if (!branch) {
          errors.push(`branch ${d.branchCode} not found`);
          skipped += 1;
          continue;
        }

        const variant = await this.prisma.productVariant.findFirst({
          where: {
            deletedAt: null,
            OR: [
              ...(d.sku ? [{ sku: d.sku }] : []),
              ...(d.barcode ? [{ barcode: d.barcode }] : []),
            ],
          },
        });
        if (!variant) {
          errors.push(`variant ${d.sku ?? d.barcode} not found`);
          skipped += 1;
          continue;
        }

        let qtyDelta = d.qtyDelta;
        if (qtyDelta == null && d.physicalQty != null) {
          const inv = await this.prisma.inventory.findUnique({
            where: {
              branchId_variantId: { branchId: branch.id, variantId: variant.id },
            },
          });
          const current = inv?.physicalQty ?? 0;
          qtyDelta = d.physicalQty - current;
        }
        if (qtyDelta == null || qtyDelta === 0) {
          skipped += 1;
          continue;
        }

        await this.inventory.adjust({
          branchId: branch.id,
          variantId: variant.id,
          qtyDelta,
          reason,
          actorId,
        });
        applied += 1;
      } catch (e) {
        errors.push(e instanceof Error ? e.message : "apply failed");
        skipped += 1;
      }
    }

    return { applied, skipped, errors: errors.slice(0, 20) };
  }

  /** Hourly worker tick — no-op when disabled or mock returns empty. */
  async processScheduledPull() {
    const integration = await this.prisma.integration.findUnique({
      where: { provider_kind: { provider: PROVIDER, kind: KIND } },
    });
    if (!integration || integration.status !== "ready") {
      return { skipped: true };
    }
    return this.syncInventory();
  }
}
