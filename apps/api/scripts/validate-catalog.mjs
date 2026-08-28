#!/usr/bin/env node
/**
 * Catalog integrity report — products, categories, images, SKUs, stock.
 * Report only; never deletes data.
 *
 * Usage: node apps/api/scripts/validate-catalog.mjs [--demo-only] [--json]
 */
import { PrismaClient } from "@prisma/client";

const demoOnly = process.argv.includes("--demo-only");
const jsonOut = process.argv.includes("--json");

const prisma = new PrismaClient();

function genderFromSlug(slug) {
  if (slug.startsWith("men-")) return "men";
  if (slug.startsWith("women-")) return "women";
  if (slug.startsWith("kids-")) return "kids";
  if (slug.startsWith("sarees-")) return "women";
  if (slug.startsWith("wedding-")) return "women";
  if (slug.startsWith("festival-")) return "unisex";
  return "unknown";
}

async function main() {
  const where = demoOnly ? { seedBatchId: "T360_DEMO_001", deletedAt: null } : { deletedAt: null };

  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: { include: { inventory: true } },
    },
  });

  const issues = [];
  const skuSeen = new Map();

  for (const p of products) {
    const row = {
      productId: p.id,
      slug: p.slug,
      name: p.name,
      category: p.category?.slug ?? null,
      gender: genderFromSlug(p.category?.slug ?? ""),
      imageCount: p.images.filter((i) => i.mediaType === "image").length,
      price: p.variants[0]?.price?.toString() ?? null,
      sku: p.variants[0]?.sku ?? null,
      stock: p.variants.reduce((n, v) => n + v.inventory.reduce((s, i) => s + i.physicalQty - i.reservedQty, 0), 0),
      issues: [],
    };

    if (!p.categoryId || !p.category || p.category.deletedAt) {
      row.issues.push("INVALID_CATEGORY");
    }
    if (p.images.filter((i) => i.mediaType === "image").length === 0) {
      row.issues.push("MISSING_IMAGE");
    }
    if (!p.variants.length) {
      row.issues.push("MISSING_VARIANT");
    } else {
      for (const v of p.variants) {
        if (!v.sku) row.issues.push("MISSING_SKU");
        else {
          const prev = skuSeen.get(v.sku);
          if (prev) row.issues.push(`DUPLICATE_SKU:${v.sku}`);
          else skuSeen.set(v.sku, p.id);
        }
        if (Number(v.price) <= 0) row.issues.push("INVALID_PRICE");
      }
    }
    if (p.status === "published" && row.stock === 0) {
      row.issues.push("ZERO_STOCK");
    }

    if (row.issues.length) issues.push(row);
  }

  const summary = {
    scanned: products.length,
    withIssues: issues.length,
    demoOnly,
    timestamp: new Date().toISOString(),
  };

  if (jsonOut) {
    console.log(JSON.stringify({ summary, issues }, null, 2));
  } else {
    console.log("THARAGAI Catalog Validation Report");
    console.log("==================================");
    console.log(`Scanned: ${summary.scanned} products${demoOnly ? " (demo batch only)" : ""}`);
    console.log(`Issues:  ${summary.withIssues}`);
    if (issues.length) {
      console.log("\nFirst 50 issues:");
      for (const row of issues.slice(0, 50)) {
        console.log(`- ${row.slug} [${row.category}] → ${row.issues.join(", ")}`);
      }
      if (issues.length > 50) console.log(`... and ${issues.length - 50} more`);
    } else {
      console.log("\nNo issues found.");
    }
  }

  await prisma.$disconnect();
  process.exit(issues.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
