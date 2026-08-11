import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { RequestIdMiddleware } from "./common/middleware/request-id.middleware";
import { assertProductionConfig } from "./common/prod-config";
import { initSentry } from "./observability/sentry";

async function bootstrap() {
  assertProductionConfig();
  await initSentry();

  const app = await NestFactory.create(AppModule, { bufferLogs: true, rawBody: true });
  app.setGlobalPrefix("api/v1", { exclude: ["api/docs"] });
  app.use(helmet());
  app.use(new RequestIdMiddleware().use.bind(new RequestIdMiddleware()));

  const origins = (process.env.CORS_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  if (process.env.NODE_ENV !== "production") {
    const config = new DocumentBuilder()
      .setTitle("t360 Tharagai API")
      .setDescription("LoopC Tharagai Digital retail platform API")
      .setVersion("1.0")
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api/docs", app, document);
  }

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}/api/v1`);
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log(`Swagger http://localhost:${port}/api/docs`);
  }
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
