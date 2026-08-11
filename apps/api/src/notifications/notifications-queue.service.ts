import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { NotificationsService } from "./notifications.service";

export const NOTIFICATIONS_QUEUE = "t360-notifications";

@Injectable()
export class NotificationsQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsQueueService.name);
  private connection!: IORedis;
  private queue!: Queue;
  private worker?: Worker;

  constructor(private readonly moduleRef: ModuleRef) {}

  onModuleInit() {
    this.connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: null,
    });
    this.queue = new Queue(NOTIFICATIONS_QUEUE, { connection: this.connection });
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
    await this.connection?.quit();
  }

  async enqueueSend(notificationId: string) {
    return this.queue.add(
      "send",
      { notificationId },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 200,
        removeOnFail: 200,
      },
    );
  }

  async enqueueWhatsappInbound(eventId: string) {
    return this.queue.add(
      "whatsapp_inbound",
      { eventId },
      { attempts: 3, removeOnComplete: 100, removeOnFail: 100 },
    );
  }

  startWorker() {
    this.worker = new Worker(
      NOTIFICATIONS_QUEUE,
      async (job: Job) => {
        const notifications = this.moduleRef.get(NotificationsService, { strict: false });
        if (job.name === "send") {
          return notifications.processSend(job.data.notificationId as string);
        }
        if (job.name === "whatsapp_inbound") {
          this.logger.log(`WhatsApp inbound event ${job.data.eventId}`);
          return { ok: true };
        }
        return { ignored: true };
      },
      { connection: this.connection.duplicate() },
    );
    this.worker.on("failed", (job, err) => {
      this.logger.error(`Notification job ${job?.id} failed: ${err.message}`);
    });
    this.logger.log("BullMQ notifications worker started");
  }
}
