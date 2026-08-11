"use client";

import { useQuery } from "@tanstack/react-query";
import { ErrorState, LoadingState, Table, TBody, TD, TH, THead, TR } from "@t360/ui";
import { apiFetch } from "../../lib/api";

type Analytics = {
  campaignRecipients: Array<{ status: string; count: number }>;
  abandonedReminders7d: number;
  segments: Array<{ id: string; name: string; count: number }>;
};

export default function MarketingAnalyticsPage() {
  const query = useQuery({
    queryKey: ["admin-marketing-analytics"],
    queryFn: () => apiFetch<Analytics>("/admin/marketing/analytics"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Marketing</h1>
        <p className="text-sm text-muted">Lightweight campaign and abandoned-cart analytics</p>
      </div>

      {query.isLoading ? <LoadingState label="Loading analytics…" /> : null}
      {query.isError ? (
        <ErrorState
          title="Could not load analytics"
          description={query.error.message}
          retryLabel="Retry"
          onRetry={() => query.refetch()}
        />
      ) : null}

      {query.data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="border border-border p-4">
              <p className="text-xs uppercase tracking-wide text-muted">Abandoned (7d)</p>
              <p className="font-display text-3xl">{query.data.data.abandonedReminders7d}</p>
            </div>
            {query.data.data.campaignRecipients.map((r) => (
              <div key={r.status} className="border border-border p-4">
                <p className="text-xs uppercase tracking-wide text-muted">Campaign {r.status}</p>
                <p className="font-display text-3xl">{r.count}</p>
              </div>
            ))}
          </div>

          <section className="space-y-3">
            <h2 className="font-display text-xl">Segment sizes</h2>
            {query.data.data.segments.length === 0 ? (
              <p className="text-sm text-muted">No active segments</p>
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Segment</TH>
                    <TH>Matched customers</TH>
                  </TR>
                </THead>
                <TBody>
                  {query.data.data.segments.map((s) => (
                    <TR key={s.id}>
                      <TD>{s.name}</TD>
                      <TD>{s.count}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
