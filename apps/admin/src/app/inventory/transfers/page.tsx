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
import { apiFetch } from "../../../lib/api";

type Branch = { id: string; code: string; name: string };

type Transfer = {
  id: string;
  status: string;
  fromBranch: Branch;
  toBranch: Branch;
  lines: Array<{ variantId: string; qty: number }>;
  notes?: string | null;
};

type InventoryRow = {
  variantId: string;
  variant: { sku: string; product: { name: string } };
};

export default function TransfersPage() {
  const qc = useQueryClient();
  const [fromBranchId, setFrom] = React.useState("");
  const [toBranchId, setTo] = React.useState("");
  const [variantId, setVariantId] = React.useState("");
  const [qty, setQty] = React.useState("1");
  const [notes, setNotes] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const branches = useQuery({
    queryKey: ["admin-branches"],
    queryFn: () => apiFetch<Branch[]>("/admin/branches"),
  });

  const inventory = useQuery({
    queryKey: ["admin-inventory-for-transfer", fromBranchId],
    enabled: Boolean(fromBranchId),
    queryFn: () => apiFetch<InventoryRow[]>(`/admin/inventory?branchId=${fromBranchId}`),
  });

  const transfers = useQuery({
    queryKey: ["admin-transfers"],
    queryFn: () => apiFetch<Transfer[]>("/admin/inventory/transfers"),
  });

  const create = useMutation({
    mutationFn: () =>
      apiFetch<Transfer>("/admin/inventory/transfers", {
        method: "POST",
        body: JSON.stringify({
          fromBranchId,
          toBranchId,
          notes: notes || undefined,
          lines: [{ variantId, qty: Number(qty) }],
        }),
      }),
    onSuccess: async () => {
      setError(null);
      setQty("1");
      setNotes("");
      await qc.invalidateQueries({ queryKey: ["admin-transfers"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const complete = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/admin/inventory/transfers/${id}/complete`, { method: "POST" }),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["admin-transfers"] }),
        qc.invalidateQueries({ queryKey: ["admin-inventory"] }),
      ]);
    },
    onError: (e: Error) => setError(e.message),
  });

  const variantOptions =
    inventory.data?.data.map((r) => ({
      value: r.variantId,
      label: `${r.variant.sku} — ${r.variant.product.name}`,
    })) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/inventory" className="text-sm text-wine hover:underline">
          ← Inventory
        </Link>
        <h1 className="mt-2 font-display text-3xl">Stock transfers</h1>
        <p className="text-sm text-muted">Move stock between branches (complete to apply)</p>
      </div>

      <form
        className="grid max-w-2xl gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <Select
          label="From"
          value={fromBranchId || "__"}
          onValueChange={(v) => {
            setFrom(v === "__" ? "" : v);
            setVariantId("");
          }}
          options={[
            { value: "__", label: "Select…" },
            ...(branches.data?.data.map((b) => ({ value: b.id, label: b.code })) ?? []),
          ]}
        />
        <Select
          label="To"
          value={toBranchId || "__"}
          onValueChange={(v) => setTo(v === "__" ? "" : v)}
          options={[
            { value: "__", label: "Select…" },
            ...(branches.data?.data.map((b) => ({ value: b.id, label: b.code })) ?? []),
          ]}
        />
        <Select
          label="Variant"
          value={variantId || "__"}
          onValueChange={(v) => setVariantId(v === "__" ? "" : v)}
          options={[{ value: "__", label: fromBranchId ? "Select…" : "Pick from branch first" }, ...variantOptions]}
          className="sm:col-span-2"
        />
        <Input label="Qty" type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} />
        <Input label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        {error ? <p className="text-sm text-wine sm:col-span-2">{error}</p> : null}
        <Button
          type="submit"
          disabled={!fromBranchId || !toBranchId || !variantId || create.isPending}
          className="sm:col-span-2 sm:w-fit"
        >
          Create transfer
        </Button>
      </form>

      {transfers.isLoading ? <LoadingState label="Loading transfers…" /> : null}
      {transfers.isError ? (
        <ErrorState
          title="Could not load transfers"
          description={transfers.error.message}
          retryLabel="Retry"
          onRetry={() => transfers.refetch()}
        />
      ) : null}
      {transfers.data && transfers.data.data.length === 0 ? (
        <EmptyState title="No transfers yet" description="Create a transfer above." />
      ) : null}

      {transfers.data && transfers.data.data.length > 0 ? (
        <Table>
          <THead>
            <TR>
              <TH>From → To</TH>
              <TH>Lines</TH>
              <TH>Status</TH>
              <TH />
            </TR>
          </THead>
          <TBody>
            {transfers.data.data.map((t) => (
              <TR key={t.id}>
                <TD>
                  {t.fromBranch.code} → {t.toBranch.code}
                </TD>
                <TD>{t.lines.map((l) => `${l.qty}`).join(", ")} units</TD>
                <TD>
                  <Badge tone={t.status === "completed" ? "success" : "neutral"}>{t.status}</Badge>
                </TD>
                <TD>
                  {t.status === "pending" ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={complete.isPending}
                      onClick={() => complete.mutate(t.id)}
                    >
                      Complete
                    </Button>
                  ) : null}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      ) : null}
    </div>
  );
}
