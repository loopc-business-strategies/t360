"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Badge, EmptyState, ErrorState, LoadingState, Table, TBody, TD, TH, THead, TR } from "@t360/ui";
import { apiFetch } from "../../lib/api";

type Order = {
  id: string;
  number: string;
  status: string;
  fulfillment: string;
  total: string | number;
  customer?: { name?: string | null };
  createdAt: string;
};

export default function AdminOrdersPage() {
  const query = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => apiFetch<Order[]>("/admin/orders"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Orders</h1>
        <p className="text-sm text-muted">Fulfillment, status, pickup verify</p>
      </div>

      {query.isLoading ? <LoadingState label="Loading orders…" /> : null}
      {query.isError ? (
        <ErrorState
          title="Could not load orders"
          description={query.error.message}
          retryLabel="Retry"
          onRetry={() => query.refetch()}
        />
      ) : null}
      {query.data && query.data.data.length === 0 ? (
        <EmptyState title="No orders" description="Customer checkouts will appear here." />
      ) : null}

      {query.data && query.data.data.length > 0 ? (
        <Table>
          <THead>
            <TR>
              <TH>Number</TH>
              <TH>Customer</TH>
              <TH>Fulfillment</TH>
              <TH>Status</TH>
              <TH>Total</TH>
            </TR>
          </THead>
          <TBody>
            {query.data.data.map((o) => (
              <TR key={o.id}>
                <TD>
                  <Link className="font-medium text-wine hover:underline" href={`/orders/${o.id}`}>
                    {o.number}
                  </Link>
                </TD>
                <TD>{o.customer?.name ?? "—"}</TD>
                <TD>{o.fulfillment}</TD>
                <TD>
                  <Badge tone="neutral">{o.status}</Badge>
                </TD>
                <TD>₹{o.total}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      ) : null}
    </div>
  );
}
