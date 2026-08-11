/**
 * Thin Sentry stub for Admin Next app — no-op without NEXT_PUBLIC_SENTRY_DSN.
 */
export function initClientSentry(): void {
  if (typeof window === "undefined") return;
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  console.info("[sentry] NEXT_PUBLIC_SENTRY_DSN configured — install @sentry/nextjs for full client reporting");
}
