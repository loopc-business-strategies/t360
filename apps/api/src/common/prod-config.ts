/**
 * Production boot guards — reject mock providers unless explicitly allowed.
 */
export function assertProductionConfig(env: NodeJS.ProcessEnv = process.env): void {
  if (env.NODE_ENV !== "production") return;
  if (env.ALLOW_MOCK_PROVIDERS === "1" || env.ALLOW_MOCK_PROVIDERS === "true") return;

  const checks: Array<[string, string]> = [
    ["PAYMENT_PROVIDER", (env.PAYMENT_PROVIDER ?? "mock").toLowerCase()],
    ["NOTIFICATION_PROVIDER", (env.NOTIFICATION_PROVIDER ?? "mock").toLowerCase()],
    ["AI_PROVIDER", (env.AI_PROVIDER ?? "mock").toLowerCase()],
    ["POS_PROVIDER", (env.POS_PROVIDER ?? "mock").toLowerCase()],
  ];

  const fashion = (env.FASHION_AI_PROVIDER ?? "disabled").toLowerCase();
  if (fashion === "mock") {
    checks.push(["FASHION_AI_PROVIDER", fashion]);
  }

  const offenders = checks.filter(([, value]) => value === "mock");
  if (offenders.length > 0) {
    const list = offenders.map(([key, value]) => `${key}=${value}`).join(", ");
    throw new Error(
      `Production refuses mock providers (${list}). Set real providers or ALLOW_MOCK_PROVIDERS=1 for emergency only.`,
    );
  }

  const cloudinaryMissing =
    !env.CLOUDINARY_CLOUD_NAME?.trim() ||
    !env.CLOUDINARY_API_KEY?.trim() ||
    !env.CLOUDINARY_API_SECRET?.trim();
  if (cloudinaryMissing) {
    throw new Error(
      "Production requires Cloudinary (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET). Set credentials or ALLOW_MOCK_PROVIDERS=1 for emergency only.",
    );
  }
}
