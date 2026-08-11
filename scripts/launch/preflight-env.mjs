#!/usr/bin/env node
/**
 * Env preflight against ENV.md profiles.
 * Usage:
 *   node scripts/launch/preflight-env.mjs [--profile api|web|admin|staging|production] [--file path]
 *   pnpm preflight:env -- --profile production --file .env
 */
import fs from "node:fs";
import path from "node:path";

const PROFILES = {
  api: [
    "DATABASE_URL",
    "REDIS_URL",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "CORS_ORIGINS",
    "NODE_ENV",
    "PAYMENT_PROVIDER",
  ],
  web: ["NEXT_PUBLIC_API_URL", "NEXT_PUBLIC_SITE_URL"],
  admin: ["NEXT_PUBLIC_API_URL"],
  staging: [
    "DATABASE_URL",
    "REDIS_URL",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "CORS_ORIGINS",
    "NODE_ENV",
    "PAYMENT_PROVIDER",
    "NEXT_PUBLIC_API_URL",
    "NEXT_PUBLIC_SITE_URL",
  ],
  production: [
    "DATABASE_URL",
    "REDIS_URL",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "CORS_ORIGINS",
    "NODE_ENV",
    "PAYMENT_PROVIDER",
    "NEXT_PUBLIC_API_URL",
    "NEXT_PUBLIC_SITE_URL",
  ],
};

const MOCK_BANNED = ["PAYMENT_PROVIDER", "NOTIFICATION_PROVIDER", "AI_PROVIDER", "POS_PROVIDER"];

function parseArgs(argv) {
  let profile = "api";
  let file = ".env";
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--profile" && argv[i + 1]) {
      profile = argv[++i];
    } else if (argv[i] === "--file" && argv[i + 1]) {
      file = argv[++i];
    } else if (argv[i] === "--help" || argv[i] === "-h") {
      console.log(
        "Usage: node scripts/launch/preflight-env.mjs [--profile api|web|admin|staging|production] [--file path]",
      );
      process.exit(0);
    }
  }
  return { profile, file };
}

function parseDotenv(content) {
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function loadEnv(filePath) {
  const abs = path.resolve(filePath);
  const fromFile = fs.existsSync(abs) ? parseDotenv(fs.readFileSync(abs, "utf8")) : {};
  return { ...fromFile, ...process.env, __file: abs, __fileExists: fs.existsSync(abs) };
}

const { profile, file } = parseArgs(process.argv.slice(2));
if (!PROFILES[profile]) {
  console.error(`Unknown profile: ${profile}. Use: ${Object.keys(PROFILES).join(", ")}`);
  process.exit(2);
}

const env = loadEnv(file);
const required = PROFILES[profile];
const missing = [];
const warnings = [];

if (!env.__fileExists) {
  warnings.push(`File not found: ${env.__file} (checking process.env only)`);
}

for (const key of required) {
  const val = env[key];
  if (val == null || String(val).trim() === "") missing.push(key);
}

if (profile === "production" || profile === "staging") {
  const nodeEnv = env.NODE_ENV;
  if (nodeEnv && nodeEnv !== "production") {
    warnings.push(`NODE_ENV is "${nodeEnv}" (expected production for ${profile})`);
  }
  for (const key of ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"]) {
    const v = env[key];
    if (v && String(v).length < 32) warnings.push(`${key} should be ≥32 characters`);
  }
}

if (profile === "production") {
  const allowMock = env.ALLOW_MOCK_PROVIDERS === "1";
  for (const key of MOCK_BANNED) {
    const v = env[key];
    if (v != null && String(v).toLowerCase() === "mock" && !allowMock) {
      missing.push(`${key} must not be mock in production (or set ALLOW_MOCK_PROVIDERS=1)`);
    }
  }
  if (String(env.PAYMENT_PROVIDER || "").toLowerCase() === "razorpay") {
    for (const key of ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"]) {
      if (!env[key] || String(env[key]).trim() === "") {
        warnings.push(`${key} recommended when PAYMENT_PROVIDER=razorpay`);
      }
    }
  }
}

console.log(`Preflight profile=${profile} file=${env.__file}`);
for (const w of warnings) console.log(`WARN: ${w}`);
if (missing.length) {
  console.error(`FAIL: ${missing.length} issue(s):`);
  for (const m of missing) console.error(`  - ${m}`);
  process.exit(1);
}
console.log(`OK: ${required.length} required keys present for profile=${profile}`);
process.exit(0);
