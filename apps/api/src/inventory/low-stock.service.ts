import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { InventoryService } from "./inventory.service";
import { AuditService } from "../audit/audit.service";

export const LOW_STOCK_QUEUE = "low-stock-check";

@Injectable()
export class LowStockService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LowStockService.name);
  private connection!: IORedis;
  private queue!: Queue;
  private worker?: Worker;

  constructor(
    private readonly inventory: InventoryService,
    private readonly audit: AuditService,
  ) {}

  onModuleInit() {
    this.connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: null,
    });
    this.queue = new Queue(LOW_STOCK_QUEUE, { connection: this.connection });
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
    await this.connection?.quit();
  }

  async enqueueCheck() {
    return this.queue.add(
      "scan",
      { at: new Date().toISOString() },
      {
        attempts: 2,
        removeOnComplete: 50,
        removeOnFail: 50,
      },
    );
  }

  /** Used by dedicated worker process */
  startWorker() {
    this.worker = new Worker(
      LOW_STOCK_QUEUE,
      async (job: Job) => this.runCheck(job),
      { connection: this.connection.duplicate() },
    );
    this.worker.on("failed", (job, err) => {
      this.logger.error(`Low-stock job ${job?.id} failed: ${err.message}`);
    });
    this.logger.log("BullMQ low-stock worker started");
  }

  async runCheck(job?: Job) {
    const low = await this.inventory.findLowStock();
    this.logger.warn(
      `Low-stock check (${job?.id ?? "inline"}): ${low.length} SKU/branch rows at or below threshold`,
    );
    for (const row of low.slice(0, 50)) {
      this.logger.warn(
        `LOW STOCK ${row.branch.code} ${row.variant.sku} available=${row.availableQty} threshold=${row.lowStockThreshold}`,
      );
    }
    await this.audit.log({
      action: "inventory.low_stock_check",
      entityType: "Inventory",
      metadata: {
        count: low.length,
        sample: low.slice(0, 20).map((r) => ({
          branchId: r.branchId,
          variantId: r.variantId,
          sku: r.variant.sku,
          availableQty: r.availableQty,
          threshold: r.lowStockThreshold,
        })),
      },
    });
    return { count: low.length };
  }
}
