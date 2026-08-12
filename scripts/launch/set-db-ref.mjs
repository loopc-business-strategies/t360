#!/usr/bin/env node
import { execSync } from "node:child_process";

const env = {
  ...process.env,
  RAILWAY_CALLER: "skill:use-railway@1.3.0",
  RAILWAY_AGENT_SESSION: process.env.RAILWAY_AGENT_SESSION || "railway-skill-t360-golive",
};

const ref = process.argv[2] || "${{Postgres.DATABASE_URL}}";
for (const service of ["api", "worker"]) {
  execSync(
    `railway variable set --service ${service} --environment staging --skip-deploys "DATABASE_URL=${ref}"`,
    { stdio: "inherit", env, shell: true },
  );
  console.log("updated", service, "db ref");
}
