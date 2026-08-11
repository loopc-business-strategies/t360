import { createHash } from "crypto";

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function assertRateLimitCount(count: number, limit: number) {
  return count <= limit;
}
