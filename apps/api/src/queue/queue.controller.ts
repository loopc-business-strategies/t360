import { Controller, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { RequirePermissions } from "../common/decorators";
import { QueueService } from "./queue.service";

@ApiTags("queue")
@ApiBearerAuth()
@Controller("queue")
export class QueueController {
  constructor(private readonly queue: QueueService) {}

  @Post("demo")
  @RequirePermissions("settings.manage")
  async enqueue(@Req() req: Request) {
    const job = await this.queue.enqueueDemo({ message: "hello-from-t360" });
    return {
      success: true,
      data: { jobId: job.id },
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
