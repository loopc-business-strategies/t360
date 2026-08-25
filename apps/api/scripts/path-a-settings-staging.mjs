import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "../.env");
const env = Object.fromEntries(
  fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const base = process.env.STAGING_API_BASE || "https://api-staging-7912.up.railway.app/api/v1";
const email = env.SEED_ADMIN_EMAIL;
const password = env.SEED_ADMIN_PASSWORD;
if (!email || !password) {
  console.error("SEED_ADMIN_EMAIL/PASSWORD missing in apps/api/.env");
  process.exit(1);
}

async function main() {
  const loginRes = await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const login = await loginRes.json();
  if (!loginRes.ok) {
    console.error("login failed", loginRes.status, login);
    process.exit(1);
  }
  const payload = login.data ?? login;
  const token =
    payload.accessToken ||
    payload.token ||
    payload.access_token ||
    payload.tokens?.accessToken;
  if (!token) {
    console.error("no token in login response:", JSON.stringify(login).slice(0, 500));
    process.exit(1);
  }

  const headers = {
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
  };

  const beforeRes = await fetch(`${base}/admin/ai-fashion/settings`, { headers });
  const beforeRaw = await beforeRes.json();
  const before = beforeRaw.data ?? beforeRaw;
  console.log("before", {
    provider: before.provider,
    apiKeyConfigured: before.apiKeyConfigured,
    enabled: before.enabled,
    videoEnabled: before.videoEnabled,
    defaultGenerationMode: before.defaultGenerationMode,
    defaultResolution: before.defaultResolution,
    dailyLimit: before.dailyLimit,
  });

  const patchRes = await fetch(`${base}/admin/ai-fashion/settings`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      videoEnabled: false,
      defaultGenerationMode: "fast",
      defaultResolution: "1k",
      dailyLimit: 20,
      monthlyLimit: 200,
    }),
  });
  const afterRaw = await patchRes.json();
  const after = afterRaw.data ?? afterRaw;
  if (!patchRes.ok) {
    console.error("patch failed", patchRes.status, afterRaw);
    process.exit(1);
  }
  console.log("after", {
    provider: after.provider,
    apiKeyConfigured: after.apiKeyConfigured,
    enabled: after.enabled,
    videoEnabled: after.videoEnabled,
    defaultGenerationMode: after.defaultGenerationMode,
    defaultResolution: after.defaultResolution,
    dailyLimit: after.dailyLimit,
    monthlyLimit: after.monthlyLimit,
  });

  const videoBlocked =
    after.videoEnabled === false &&
    after.defaultGenerationMode === "fast" &&
    after.defaultResolution === "1k";
  console.log(videoBlocked ? "PATH_A_SETTINGS_OK" : "PATH_A_SETTINGS_MISMATCH");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
