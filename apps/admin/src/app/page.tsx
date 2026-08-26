"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Badge, Button, Card, ErrorState, LoadingState } from "@t360/ui";
import { apiFetch } from "../lib/api";

type Dashboard = {
  ordersToday?: number;
  ordersWeek?: number;
  revenueWeek?: number;
  [key: string]: unknown;
};

type AiDash = {
  counts: { queued: number; processing: number; completed: number; failed: number };
  enabled: boolean;
};

export default function AdminDashboardPage() {
  const dash = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => apiFetch<Dashboard>("/admin/dashboard"),
  });
  const ai = useQuery({
    queryKey: ["ai-fashion-dashboard-home"],
    queryFn: () => apiFetch<AiDash>("/admin/ai-fashion/dashboard"),
    retry: false,
  });

  if (dash.isLoading) return <LoadingState label="Loading dashboard…" />;
  if (dash.isError) {
    return (
      <ErrorState
        title="Dashboard unavailable"
        description={dash.error.message}
        onRetry={() => dash.refetch()}
        retryLabel="Retry"
      />
    );
  }

  const d = dash.data?.data;
  const aiData = ai.data?.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Dashboard</h1>
        <p className="text-sm text-muted">Admin Control Center overview</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs uppercase text-muted">Orders today</p>
          <p className="mt-1 font-display text-2xl">{String(d?.ordersToday ?? "—")}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase text-muted">Revenue (7d)</p>
          <p className="mt-1 font-display text-2xl">
            {d?.revenueWeek != null ? `₹${d.revenueWeek}` : "—"}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase text-muted">Orders (7d)</p>
          <p className="mt-1 font-display text-2xl">{String(d?.ordersWeek ?? "—")}</p>
        </Card>
      </div>

      {aiData ? (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl">AI Fashion</h2>
              <p className="text-sm text-muted">
                Today&apos;s pipeline ·{" "}
                <Badge tone={aiData.enabled ? "success" : "neutral"}>
                  {aiData.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </p>
            </div>
            <Link href="/ai-fashion">
              <Button type="button">Open AI Studio</Button>
            </Link>
          </div>
          <dl className="mt-4 grid gap-3 sm:grid-cols-4">
            <div>
              <dt className="text-xs text-muted">Completed</dt>
              <dd className="font-display text-2xl">{aiData.counts.completed}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Processing</dt>
              <dd className="font-display text-2xl">{aiData.counts.processing}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Queued</dt>
              <dd className="font-display text-2xl">{aiData.counts.queued}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Failed</dt>
              <dd className="font-display text-2xl">{aiData.counts.failed}</dd>
            </div>
          </dl>
        </Card>
      ) : null}
    </div>
  );
}
