"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, ErrorState, Input, LoadingState, Table, TBody, TD, TH, THead, TR } from "@t360/ui";
import { apiFetch } from "../../../lib/api";

type CustomerDetail = {
  id: string;
  name: string | null;
  gender: string | null;
  user?: { mobile: string | null; email: string | null };
  loyaltyAccount?: { pointsBalance: number; tier: string } | null;
  orderSummary?: { count: number; revenue: number };
  orders?: Array<{ id: string; number: string; status: string; total: string | number; createdAt: string }>;
};

export default function CustomerDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const qc = useQueryClient();
  const [name, setName] = React.useState("");

  const query = useQuery({
    queryKey: ["admin-customer", id],
    queryFn: () => apiFetch<CustomerDetail>(`/admin/customers/${id}`),
  });

  React.useEffect(() => {
    if (query.data?.data.name != null) setName(query.data.data.name);
  }, [query.data?.data.name]);

  const save = useMutation({
    mutationFn: () =>
      apiFetch(`/admin/customers/${id}`, { method: "PATCH", body: JSON.stringify({ name }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-customer", id] }),
  });

  const c = query.data?.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Customer</h1>
        <p className="text-sm text-muted">{c?.user?.mobile ?? id}</p>
      </div>
      {query.isLoading ? <LoadingState label="Loading…" /> : null}
      {query.isError ? (
        <ErrorState title="Failed" description={query.error.message} retryLabel="Retry" onRetry={() => query.refetch()} />
      ) : null}
      {c ? (
        <>
          <div className="flex max-w-md flex-col gap-3">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <p className="text-sm text-muted">
              Orders: {c.orderSummary?.count ?? 0} · Revenue: ₹{c.orderSummary?.revenue ?? 0} · Points:{" "}
              {c.loyaltyAccount?.pointsBalance ?? 0}
            </p>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              Save
            </Button>
          </div>
          {c.orders && c.orders.length > 0 ? (
            <Table>
              <THead>
                <TR>
                  <TH>Order</TH>
                  <TH>Status</TH>
                  <TH>Total</TH>
                </TR>
              </THead>
              <TBody>
                {c.orders.map((o) => (
                  <TR key={o.id}>
                    <TD>{o.number}</TD>
                    <TD>{o.status}</TD>
                    <TD>₹{o.total}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
