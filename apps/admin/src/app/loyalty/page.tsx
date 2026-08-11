"use client";

import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, ErrorState, Input, LoadingState, Table, TBody, TD, TH, THead, TR } from "@t360/ui";
import { apiFetch } from "../../lib/api";

type LoyaltyView = {
  customerId: string;
  pointsBalance: number;
  tier: string;
  recent: Array<{ id: string; delta: number; reason: string; balanceAfter: number; createdAt: string }>;
};

export default function LoyaltyPage() {
  const [customerId, setCustomerId] = React.useState("");
  const [lookupId, setLookupId] = React.useState("");
  const [delta, setDelta] = React.useState("10");
  const [reason, setReason] = React.useState("Manual adjust");

  const query = useQuery({
    queryKey: ["admin-loyalty", lookupId],
    queryFn: () => apiFetch<LoyaltyView>(`/admin/loyalty/${lookupId}`),
    enabled: Boolean(lookupId),
  });

  const adjust = useMutation({
    mutationFn: () =>
      apiFetch(`/admin/loyalty/${lookupId}/adjust`, {
        method: "POST",
        body: JSON.stringify({ delta: Number(delta), reason }),
      }),
    onSuccess: () => query.refetch(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Loyalty</h1>
        <p className="text-sm text-muted">Look up by customer id and adjust points</p>
      </div>

      <div className="flex max-w-xl flex-wrap items-end gap-3">
        <Input
          label="Customer ID"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="flex-1"
        />
        <Button type="button" onClick={() => setLookupId(customerId.trim())} disabled={!customerId.trim()}>
          Lookup
        </Button>
      </div>

      {query.isLoading ? <LoadingState label="Loading loyalty…" /> : null}
      {query.isError ? (
        <ErrorState
          title="Lookup failed"
          description={query.error.message}
          retryLabel="Retry"
          onRetry={() => query.refetch()}
        />
      ) : null}

      {query.data ? (
        <>
          <p className="text-sm">
            Balance: <span className="font-display text-2xl">{query.data.data.pointsBalance}</span> · Tier{" "}
            {query.data.data.tier}
          </p>
          <div className="grid max-w-md gap-3">
            <Input label="Delta (+/−)" value={delta} onChange={(e) => setDelta(e.target.value)} />
            <Input label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
            <Button onClick={() => adjust.mutate()} disabled={adjust.isPending}>
              Adjust
            </Button>
            {adjust.isError ? <p className="text-sm text-wine">{adjust.error.message}</p> : null}
          </div>
          <Table>
            <THead>
              <TR>
                <TH>Delta</TH>
                <TH>Reason</TH>
                <TH>Balance</TH>
                <TH>When</TH>
              </TR>
            </THead>
            <TBody>
              {query.data.data.recent.map((t) => (
                <TR key={t.id}>
                  <TD>{t.delta}</TD>
                  <TD>{t.reason}</TD>
                  <TD>{t.balanceAfter}</TD>
                  <TD>{new Date(t.createdAt).toLocaleString()}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </>
      ) : null}
    </div>
  );
}
