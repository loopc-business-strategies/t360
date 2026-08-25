import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";

export const AI_FASHION_QUEUE = "t360-ai-fashion";

export type AiFashionQueuePayload = {
  generatedImageId: string;
};

@Injectable()
export class AiFashionQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AiFashionQueueService.name);
  private connection!: IORedis;
  private queue!: Queue;
  private worker?: Worker;

  constructor(private readonly moduleRef: ModuleRef) {}

  onModuleInit() {
    this.connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: null,
    });
    this.queue = new Queue(AI_FASHION_QUEUE, { connection: this.connection });
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
    await this.connection?.quit();
  }

  async enqueue(payload: AiFashionQueuePayload) {
    return this.queue.add("generate", payload, {
      attempts: 2,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 100,
    });
  }

  /** Used by dedicated worker process */
  startWorker() {
    this.worker = new Worker(
      AI_FASHION_QUEUE,
      async (job: Job<AiFashionQueuePayload>) => {
        const { AiFashionService } = await import("./ai-fashion.service");
        const service = this.moduleRef.get(AiFashionService, { strict: false });
        await service.processJob(job.data.generatedImageId);
        return { ok: true, id: job.data.generatedImageId };
      },
      { connection: this.connection.duplicate(), concurrency: 2 },
    );
    this.worker.on("failed", (job, err) => {
      this.logger.error(`AI Fashion job ${job?.id} failed: ${err.message}`);
    });
    this.logger.log("BullMQ AI Fashion worker started");
  }
}
