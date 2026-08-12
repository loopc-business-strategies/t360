#!/usr/bin/env node
import { execSync } from "node:child_process";

const env = {
  ...process.env,
  RAILWAY_CALLER: "skill:use-railway@1.3.0",
  RAILWAY_AGENT_SESSION: process.env.RAILWAY_AGENT_SESSION || "railway-skill-t360-golive",
};

function hostOf(service) {
  const raw = execSync(
    `railway variable list --service ${service} --environment staging --kv`,
    { encoding: "utf8", env },
  );
  const line = raw.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL="));
  if (!line) return { service, host: null };
  const url = line.slice("DATABASE_URL=".length);
  try {
    const u = new URL(url);
    return {
      service,
      host: u.hostname,
      hasNull: url.includes("\u0000"),
      len: url.length,
      looksPg: url.startsWith("postgresql://"),
    };
  } catch (e) {
    return { service, parseError: String(e.message), prefix: JSON.stringify(url.slice(0, 30)) };
  }
}

console.log(JSON.stringify([hostOf("api"), hostOf("worker"), hostOf("Postgres-ByCP")], null, 2));
