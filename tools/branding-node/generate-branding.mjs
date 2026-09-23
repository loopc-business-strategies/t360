/**
 * Generate THARAGAI branding assets without Python.
 * Uses Node + sharp (installed locally under tools/branding-node).
 *
 * Source is a white-plate lockup with black outer corners (app-icon-source.jpg).
 * Opaque outputs: black corners → white.
 * Transparent outputs: black corners → alpha; near-white plate → alpha;
 * black READYMATES / red / gold pixels are preserved (no brass rewrite).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Corner/arc flood threshold — high enough to clear AA black plate edges. */
const BLACK_LUMA = 100;
const WHITE_LUMA = 235;
/** Outer rim (fraction of min side) where residual dark arc pixels are forced white/clear. */
const RIM_FRAC = 0.07;

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
  const lumaAt = (buf, i) => 0.2126 * buf[i] + 0.7152 * buf[i + 1] + 0.0722 * buf[i + 2];

  const originalBuf = Buffer.from(data);

  // Flood-fill near-black corners → white (opaque icons / marks / white logos).
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
    if (lumaAt(data, i) <= BLACK_LUMA) stack.push([sx, sy]);
  }
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const vi = y * w + x;
    if (visited[vi]) continue;
    const i = idx(x, y);
    if (lumaAt(data, i) > BLACK_LUMA) continue;
    visited[vi] = 1;
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
    data[i + 3] = 255;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  // Clear residual rounded-plate arc in the outer rim (disconnected AA pixels).
  const rim = Math.max(4, Math.floor(Math.min(w, h) * RIM_FRAC));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const onRim = x < rim || y < rim || x >= w - rim || y >= h - rim;
      if (!onRim) continue;
      const i = idx(x, y);
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const L = lumaAt(data, i);
      const nearNeutral = Math.abs(r - g) < 35 && Math.abs(g - b) < 35;
      if (nearNeutral && L < 140) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 255;
      }
    }
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

  async function resizeLongEdgePng(buf, longEdge) {
    const meta = await sharp(buf).metadata();
    const mw = meta.width || 1;
    const mh = meta.height || 1;
    const scale = longEdge / Math.max(mw, mh);
    const nw = Math.max(1, Math.round(mw * scale));
    const nh = Math.max(1, Math.round(mh * scale));
    return sharp(buf).resize(nw, nh, { fit: "fill" }).png().toBuffer();
  }

  function trimOpaqueBbox(rawBuf, width, height, ch) {
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * ch;
        if (rawBuf[i + 3] < 8) continue;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
    if (maxX < minX || maxY < minY) {
      throw new Error("no opaque content to trim");
    }
    const pad = Math.max(2, Math.floor(Math.min(width, height) * 0.01));
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(width - 1, maxX + pad);
    maxY = Math.min(height - 1, maxY + pad);
    return {
      left: minX,
      top: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    };
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

  // White-background full lockup (mobile + website)
  const whiteLogoPath = path.join(mobileOut, "tharagai_logo.png");
  await (await fitOnWhite(1024, 0.92)).removeAlpha().png().toFile(whiteLogoPath);
  console.log("wrote", whiteLogoPath);

  // Also write splash full if referenced elsewhere
  await (await fitOnWhite(1024, 0.9))
    .removeAlpha()
    .png()
    .toFile(path.join(mobileOut, "tharagai_splash.png"));

  // Transparent lockup: corner black → alpha only; knock near-white plate;
  // preserve black READYMATES / red / gold (no brass rewrite, no global dark knockout).
  const tRaw = Buffer.from(originalBuf);

  const tVisited = new Uint8Array(w * h);
  const tStack = [];
  for (const [sx, sy] of seeds) {
    const i = idx(sx, sy);
    if (lumaAt(tRaw, i) <= BLACK_LUMA) tStack.push([sx, sy]);
  }
  while (tStack.length) {
    const [x, y] = tStack.pop();
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const vi = y * w + x;
    if (tVisited[vi]) continue;
    const i = idx(x, y);
    if (tRaw[i + 3] === 0) continue;
    if (lumaAt(tRaw, i) > BLACK_LUMA) continue;
    tVisited[vi] = 1;
    tRaw[i + 3] = 0;
    tStack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  // Clear residual rim arcs on transparent path too.
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const onRim = x < rim || y < rim || x >= w - rim || y >= h - rim;
      if (!onRim) continue;
      const i = idx(x, y);
      if (tRaw[i + 3] === 0) continue;
      const r = tRaw[i];
      const g = tRaw[i + 1];
      const b = tRaw[i + 2];
      const L = lumaAt(tRaw, i);
      const nearNeutral = Math.abs(r - g) < 35 && Math.abs(g - b) < 35;
      if (nearNeutral && L < 140) tRaw[i + 3] = 0;
    }
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = idx(x, y);
      if (tRaw[i + 3] === 0) continue;
      const r = tRaw[i];
      const g = tRaw[i + 1];
      const b = tRaw[i + 2];
      const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      // Preserve brand colors and black READYMATES text.
      const isGold = g > 105 && r > 145 && b < 125 && g > b + 25;
      const isRed = r > 130 && r > g + 45 && r > b + 45;
      const isDarkText = L < 80 && Math.abs(r - g) < 30 && Math.abs(g - b) < 30;
      if (isGold || isRed || isDarkText) continue;
      // Knock near-white plate to transparent.
      if (L >= WHITE_LUMA && Math.abs(r - g) < 25 && Math.abs(g - b) < 25) {
        tRaw[i + 3] = 0;
      }
    }
  }

  const tBox = trimOpaqueBbox(tRaw, w, h, channels);
  console.log(`transparent bbox: ${tBox.width}x${tBox.height} @ (${tBox.left},${tBox.top})`);

  const croppedTransparent = await sharp(tRaw, { raw: { width: w, height: h, channels: 4 } })
    .extract(tBox)
    .png()
    .toBuffer();

  const transparentPath = path.join(mobileOut, "tharagai_logo_transparent.png");
  const transparent1 = await resizeLongEdgePng(croppedTransparent, 1024);
  fs.writeFileSync(transparentPath, transparent1);
  console.log("wrote", transparentPath);

  const tCheck = await sharp(transparent1).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let hasAlpha = false;
  let cornerBlack = 0;
  for (let i = 0; i < tCheck.data.length; i += tCheck.info.channels) {
    if (tCheck.data[i + 3] < 255) hasAlpha = true;
  }
  // Sample four corners of transparent asset — must be fully transparent.
  for (const [x, y] of [
    [0, 0],
    [tCheck.info.width - 1, 0],
    [0, tCheck.info.height - 1],
    [tCheck.info.width - 1, tCheck.info.height - 1],
  ]) {
    const i = (y * tCheck.info.width + x) * tCheck.info.channels;
    if (tCheck.data[i + 3] > 10) cornerBlack++;
  }
  if (!hasAlpha) throw new Error("transparent logo has no alpha");
  if (cornerBlack > 0) throw new Error("transparent logo corners not clear");
  console.log("transparent alpha check OK");

  // Website full logos: white-background cleaned lockup (user request).
  const whiteFull1 = await (await fitOnWhite(1024, 0.92)).removeAlpha().png().toBuffer();
  const whiteFull2 = await (await fitOnWhite(2048, 0.92)).removeAlpha().png().toBuffer();
  fs.writeFileSync(path.join(webPublic, "logo-full.png"), whiteFull1);
  fs.writeFileSync(path.join(webPublic, "logo-full@2x.png"), whiteFull2);
  fs.writeFileSync(path.join(webPublic, "logo.png"), whiteFull1);
  console.log("wrote web logo-full assets (white bg)");

  // Marks / favicons from star band on white-cleaned source.
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
