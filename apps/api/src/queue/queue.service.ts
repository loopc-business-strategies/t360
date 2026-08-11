import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";

export const DEMO_QUEUE = "t360-demo";

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private connection!: IORedis;
  private queue!: Queue;
  private worker?: Worker;

  onModuleInit() {
    this.connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: null,
    });
    this.queue = new Queue(DEMO_QUEUE, { connection: this.connection });
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
    await this.connection?.quit();
  }

  async enqueueDemo(payload: { message: string }) {
    return this.queue.add("demo", payload, {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: 100,
      removeOnFail: 100,
    });
  }

  /** Used by dedicated worker process */
  startWorker() {
    this.worker = new Worker(
      DEMO_QUEUE,
      async (job: Job) => {
        this.logger.log(`Processing demo job ${job.id}: ${JSON.stringify(job.data)}`);
        return { ok: true, at: new Date().toISOString() };
      },
      { connection: this.connection.duplicate() },
    );
    this.worker.on("failed", (job, err) => {
      this.logger.error(`Job ${job?.id} failed: ${err.message}`);
    });
    this.logger.log("BullMQ demo worker started");
  }
}
