#!/usr/bin/env node
/**
 * One-shot: set Railway api/worker staging vars without printing secrets.
 * Usage: node scripts/launch/set-railway-staging-vars.mjs
 */
import { execSync } from "node:child_process";
import crypto from "node:crypto";

const jwtA = crypto.randomBytes(32).toString("hex");
const jwtR = crypto.randomBytes(32).toString("hex");

const common = {
  DATABASE_URL: "${{Postgres.DATABASE_URL}}",
  REDIS_URL: "${{Redis.REDIS_URL}}",
  NODE_ENV: "production",
  JWT_ACCESS_SECRET: jwtA,
  JWT_REFRESH_SECRET: jwtR,
  PAYMENT_PROVIDER: "mock",
  NOTIFICATION_PROVIDER: "mock",
  AI_PROVIDER: "mock",
  POS_PROVIDER: "mock",
  ALLOW_MOCK_PROVIDERS: "1",
  SEARCH_PROVIDER: "postgres",
};

const api = {
  ...common,
  CORS_ORIGINS:
    "https://t360-web.vercel.app,https://t360-admin.vercel.app,http://localhost:3000,http://localhost:3001",
};

function setVars(service, vars) {
  const args = Object.entries(vars).map(([k, v]) => `${k}=${v}`);
  const cmd = [
    "railway",
    "variable",
    "set",
    "--service",
    service,
    "--environment",
    "staging",
    "--skip-deploys",
    ...args,
  ];
  execSync(cmd.join(" "), {
    stdio: "inherit",
    env: {
      ...process.env,
      RAILWAY_CALLER: "skill:use-railway@1.3.0",
      RAILWAY_AGENT_SESSION: process.env.RAILWAY_AGENT_SESSION || "railway-skill-t360-golive",
    },
  });
  console.log(`OK set ${Object.keys(vars).length} vars on ${service}`);
}

setVars("api", api);
setVars("worker", common);
