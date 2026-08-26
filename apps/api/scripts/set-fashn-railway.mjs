/**
 * Set Path A FASHN env on Railway api + worker, then redeploy.
 *
 * Usage (PowerShell):
 *   $env:FASHN_API_KEY="your-key"
 *   node apps/api/scripts/set-fashn-railway.mjs
 *
 * Optional:
 *   $env:CLOUDINARY_CLOUD_NAME=...
 *   $env:CLOUDINARY_API_KEY=...
 *   $env:CLOUDINARY_API_SECRET=...
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const key = process.env.FASHN_API_KEY?.trim();
if (!key) {
  console.error("Set FASHN_API_KEY env var first.");
  process.exit(1);
}

function rail(args) {
  const r = spawnSync("railway", args, {
    cwd: root,
    encoding: "utf8",
    shell: true,
  });
  if (r.status !== 0) {
    console.error(r.stdout || "");
    console.error(r.stderr || "");
    throw new Error(`railway ${args.join(" ")} failed (${r.status})`);
  }
  return r.stdout;
}

const pairs = [
  ["FASHION_AI_PROVIDER", "fashn"],
  ["FASHN_API_KEY", key],
];
for (const name of ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"]) {
  const v = process.env[name]?.trim();
  if (v) pairs.push([name, v]);
}

for (const service of ["api", "worker"]) {
  for (const [k, v] of pairs) {
    console.log(`set ${service} ${k}`);
    // Railway CLI v5+: `variable set KEY=VALUE --service …`
    rail(["variable", "set", `${k}=${v}`, "--service", service, "--skip-deploys"]);
  }
}

console.log("redeploy api + worker");
rail(["redeploy", "--service", "api", "--yes"]);
rail(["redeploy", "--service", "worker", "--yes"]);
console.log("DONE — wait for SUCCESS, then admin capture → Generate still.");
