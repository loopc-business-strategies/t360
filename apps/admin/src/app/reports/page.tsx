"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, ErrorState, LoadingState, Table, TBody, TD, TH, THead, TR } from "@t360/ui";
import { apiFetch } from "../../lib/api";

type SalesReport = {
  from: string;
  to: string;
  daily: Array<{ date: string; total: number }>;
  statusMix: Array<{ status: string; count: number }>;
  topProducts: Array<{ sku: string; name: string; qty: number; revenue: number }>;
};

type AiReport = {
  tryOn: { total: number; completed: number; failed: number; queueDepth: number };
  aiFashion: { completed: number; failed: number; queueDepth: number };
};

export default function ReportsPage() {
  const query = useQuery({
    queryKey: ["admin-sales-report"],
    queryFn: () => apiFetch<SalesReport>("/admin/reports/sales"),
  });
  const aiQuery = useQuery({
    queryKey: ["admin-ai-report"],
    queryFn: () => apiFetch<AiReport>("/admin/reports/ai"),
  });

  const data = query.data?.data;
  const ai = aiQuery.data?.data;
  const maxDaily = Math.max(1, ...(data?.daily.map((d) => d.total) ?? [1]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">Reports</h1>
        <p className="text-sm text-muted">Sales series, AI / TRY ME, status mix, top products</p>
      </div>

      {aiQuery.isLoading ? <LoadingState label="Loading AI stats…" /> : null}
      {ai ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted">TRY ME total</p>
            <p className="mt-2 font-display text-3xl">{ai.tryOn.total}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted">TRY ME queue</p>
            <p className="mt-2 font-display text-3xl">{ai.tryOn.queueDepth}</p>
            <p className="mt-1 text-xs text-muted">
              {ai.tryOn.completed} done · {ai.tryOn.failed} failed
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted">AI Fashion queue</p>
            <p className="mt-2 font-display text-3xl">{ai.aiFashion.queueDepth}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted">AI Fashion</p>
            <p className="mt-2 font-display text-3xl">{ai.aiFashion.completed}</p>
            <p className="mt-1 text-xs text-muted">{ai.aiFashion.failed} failed</p>
          </Card>
        </section>
      ) : null}

      {query.isLoading ? <LoadingState label="Loading report…" /> : null}
      {query.isError ? (
        <ErrorState
          title="Could not load report"
          description={query.error.message}
          retryLabel="Retry"
          onRetry={() => query.refetch()}
        />
      ) : null}

      {data ? (
        <>
          <section className="space-y-3">
            <h2 className="font-display text-xl">Daily sales</h2>
            <div className="flex h-40 items-end gap-1 border border-border bg-elevated p-3">
              {data.daily.length === 0 ? (
                <p className="text-sm text-muted">No sales in range</p>
              ) : (
                data.daily.map((d) => (
                  <div key={d.date} className="flex flex-1 flex-col items-center justify-end gap-1">
                    <div
                      className="w-full max-w-[28px] bg-wine"
                      style={{ height: `${Math.max(4, (d.total / maxDaily) * 100)}%` }}
                      title={`${d.date}: ₹${d.total}`}
                    />
                    <span className="hidden text-[10px] text-muted sm:block">{d.date.slice(5)}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl">Status mix</h2>
            <Table>
              <THead>
                <TR>
                  <TH>Status</TH>
                  <TH>Count</TH>
                </TR>
              </THead>
              <TBody>
                {data.statusMix.map((s) => (
                  <TR key={s.status}>
                    <TD>{s.status}</TD>
                    <TD>{s.count}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl">Top products</h2>
            <Table>
              <THead>
                <TR>
                  <TH>SKU</TH>
                  <TH>Name</TH>
                  <TH>Qty</TH>
                  <TH>Revenue</TH>
                </TR>
              </THead>
              <TBody>
                {data.topProducts.map((p) => (
                  <TR key={p.sku}>
                    <TD>{p.sku}</TD>
                    <TD>{p.name}</TD>
                    <TD>{p.qty}</TD>
                    <TD>₹{p.revenue}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </section>
        </>
      ) : null}
    </div>
  );
}
