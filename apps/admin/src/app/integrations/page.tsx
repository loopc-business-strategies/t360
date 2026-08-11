"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, ErrorState, LoadingState } from "@t360/ui";
import { apiFetch } from "../../lib/api";

type PosStatus = {
  integration: {
    id: string;
    provider: string;
    kind: string;
    status: string;
    lastSyncAt: string | null;
    lastError: string | null;
  };
  health: boolean;
  providerMode: string;
  liveSynced: boolean;
  notice: string;
  recentWebhooks7d: number;
};

export default function IntegrationsPage() {
  const qc = useQueryClient();
  const [csv, setCsv] = React.useState(
    "sku,barcode,branchCode,qtyDelta\n",
  );

  const query = useQuery({
    queryKey: ["admin-pos"],
    queryFn: () => apiFetch<PosStatus>("/admin/integrations/pos"),
  });

  const sync = useMutation({
    mutationFn: () => apiFetch("/admin/integrations/pos/sync/inventory", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-pos"] }),
  });

  const toggle = useMutation({
    mutationFn: (status: "ready" | "disabled") =>
      apiFetch("/admin/integrations/pos", {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-pos"] }),
  });

  const importCsv = useMutation({
    mutationFn: () =>
      apiFetch("/admin/integrations/pos/import/inventory-csv", {
        method: "POST",
        body: JSON.stringify({ csv }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-pos"] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Integrations</h1>
        <p className="text-sm text-muted">Mock POS adapter — not connected to a live POS vendor</p>
      </div>

      {query.isLoading ? <LoadingState label="Loading…" /> : null}
      {query.isError ? (
        <ErrorState
          title="Could not load POS integration"
          description={query.error.message}
          retryLabel="Retry"
          onRetry={() => query.refetch()}
        />
      ) : null}

      {query.data ? (
        <>
          <div className="grid max-w-xl gap-3 border border-border p-4">
            <p className="text-sm text-wine">{query.data.data.notice}</p>
            <p className="text-sm">
              Provider: <span className="font-medium">{query.data.data.integration.provider}</span> ·{" "}
              <Badge tone={query.data.data.integration.status === "ready" ? "success" : "neutral"}>
                {query.data.data.integration.status}
              </Badge>
            </p>
            <p className="text-sm">
              Health: {query.data.data.health ? "ok" : "down"} · Live synced:{" "}
              {query.data.data.liveSynced ? "yes" : "no"}
            </p>
            <p className="text-sm text-muted">
              Last sync:{" "}
              {query.data.data.integration.lastSyncAt
                ? new Date(query.data.data.integration.lastSyncAt).toLocaleString()
                : "never"}
            </p>
            {query.data.data.integration.lastError ? (
              <p className="text-sm text-wine">{query.data.data.integration.lastError}</p>
            ) : null}
            <p className="text-sm">Webhooks (7d): {query.data.data.recentWebhooks7d}</p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => sync.mutate()} disabled={sync.isPending}>
                Run inventory sync
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  toggle.mutate(query.data.data.integration.status === "ready" ? "disabled" : "ready")
                }
                disabled={toggle.isPending}
              >
                {query.data.data.integration.status === "ready" ? "Disable" : "Enable"}
              </Button>
            </div>
            {sync.isError ? <p className="text-sm text-wine">{sync.error.message}</p> : null}
            {sync.isSuccess ? (
              <p className="text-sm text-muted">Sync finished (mock — may apply 0 deltas).</p>
            ) : null}
          </div>

          <section className="max-w-2xl space-y-3">
            <h2 className="font-display text-xl">Inventory CSV import</h2>
            <p className="text-sm text-muted">Columns: sku, barcode, branchCode, physicalQty and/or qtyDelta</p>
            <label className="block text-sm">
              CSV
              <textarea
                className="mt-1 w-full border border-border bg-elevated px-3 py-2 font-mono text-xs"
                rows={6}
                value={csv}
                onChange={(e) => setCsv(e.target.value)}
              />
            </label>
            <Button onClick={() => importCsv.mutate()} disabled={importCsv.isPending || !csv.trim()}>
              Import CSV
            </Button>
            {importCsv.isError ? <p className="text-sm text-wine">{importCsv.error.message}</p> : null}
            {importCsv.isSuccess ? (
              <p className="text-sm text-muted">{JSON.stringify(importCsv.data.data)}</p>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
}
