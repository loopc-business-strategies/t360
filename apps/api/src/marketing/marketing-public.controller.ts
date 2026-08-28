import { Body, Controller, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { newsletterSubscribeSchema } from "@t360/validation";
import { Request } from "express";
import { Public } from "../common/decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { MarketingService } from "./marketing.service";

@ApiTags("marketing")
@Controller("marketing")
export class MarketingPublicController {
  constructor(private readonly marketing: MarketingService) {}

  @Public()
  @Post("newsletter/subscribe")
  async subscribe(
    @Body(new ZodValidationPipe(newsletterSubscribeSchema)) body: {
      email: string;
      locale?: "en" | "ta";
      source?: string;
    },
    @Req() req: Request,
  ) {
    const data = await this.marketing.subscribeNewsletter(body);
    return {
      success: true,
      data,
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
}
