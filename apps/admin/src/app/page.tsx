"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ErrorState, LoadingState } from "@t360/ui";
import { apiFetch } from "../lib/api";

type Dashboard = {
  ordersToday: number;
  ordersWeek: number;
  revenueWeek: number;
  paymentPending: number;
  readyForPickup: number;
  lowStockCount: number;
};

export default function DashboardPage() {
  const query = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => apiFetch<Dashboard>("/admin/dashboard"),
  });

  const d = query.data?.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Dashboard</h1>
        <p className="text-sm text-muted">Orders, revenue, and ops signals</p>
      </div>

      {query.isLoading ? <LoadingState label="Loading dashboard…" /> : null}
      {query.isError ? (
        <ErrorState
          title="Could not load dashboard"
          description={query.error.message}
          retryLabel="Retry"
          onRetry={() => query.refetch()}
        />
      ) : null}

      {d ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Orders today", value: d.ordersToday, href: "/orders" },
            { label: "Orders (7d)", value: d.ordersWeek, href: "/orders" },
            { label: "Revenue (7d)", value: `₹${d.revenueWeek}`, href: "/reports" },
            { label: "Payment pending", value: d.paymentPending, href: "/orders" },
            { label: "Ready for pickup", value: d.readyForPickup, href: "/orders" },
            { label: "Low stock SKUs", value: d.lowStockCount, href: "/inventory" },
          ].map((kpi) => (
            <Link
              key={kpi.label}
              href={kpi.href}
              className="border border-border bg-elevated px-5 py-4 transition-colors hover:border-wine/40"
            >
              <p className="text-xs uppercase tracking-wide text-muted">{kpi.label}</p>
              <p className="mt-2 font-display text-3xl text-ink">{kpi.value}</p>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
