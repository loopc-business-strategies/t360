import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { PosService } from "./pos.service";

export const POS_QUEUE = "t360-pos";

@Injectable()
export class PosQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PosQueueService.name);
  private connection!: IORedis;
  private queue!: Queue;
  private worker?: Worker;

  constructor(private readonly moduleRef: ModuleRef) {}

  onModuleInit() {
    this.connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: null,
    });
    this.queue = new Queue(POS_QUEUE, { connection: this.connection });
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
    await this.connection?.quit();
  }

  startWorker() {
    this.worker = new Worker(
      POS_QUEUE,
      async (job: Job) => {
        const pos = this.moduleRef.get(PosService, { strict: false });
        if (job.name === "inventory_pull") {
          return pos.processScheduledPull();
        }
        return { ignored: true };
      },
      { connection: this.connection.duplicate() },
    );
    this.worker.on("failed", (job, err) => {
      this.logger.error(`POS job ${job?.id} failed: ${err.message}`);
    });
    void this.queue.add(
      "inventory_pull",
      {},
      {
        repeat: { every: 60 * 60 * 1000 },
        jobId: "pos-inventory-hourly",
        removeOnComplete: 20,
      },
    );
    this.logger.log("BullMQ POS worker started (mock hourly pull)");
  }
}
