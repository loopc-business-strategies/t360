import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";

export const AI_FASHION_QUEUE = "t360-ai-fashion";

/** Provider poll can run up to 5 minutes — keep lock longer. */
const LOCK_DURATION_MS = 10 * 60 * 1000;

export type AiFashionQueuePayload = {
  generatedImageId: string;
};

@Injectable()
export class AiFashionQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AiFashionQueueService.name);
  private connection!: IORedis;
  private queue!: Queue;
  private worker?: Worker;
  private sweepTimer?: ReturnType<typeof setInterval>;

  constructor(private readonly moduleRef: ModuleRef) {}

  onModuleInit() {
    this.connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: null,
    });
    this.queue = new Queue(AI_FASHION_QUEUE, { connection: this.connection });
  }

  async onModuleDestroy() {
    if (this.sweepTimer) clearInterval(this.sweepTimer);
    await this.worker?.close();
    await this.queue?.close();
    await this.connection?.quit();
  }

  async enqueue(payload: AiFashionQueuePayload) {
    return this.queue.add("generate", payload, {
      jobId: `ai-fashion-${payload.generatedImageId}`,
      attempts: 2,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 100,
    });
  }

  async removeJobByGeneratedImageId(generatedImageId: string) {
    const job = await this.queue.getJob(`ai-fashion-${generatedImageId}`);
    if (job) await job.remove();
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
      {
        connection: this.connection.duplicate(),
        concurrency: 2,
        lockDuration: LOCK_DURATION_MS,
      },
    );
    this.worker.on("failed", (job, err) => {
      this.logger.error(`AI Fashion job ${job?.id} failed: ${err.message}`);
    });
    this.logger.log("BullMQ AI Fashion worker started");

    const runSweep = async () => {
      try {
        const { AiFashionService } = await import("./ai-fashion.service");
        const service = this.moduleRef.get(AiFashionService, { strict: false });
        await service.failStaleJobs(20);
      } catch (err) {
        this.logger.warn(
          `Stale job sweep failed: ${err instanceof Error ? err.message : "unknown"}`,
        );
      }
    };
    void runSweep();
    this.sweepTimer = setInterval(() => void runSweep(), 5 * 60 * 1000);
  }
}
