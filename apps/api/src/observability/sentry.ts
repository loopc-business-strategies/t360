import { Logger } from "@nestjs/common";

const log = new Logger("Sentry");

/**
 * Optional Sentry — only loads SDK when SENTRY_DSN is set.
 * Keeps CI green without requiring credentials.
 */
export async function initSentry(): Promise<void> {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  try {
    const Sentry = await import("@sentry/node");
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV ?? "development",
      release: process.env.GIT_SHA ?? process.env.APP_VERSION,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    });
    log.log("Sentry initialized");
  } catch (e) {
    log.warn(
      `SENTRY_DSN set but @sentry/node failed to load: ${e instanceof Error ? e.message : e}`,
    );
  }
}

export async function captureException(err: unknown): Promise<void> {
  if (!process.env.SENTRY_DSN) return;
  try {
    const Sentry = await import("@sentry/node");
    Sentry.captureException(err);
  } catch {
    /* ignore */
  }
}
