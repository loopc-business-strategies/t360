"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ErrorState, Input, LoadingState, Table, TBody, TD, TH, THead, TR } from "@t360/ui";
import { apiFetch } from "../../lib/api";

type CustomerRow = {
  id: string;
  name: string | null;
  user: { mobile: string | null; email: string | null };
  loyaltyAccount?: { pointsBalance: number } | null;
  _count: { orders: number };
};

export default function CustomersPage() {
  const [q, setQ] = React.useState("");
  const query = useQuery({
    queryKey: ["admin-customers", q],
    queryFn: () => {
      const params = new URLSearchParams({ pageSize: "50" });
      if (q) params.set("q", q);
      return apiFetch<{ items: CustomerRow[] }>(`/admin/customers?${params}`);
    },
  });

  const items = query.data?.data.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Customers</h1>
        <p className="text-sm text-muted">Search and open profiles</p>
      </div>
      <Input
        label="Search"
        placeholder="Name, mobile, email…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-md"
      />
      {query.isLoading ? <LoadingState label="Loading customers…" /> : null}
      {query.isError ? (
        <ErrorState
          title="Could not load customers"
          description={query.error.message}
          retryLabel="Retry"
          onRetry={() => query.refetch()}
        />
      ) : null}
      {items.length > 0 ? (
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Mobile</TH>
              <TH>Orders</TH>
              <TH>Points</TH>
            </TR>
          </THead>
          <TBody>
            {items.map((c) => (
              <TR key={c.id}>
                <TD>
                  <Link className="font-medium text-wine hover:underline" href={`/customers/${c.id}`}>
                    {c.name ?? "—"}
                  </Link>
                </TD>
                <TD>{c.user.mobile ?? c.user.email ?? "—"}</TD>
                <TD>{c._count.orders}</TD>
                <TD>{c.loyaltyAccount?.pointsBalance ?? 0}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      ) : null}
    </div>
  );
}
