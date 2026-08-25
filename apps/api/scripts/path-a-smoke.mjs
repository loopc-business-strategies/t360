import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  fs
    .readFileSync(path.join(__dirname, "../.env"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const base = "https://api-staging-7912.up.railway.app/api/v1";
const loginRes = await fetch(`${base}/auth/login`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    email: env.SEED_ADMIN_EMAIL,
    password: env.SEED_ADMIN_PASSWORD,
  }),
});
const login = await loginRes.json();
const token = login.data.accessToken;
const headers = {
  authorization: `Bearer ${token}`,
  "content-type": "application/json",
};

// Re-login after perm sync may still use old JWT if login was earlier; this is fresh.
const settingsRes = await fetch(`${base}/admin/ai-fashion/settings`, { headers });
const settings = (await settingsRes.json()).data;
console.log("settings smoke", {
  status: settingsRes.status,
  videoEnabled: settings.videoEnabled,
  mode: settings.defaultGenerationMode,
  resolution: settings.defaultResolution,
  provider: settings.provider,
  apiKeyConfigured: settings.apiKeyConfigured,
});

if (settings.videoEnabled !== false || settings.defaultGenerationMode !== "fast") {
  console.error("PATH_A_SETTINGS_FAIL");
  process.exit(1);
}

// Enable briefly to assert generate fails cleanly without FASHN key
await fetch(`${base}/admin/ai-fashion/settings`, {
  method: "PATCH",
  headers,
  body: JSON.stringify({ enabled: true }),
});

const productsRes = await fetch(`${base}/admin/products?limit=1`, { headers });
const productsBody = await productsRes.json();
const products = productsBody.data?.items ?? productsBody.data ?? [];
const product = Array.isArray(products) ? products[0] : null;
console.log("product sample", product ? { id: product.id, name: product.name } : null);

let generateStatus;
let generateBody;
if (product?.id) {
  const genRes = await fetch(`${base}/admin/ai-fashion/generate`, {
    method: "POST",
    headers,
    body: JSON.stringify({ productId: product.id, type: "PRODUCT_TO_MODEL" }),
  });
  generateStatus = genRes.status;
  generateBody = await genRes.json();
} else {
  generateStatus = 0;
  generateBody = { error: "no product" };
}

console.log("generate without key", {
  status: generateStatus,
  code: generateBody.error?.code || generateBody.data?.error?.code,
  message: generateBody.error?.message || generateBody.message || JSON.stringify(generateBody).slice(0, 300),
});

// Leave enabled true so Path A is ready once key is set; generation stays blocked by provider
const expectBlocked =
  generateStatus === 503 ||
  generateStatus === 400 ||
  /FASHN|not configured|disabled|provider/i.test(
    String(generateBody.error?.message || JSON.stringify(generateBody)),
  );
console.log(expectBlocked ? "GENERATE_BLOCKED_WITHOUT_KEY_OK" : "GENERATE_UNEXPECTED");

if (!expectBlocked) process.exit(1);
console.log("SMOKE_PATH_A_PARTIAL_OK");
