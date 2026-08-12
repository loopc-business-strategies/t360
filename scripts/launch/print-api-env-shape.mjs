#!/usr/bin/env node
import { execSync } from "node:child_process";

const env = {
  ...process.env,
  RAILWAY_CALLER: "skill:use-railway@1.3.0",
  RAILWAY_AGENT_SESSION: process.env.RAILWAY_AGENT_SESSION || "railway-skill-t360-golive",
};

const raw = execSync(
  "railway variable list --service api --environment staging --kv",
  { encoding: "utf8", env },
);

const interesting = new Set([
  "DATABASE_URL",
  "REDIS_URL",
  "CORS_ORIGINS",
  "ALLOW_MOCK_PROVIDERS",
  "NODE_ENV",
  "PORT",
  "PAYMENT_PROVIDER",
  "AI_PROVIDER",
  "SMS_PROVIDER",
  "EMAIL_PROVIDER",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
]);

for (const line of raw.split(/\r?\n/)) {
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i);
  const v = line.slice(i + 1);
  if (!interesting.has(k) && !k.includes("PROVIDER") && !k.startsWith("JWT")) continue;
  let safe = v;
  if (/SECRET|URL|PASSWORD|TOKEN|KEY/i.test(k)) {
    safe = v.includes("${{") ? `[ref ${v}]` : `[set len ${v.length}]`;
  }
  console.log(`${k}=${safe}`);
}
