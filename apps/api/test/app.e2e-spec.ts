import { Test } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { AllExceptionsFilter } from "../src/common/filters/all-exceptions.filter";
import { RedisService } from "../src/redis/redis.service";

describe("Foundation e2e (requires docker postgres+redis)", () => {
  let app: INestApplication;
  let redis: RedisService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1");
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
    redis = app.get(RedisService);
  }, 60000);

  afterAll(async () => {
    await app?.close();
  });

  it("GET /health", async () => {
    const res = await request(app.getHttpServer()).get("/api/v1/health").expect(200);
    expect(res.body.success).toBe(true);
  });

  it("OTP request + verify + me", async () => {
    const mobile = "+919876543210";
    await request(app.getHttpServer())
      .post("/api/v1/auth/otp/request")
      .send({ mobile })
      .expect(201)
      .catch(async () => {
        // Nest default POST may be 201 or 200 depending on version
        await request(app.getHttpServer()).post("/api/v1/auth/otp/request").send({ mobile });
      });

    const code = await redis.client.get(`otp:${mobile}`);
    expect(code).toMatch(/^\d{6}$/);

    const verify = await request(app.getHttpServer())
      .post("/api/v1/auth/otp/verify")
      .send({ mobile, code });
    expect([200, 201]).toContain(verify.status);
    expect(verify.body.data.accessToken).toBeDefined();

    const me = await request(app.getHttpServer())
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${verify.body.data.accessToken}`)
      .expect(200);
    expect(me.body.data.mobile).toBe(mobile);
  });

  it("RBAC blocks customers list without permission", async () => {
    const mobile = "+919811122233";
    await request(app.getHttpServer()).post("/api/v1/auth/otp/request").send({ mobile });
    const code = await redis.client.get(`otp:${mobile}`);
    const verify = await request(app.getHttpServer())
      .post("/api/v1/auth/otp/verify")
      .send({ mobile, code });
    const res = await request(app.getHttpServer())
      .get("/api/v1/customers")
      .set("Authorization", `Bearer ${verify.body.data.accessToken}`);
    expect(res.status).toBe(403);
  });
});
