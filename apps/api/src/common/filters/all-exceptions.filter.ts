import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();
    const requestId = request.requestId ?? "unknown";

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = "INTERNAL_ERROR";
    let message = "An unexpected error occurred";
    let details: Record<string, unknown> = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === "string") {
        message = body;
        code = exception.name.replace(/Exception$/, "").toUpperCase() || "HTTP_ERROR";
      } else if (typeof body === "object" && body !== null) {
        const obj = body as Record<string, unknown>;
        message = String(obj.message ?? message);
        code = String(obj.code ?? code);
        if (obj.details && typeof obj.details === "object") {
          details = obj.details as Record<string, unknown>;
        }
        if (Array.isArray(obj.message)) {
          message = "Validation failed";
          details = { messages: obj.message };
          code = "VALIDATION_ERROR";
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        exception.message,
        process.env.NODE_ENV === "production" ? undefined : exception.stack,
      );
      void import("../../observability/sentry").then((m) => m.captureException(exception));
    }

    const errorBody: Record<string, unknown> = { code, message, details };
    if (process.env.NODE_ENV !== "production" && exception instanceof Error && exception.stack) {
      errorBody.debugStack = exception.stack.split("\n").slice(0, 5);
    }

    response.status(status).json({
      success: false,
      error: errorBody,
      requestId,
    });
  }
}
