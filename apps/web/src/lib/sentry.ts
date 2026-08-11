/**
 * Thin Sentry stub for Next apps.
 * When NEXT_PUBLIC_SENTRY_DSN is unset, this is a no-op (CI-safe).
 * Wire @sentry/nextjs in the hosting project when enabling real DSN.
 */
export function initClientSentry(): void {
  if (typeof window === "undefined") return;
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  // Placeholder until @sentry/nextjs is installed in the deploy pipeline:
  console.info("[sentry] NEXT_PUBLIC_SENTRY_DSN configured — install @sentry/nextjs for full client reporting");
}

export function reportClientError(error: unknown): void {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  console.error("[sentry]", error);
}
