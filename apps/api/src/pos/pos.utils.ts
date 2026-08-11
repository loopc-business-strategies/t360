export type InventoryCsvRow = {
  sku?: string;
  barcode?: string;
  branchCode: string;
  physicalQty?: number;
  qtyDelta?: number;
};

export function parseInventoryCsv(content: string): InventoryCsvRow[] {
  const lines = content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);

  const skuI = idx("sku");
  const barcodeI = idx("barcode");
  const branchI = idx("branchcode");
  const physI = idx("physicalqty");
  const deltaI = idx("qtydelta");

  if (branchI < 0) {
    throw new Error("CSV requires branchCode column");
  }
  if (skuI < 0 && barcodeI < 0) {
    throw new Error("CSV requires sku and/or barcode column");
  }
  if (physI < 0 && deltaI < 0) {
    throw new Error("CSV requires physicalQty and/or qtyDelta column");
  }

  const rows: InventoryCsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const branchCode = cols[branchI]?.trim();
    if (!branchCode) continue;
    const sku = skuI >= 0 ? cols[skuI]?.trim() || undefined : undefined;
    const barcode = barcodeI >= 0 ? cols[barcodeI]?.trim() || undefined : undefined;
    if (!sku && !barcode) continue;

    const physicalQty =
      physI >= 0 && cols[physI]?.trim() !== "" ? Number(cols[physI]) : undefined;
    const qtyDelta =
      deltaI >= 0 && cols[deltaI]?.trim() !== "" ? Number(cols[deltaI]) : undefined;

    if (physicalQty != null && Number.isNaN(physicalQty)) {
      throw new Error(`Invalid physicalQty on line ${i + 1}`);
    }
    if (qtyDelta != null && Number.isNaN(qtyDelta)) {
      throw new Error(`Invalid qtyDelta on line ${i + 1}`);
    }

    rows.push({ sku, barcode, branchCode, physicalQty, qtyDelta });
  }
  return rows;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}
