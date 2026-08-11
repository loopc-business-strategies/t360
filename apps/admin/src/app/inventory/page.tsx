"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Select,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@t360/ui";
import { apiFetch } from "../../lib/api";

type Branch = { id: string; code: string; name: string };

type InventoryRow = {
  id: string;
  branchId: string;
  variantId: string;
  physicalQty: number;
  reservedQty: number;
  availableQty: number;
  lowStock: boolean;
  lowStockThreshold: number;
  branch: Branch;
  variant: { sku: string; barcode?: string | null; product: { name: string } };
};

export default function InventoryPage() {
  const qc = useQueryClient();
  const [branchId, setBranchId] = React.useState("");
  const [lowOnly, setLowOnly] = React.useState(false);
  const [lookup, setLookup] = React.useState("");
  const [lookupResult, setLookupResult] = React.useState<string | null>(null);
  const [adjustRow, setAdjustRow] = React.useState<InventoryRow | null>(null);
  const [qtyDelta, setQtyDelta] = React.useState("0");
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const branches = useQuery({
    queryKey: ["admin-branches"],
    queryFn: () => apiFetch<Branch[]>("/admin/branches"),
  });

  const inventory = useQuery({
    queryKey: ["admin-inventory", branchId, lowOnly],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (branchId) params.set("branchId", branchId);
      if (lowOnly) params.set("lowStockOnly", "true");
      return apiFetch<InventoryRow[]>(`/admin/inventory?${params}`);
    },
  });

  const adjust = useMutation({
    mutationFn: () =>
      apiFetch("/admin/inventory/adjust", {
        method: "POST",
        body: JSON.stringify({
          branchId: adjustRow!.branchId,
          variantId: adjustRow!.variantId,
          qtyDelta: Number(qtyDelta),
          reason: reason || undefined,
        }),
      }),
    onSuccess: async () => {
      setAdjustRow(null);
      setQtyDelta("0");
      setReason("");
      setError(null);
      await qc.invalidateQueries({ queryKey: ["admin-inventory"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  async function runLookup() {
    setLookupResult(null);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("sku", lookup);
      let res;
      try {
        res = await apiFetch<{
          sku: string;
          barcode?: string | null;
          product: { name: string };
          inventory: Array<{ branch: Branch; availableQty: number; physicalQty: number }>;
        }>(`/admin/inventory/lookup?${params}`);
      } catch {
        const byBarcode = new URLSearchParams({ barcode: lookup });
        res = await apiFetch<{
          sku: string;
          barcode?: string | null;
          product: { name: string };
          inventory: Array<{ branch: Branch; availableQty: number; physicalQty: number }>;
        }>(`/admin/inventory/lookup?${byBarcode}`);
      }
      const lines = res.data.inventory
        .map((i) => `${i.branch.code}: avail ${i.availableQty} (phys ${i.physicalQty})`)
        .join(" · ");
      setLookupResult(`${res.data.product.name} (${res.data.sku}) — ${lines || "no stock rows"}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Inventory</h1>
          <p className="text-sm text-muted">Per-branch stock · available = physical − reserved</p>
        </div>
        <Link href="/inventory/transfers">
          <Button variant="outline">Transfers</Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Select
          label="Branch"
          value={branchId || "__all"}
          onValueChange={(v) => setBranchId(v === "__all" ? "" : v)}
          options={[
            { value: "__all", label: "All branches" },
            ...(branches.data?.data.map((b) => ({ value: b.id, label: `${b.code} — ${b.name}` })) ??
              []),
          ]}
        />
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
          Low stock only
        </label>
        <div className="flex flex-1 flex-wrap items-end gap-2">
          <Input
            label="Lookup SKU / barcode"
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
            className="min-w-[200px] flex-1"
          />
          <Button type="button" variant="secondary" onClick={() => void runLookup()}>
            Lookup
          </Button>
        </div>
      </div>

      {lookupResult ? <p className="text-sm text-ink">{lookupResult}</p> : null}
      {error ? <p className="text-sm text-wine">{error}</p> : null}

      {adjustRow ? (
        <div className="max-w-md space-y-3 border border-border bg-elevated p-4">
          <p className="font-medium">
            Adjust {adjustRow.variant.sku} @ {adjustRow.branch.code}
          </p>
          <Input
            label="Qty delta (+/−)"
            type="number"
            value={qtyDelta}
            onChange={(e) => setQtyDelta(e.target.value)}
          />
          <Input label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="flex gap-2">
            <Button type="button" onClick={() => adjust.mutate()} disabled={adjust.isPending}>
              Save
            </Button>
            <Button type="button" variant="outline" onClick={() => setAdjustRow(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {inventory.isLoading ? <LoadingState label="Loading inventory…" /> : null}
      {inventory.isError ? (
        <ErrorState
          title="Could not load inventory"
          description={inventory.error.message}
          retryLabel="Retry"
          onRetry={() => inventory.refetch()}
        />
      ) : null}
      {inventory.data && inventory.data.data.length === 0 ? (
        <EmptyState title="No inventory rows" description="Seed inventory or adjust stock." />
      ) : null}

      {inventory.data && inventory.data.data.length > 0 ? (
        <Table>
          <THead>
            <TR>
              <TH>Branch</TH>
              <TH>SKU</TH>
              <TH>Product</TH>
              <TH>Physical</TH>
              <TH>Reserved</TH>
              <TH>Available</TH>
              <TH />
            </TR>
          </THead>
          <TBody>
            {inventory.data.data.map((row) => (
              <TR key={row.id}>
                <TD>{row.branch.code}</TD>
                <TD className="font-medium">{row.variant.sku}</TD>
                <TD>{row.variant.product.name}</TD>
                <TD>{row.physicalQty}</TD>
                <TD>{row.reservedQty}</TD>
                <TD>
                  <span className="inline-flex items-center gap-2">
                    {row.availableQty}
                    {row.lowStock ? <Badge tone="wine">Low</Badge> : null}
                  </span>
                </TD>
                <TD>
                  <Button type="button" variant="outline" onClick={() => setAdjustRow(row)}>
                    Adjust
                  </Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      ) : null}
    </div>
  );
}
