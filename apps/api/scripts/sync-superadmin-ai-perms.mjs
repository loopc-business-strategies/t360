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

const permsRes = await fetch(`${base}/admin/roles/permissions`, { headers });
const permsBody = await permsRes.json();
const codes = (permsBody.data ?? []).map((p) => p.code).sort();
const ai = codes.filter((c) => c.includes("ai"));
console.log("ai perms in DB:", ai);
console.log("has ai_fashion.view", codes.includes("ai_fashion.view"));
console.log("has ai_settings.view", codes.includes("ai_settings.view"));

const rolesRes = await fetch(`${base}/admin/roles`, { headers });
const rolesBody = await rolesRes.json();
const superAdmin = (rolesBody.data ?? []).find((r) => r.code === "SuperAdmin");
console.log(
  "SuperAdmin perms missing AI:",
  [
    "ai.fashion",
    "ai_fashion.view",
    "ai_fashion.generate",
    "ai_fashion.approve",
    "ai_fashion.delete",
    "ai_fashion.retry",
    "ai_models.view",
    "ai_models.create",
    "ai_models.update",
    "ai_models.delete",
    "ai_settings.view",
    "ai_settings.update",
  ].filter((c) => !(superAdmin?.permissions ?? []).includes(c)),
);
console.log("SuperAdmin id", superAdmin?.id);
console.log("SuperAdmin perm count", superAdmin?.permissions?.length);

if (superAdmin && codes.includes("ai_fashion.view") && codes.includes("ai_settings.view")) {
  const next = [...new Set([...superAdmin.permissions, ...ai, "dashboard.view"])].sort();
  const patch = await fetch(`${base}/admin/roles/${superAdmin.id}/permissions`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ permissionCodes: next }),
  });
  const patched = await patch.json();
  console.log("patch status", patch.status, "new count", patched.data?.permissions?.length);
} else if (!codes.includes("ai_fashion.view")) {
  console.log("NEED_SEED: AI fashion permissions missing from Permission table");
}
