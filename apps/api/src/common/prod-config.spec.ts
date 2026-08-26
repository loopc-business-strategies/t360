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

  it("rejects FASHION_AI_PROVIDER=mock in production", () => {
    expect(() =>
      assertProductionConfig({
        NODE_ENV: "production",
        PAYMENT_PROVIDER: "razorpay",
        NOTIFICATION_PROVIDER: "resend",
        AI_PROVIDER: "openai",
        POS_PROVIDER: "vendor",
        FASHION_AI_PROVIDER: "mock",
        CLOUDINARY_CLOUD_NAME: "demo",
        CLOUDINARY_API_KEY: "k",
        CLOUDINARY_API_SECRET: "s",
      }),
    ).toThrow(/FASHION_AI_PROVIDER=mock/i);
  });

  it("allows FASHION_AI_PROVIDER=disabled in production with Cloudinary", () => {
    expect(() =>
      assertProductionConfig({
        NODE_ENV: "production",
        PAYMENT_PROVIDER: "razorpay",
        NOTIFICATION_PROVIDER: "resend",
        AI_PROVIDER: "openai",
        POS_PROVIDER: "vendor",
        FASHION_AI_PROVIDER: "disabled",
        CLOUDINARY_CLOUD_NAME: "demo",
        CLOUDINARY_API_KEY: "k",
        CLOUDINARY_API_SECRET: "s",
      }),
    ).not.toThrow();
  });

  it("rejects missing Cloudinary in production", () => {
    expect(() =>
      assertProductionConfig({
        NODE_ENV: "production",
        PAYMENT_PROVIDER: "razorpay",
        NOTIFICATION_PROVIDER: "resend",
        AI_PROVIDER: "openai",
        POS_PROVIDER: "vendor",
        FASHION_AI_PROVIDER: "disabled",
      }),
    ).toThrow(/Cloudinary/i);
  });
});
