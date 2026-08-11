#!/usr/bin/env node
/**
 * Catalogue CSV dry-run (no DB). Mirrors apps/api catalog.utils validation rules.
 * Usage: node scripts/launch/csv-dry-run.mjs path/to/products.csv
 */
import fs from "node:fs";
import path from "node:path";

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseProductCsv(content) {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] ?? "";
    });
    return row;
  });
}

function validateCsvProductRow(row) {
  const errors = [];
  if (!row.name) errors.push("name is required");
  if (!row.category_slug && !row.category) errors.push("category_slug is required");
  if (!row.sku) errors.push("sku is required");
  if (!row.price || Number.isNaN(Number(row.price))) errors.push("price must be a number");
  return errors;
}

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/launch/csv-dry-run.mjs <products.csv>");
  process.exit(2);
}

const abs = path.resolve(file);
if (!fs.existsSync(abs)) {
  console.error(`File not found: ${abs}`);
  process.exit(2);
}

const content = fs.readFileSync(abs, "utf8");
const rows = parseProductCsv(content);

if (rows.length === 0) {
  console.error("No data rows found (need header + at least one row).");
  process.exit(1);
}

let bad = 0;
const skus = new Map();
rows.forEach((row, i) => {
  const lineNo = i + 2;
  const errors = validateCsvProductRow(row);
  const sku = row.sku || "";
  if (sku) {
    if (skus.has(sku)) errors.push(`duplicate sku (also row ${skus.get(sku)})`);
    else skus.set(sku, lineNo);
  }
  if (errors.length) {
    bad += 1;
    console.log(`Row ${lineNo}: FAIL — ${errors.join("; ")}`);
  } else {
    console.log(`Row ${lineNo}: OK — ${row.name} / ${row.sku}`);
  }
});

console.log(`\nSummary: ${rows.length - bad} ok, ${bad} failed, ${rows.length} total`);
process.exit(bad > 0 ? 1 : 0);
