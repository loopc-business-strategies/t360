import { assertProductionConfig } from "./prod-config";

describe("assertProductionConfig", () => {
  it("no-ops outside production", () => {
    expect(() =>
      assertProductionConfig({
        NODE_ENV: "development",
        PAYMENT_PROVIDER: "mock",
      }),
    ).not.toThrow();
  });

  it("rejects mock providers in production", () => {
    expect(() =>
      assertProductionConfig({
        NODE_ENV: "production",
        PAYMENT_PROVIDER: "mock",
        NOTIFICATION_PROVIDER: "mock",
        AI_PROVIDER: "mock",
        POS_PROVIDER: "mock",
      }),
    ).toThrow(/refuses mock providers/i);
  });

  it("allows mocks with escape hatch", () => {
    expect(() =>
      assertProductionConfig({
        NODE_ENV: "production",
        ALLOW_MOCK_PROVIDERS: "1",
        PAYMENT_PROVIDER: "mock",
        NOTIFICATION_PROVIDER: "mock",
        AI_PROVIDER: "mock",
        POS_PROVIDER: "mock",
      }),
    ).not.toThrow();
  });

  it("passes when real providers set", () => {
    expect(() =>
      assertProductionConfig({
        NODE_ENV: "production",
        PAYMENT_PROVIDER: "razorpay",
        NOTIFICATION_PROVIDER: "resend",
        AI_PROVIDER: "openai",
        POS_PROVIDER: "vendor",
      }),
    ).not.toThrow();
  });
});
