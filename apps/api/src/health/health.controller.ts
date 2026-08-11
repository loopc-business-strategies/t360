import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../common/decorators";
import { HealthService } from "./health.service";

@ApiTags("health")
@Controller()
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Public()
  @Get("health")
  async healthcheck() {
    return { success: true, data: await this.health.status(), requestId: "n/a" };
  }

  @Public()
  @Get("live")
  live() {
    return { success: true, data: { status: "live" }, requestId: "n/a" };
  }

  @Public()
  @Get("ready")
  async ready() {
    const ready = await this.health.readiness();
    return { success: true, data: ready, requestId: "n/a" };
  }
}
