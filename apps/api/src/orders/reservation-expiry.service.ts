import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { OrdersService } from "./orders.service";

export const RESERVATION_EXPIRY_QUEUE = "reservation-expiry";

@Injectable()
export class ReservationExpiryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReservationExpiryService.name);
  private connection!: IORedis;
  private queue!: Queue;
  private worker?: Worker;

  constructor(private readonly orders: OrdersService) {}

  onModuleInit() {
    this.connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: null,
    });
    this.queue = new Queue(RESERVATION_EXPIRY_QUEUE, { connection: this.connection });
    void this.queue.add(
      "scan",
      {},
      {
        repeat: { every: 5 * 60_000 },
        removeOnComplete: 20,
        removeOnFail: 20,
      },
    );
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
    await this.connection?.quit();
  }

  startWorker() {
    this.worker = new Worker(
      RESERVATION_EXPIRY_QUEUE,
      async (_job: Job) => {
        const result = await this.orders.expirePaymentPending();
        this.logger.log(`Reservation expiry sweep cancelled=${result.cancelled}`);
        return result;
      },
      { connection: this.connection.duplicate() },
    );
    this.logger.log("BullMQ reservation-expiry worker started");
  }
}
