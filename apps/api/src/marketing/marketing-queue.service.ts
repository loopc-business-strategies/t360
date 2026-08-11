import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { MarketingService } from "./marketing.service";

export const MARKETING_QUEUE = "t360-marketing";

@Injectable()
export class MarketingQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MarketingQueueService.name);
  private connection!: IORedis;
  private queue!: Queue;
  private worker?: Worker;

  constructor(private readonly moduleRef: ModuleRef) {}

  onModuleInit() {
    this.connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: null,
    });
    this.queue = new Queue(MARKETING_QUEUE, { connection: this.connection });
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
    await this.connection?.quit();
  }

  async enqueueCampaignRecipient(recipientId: string) {
    return this.queue.add(
      "campaign_send",
      { recipientId },
      { attempts: 3, backoff: { type: "exponential", delay: 2000 }, removeOnComplete: 200 },
    );
  }

  async enqueueAbandonedTick() {
    return this.queue.add("abandoned_tick", {}, { removeOnComplete: 50, removeOnFail: 50 });
  }

  startWorker() {
    this.worker = new Worker(
      MARKETING_QUEUE,
      async (job: Job) => {
        const marketing = this.moduleRef.get(MarketingService, { strict: false });
        if (job.name === "campaign_send") {
          return marketing.processCampaignRecipient(job.data.recipientId as string);
        }
        if (job.name === "abandoned_tick") {
          return marketing.processAbandonedCarts();
        }
        return { ignored: true };
      },
      { connection: this.connection.duplicate() },
    );
    this.worker.on("failed", (job, err) => {
      this.logger.error(`Marketing job ${job?.id} failed: ${err.message}`);
    });
    void this.queue.add(
      "abandoned_tick",
      {},
      {
        repeat: { every: 60 * 60 * 1000 },
        jobId: "abandoned-cart-hourly",
        removeOnComplete: 20,
      },
    );
    this.logger.log("BullMQ marketing worker started");
  }
}
