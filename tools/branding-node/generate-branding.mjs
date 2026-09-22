/**
 * Generate THARAGAI branding assets without Python.
 * Uses Node + sharp (installed locally under tools/branding-node).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const repo = path.resolve(__dirname, "../..");
  const mobileOut = path.join(repo, "apps/mobile/assets/branding");
  const webPublic = path.join(repo, "apps/web/public");
  const source = path.join(mobileOut, "app-icon-source.jpg");

  if (!fs.existsSync(source)) {
    throw new Error(`missing source: ${source}`);
  }

  const raw = sharp(source).ensureAlpha();
  const { data, info } = await raw.raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels } = info;

  const idx = (x, y) => (y * w + x) * channels;
  const luma = (i) => 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];

  // Flood-fill near-black corners → white
  const visited = new Uint8Array(w * h);
  const stack = [];
  const seeds = [
    [0, 0],
    [w - 1, 0],
    [0, h - 1],
    [w - 1, h - 1],
  ];
  for (const [sx, sy] of seeds) {
    const i = idx(sx, sy);
    if (luma(i) <= 40) stack.push([sx, sy]);
  }
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const vi = y * w + x;
    if (visited[vi]) continue;
    const i = idx(x, y);
    if (luma(i) > 40) continue;
    visited[vi] = 1;
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
    data[i + 3] = 255;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  const cleanedBuf = Buffer.from(data);

  // Sync web source
  fs.copyFileSync(source, path.join(webPublic, "branding-source.jpg"));

  async function fitOnWhite(size, scale) {
    const max = Math.floor(size * scale);
    const resized = await sharp(cleanedBuf, { raw: { width: w, height: h, channels } })
      .resize(max, max, { fit: "inside", withoutEnlargement: false })
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true });
    return sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    }).composite([
      {
        input: resized.data,
        raw: {
          width: resized.info.width,
          height: resized.info.height,
          channels: 4,
        },
        left: Math.floor((size - resized.info.width) / 2),
        top: Math.floor((size - resized.info.height) / 2),
      },
    ]);
  }

  // App icon 1024 white
  const iconPath = path.join(mobileOut, "tharagai_icon.png");
  await (await fitOnWhite(1024, 0.88)).removeAlpha().png().toFile(iconPath);
  console.log("wrote", iconPath);

  // Verify corners white
  const iconMeta = await sharp(iconPath).raw().toBuffer({ resolveWithObject: true });
  const iw = iconMeta.info.width;
  const ih = iconMeta.info.height;
  const ic = iconMeta.info.channels;
  const id = iconMeta.data;
  if (iw !== 1024 || ih !== 1024) throw new Error(`icon size ${iw}x${ih}`);
  for (const [x, y] of [
    [0, 0],
    [iw - 1, 0],
    [0, ih - 1],
    [iw - 1, ih - 1],
  ]) {
    const i = (y * iw + x) * ic;
    if (id[i] < 250 || id[i + 1] < 250 || id[i + 2] < 250) {
      throw new Error(`non-white corner ${x},${y}`);
    }
  }
  console.log("icon corner check OK");

  await (await fitOnWhite(512, 0.82))
    .removeAlpha()
    .png()
    .toFile(path.join(mobileOut, "tharagai_splash_android12.png"));

  await (await fitOnWhite(1024, 0.92))
    .removeAlpha()
    .png()
    .toFile(path.join(mobileOut, "tharagai_logo.png"));

  // Transparent lockup: knock out black + near-white plate; brighten dark READYMATES
  const tRaw = Buffer.from(cleanedBuf);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = idx(x, y);
      const r = tRaw[i];
      const g = tRaw[i + 1];
      const b = tRaw[i + 2];
      const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (y > h * 0.58 && y < h * 0.75 && x > w * 0.18 && x < w * 0.82) {
        const isGold = g > 105 && r > 145 && b < 125 && g > b + 25;
        const isRed = r > 130 && r > g + 45;
        if (!isGold && !isRed && L < 200) {
          tRaw[i] = 235;
          tRaw[i + 1] = 200;
          tRaw[i + 2] = 120;
          continue;
        }
      }
      if (r <= 28 && g <= 28 && b <= 28) {
        tRaw[i + 3] = 0;
        continue;
      }
      if (L >= 235 && Math.abs(r - g) < 25 && Math.abs(g - b) < 25 && !(r > 150 && r > g + 30)) {
        tRaw[i + 3] = 0;
      }
    }
  }

  const transparentPath = path.join(mobileOut, "tharagai_logo_transparent.png");
  await sharp(tRaw, { raw: { width: w, height: h, channels: 4 } })
    .resize(1024, 1024, { fit: "inside" })
    .png()
    .toFile(transparentPath);
  console.log("wrote", transparentPath);

  const tCheck = await sharp(transparentPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let hasAlpha = false;
  for (let i = 3; i < tCheck.data.length; i += tCheck.info.channels) {
    if (tCheck.data[i] < 255) {
      hasAlpha = true;
      break;
    }
  }
  if (!hasAlpha) throw new Error("transparent logo has no alpha");
  console.log("transparent alpha check OK");

  // Web assets
  const full1 = await sharp(tRaw, { raw: { width: w, height: h, channels: 4 } })
    .resize(1024, 1024, { fit: "inside" })
    .png()
    .toBuffer();
  const full2 = await sharp(tRaw, { raw: { width: w, height: h, channels: 4 } })
    .resize(2048, 2048, { fit: "inside" })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(webPublic, "logo-full.png"), full1);
  fs.writeFileSync(path.join(webPublic, "logo-full@2x.png"), full2);
  fs.writeFileSync(path.join(webPublic, "logo.png"), full1);
  console.log("wrote web logo-full assets");

  const markTop = Math.floor(h * 0.02);
  const markBottom = Math.floor(h * 0.48);
  const bandH = markBottom - markTop;
  const side = Math.min(w, bandH);
  const left = Math.floor((w - side) / 2);
  const markBuf = await sharp(cleanedBuf, { raw: { width: w, height: h, channels: 4 } })
    .extract({ left, top: markTop, width: side, height: side })
    .png()
    .toBuffer();

  async function markOnWhite(size, scale, outName) {
    const max = Math.max(1, Math.floor(size * scale));
    const resizedPng = await sharp(markBuf)
      .resize(max, max, { fit: "inside" })
      .png()
      .toBuffer({ resolveWithObject: true });
    const meta = resizedPng.info;
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .composite([
        {
          input: resizedPng.data,
          left: Math.floor((size - meta.width) / 2),
          top: Math.floor((size - meta.height) / 2),
        },
      ])
      .png()
      .toFile(path.join(webPublic, outName));
    console.log("wrote", outName);
  }

  await markOnWhite(512, 0.92, "logo-mark.png");
  await markOnWhite(1024, 0.92, "logo-mark@2x.png");
  await markOnWhite(16, 0.95, "favicon-16.png");
  await markOnWhite(32, 0.95, "favicon-32.png");
  await markOnWhite(192, 0.9, "icon-192.png");
  await markOnWhite(180, 0.9, "apple-touch-icon.png");

  const ogRes = await sharp(cleanedBuf, { raw: { width: w, height: h, channels: 4 } })
    .resize(Math.floor(1200 * 0.78), Math.floor(630 * 0.78), { fit: "inside" })
    .png()
    .toBuffer({ resolveWithObject: true });
  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 3,
      background: { r: 7, g: 0, b: 0 },
    },
  })
    .composite([
      {
        input: ogRes.data,
        left: Math.floor((1200 - ogRes.info.width) / 2),
        top: Math.floor((630 - ogRes.info.height) / 2),
      },
    ])
    .png()
    .toFile(path.join(webPublic, "og-image.png"));
  console.log("wrote og-image.png");
  console.log("branding generation complete");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
