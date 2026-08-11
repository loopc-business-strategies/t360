"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, ErrorState, Input, LoadingState, Table, TBody, TD, TH, THead, TR } from "@t360/ui";
import { apiFetch } from "../../lib/api";

type AbandonedView = {
  settings: { enabled: boolean; delayHours: number; maxReminders: number };
  reminders: Array<{
    id: string;
    cartId: string;
    wave: number;
    sentAt: string;
    customer: { id: string; name: string | null };
  }>;
};

export default function AbandonedCartPage() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["admin-abandoned-cart"],
    queryFn: () => apiFetch<AbandonedView>("/admin/abandoned-cart"),
  });

  const [enabled, setEnabled] = React.useState(true);
  const [delayHours, setDelayHours] = React.useState("24");
  const [maxReminders, setMaxReminders] = React.useState("1");

  React.useEffect(() => {
    if (!query.data) return;
    const s = query.data.data.settings;
    setEnabled(s.enabled);
    setDelayHours(String(s.delayHours));
    setMaxReminders(String(s.maxReminders));
  }, [query.data]);

  const save = useMutation({
    mutationFn: () =>
      apiFetch("/admin/abandoned-cart/settings", {
        method: "PATCH",
        body: JSON.stringify({
          enabled,
          delayHours: Number(delayHours),
          maxReminders: Number(maxReminders),
        }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-abandoned-cart"] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Abandoned cart</h1>
        <p className="text-sm text-muted">Reminder settings and recent sends</p>
      </div>

      {query.isLoading ? <LoadingState label="Loading…" /> : null}
      {query.isError ? (
        <ErrorState
          title="Could not load abandoned cart"
          description={query.error.message}
          retryLabel="Retry"
          onRetry={() => query.refetch()}
        />
      ) : null}

      {query.data ? (
        <>
          <div className="grid max-w-md gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
              Enabled
            </label>
            <Input label="Delay (hours)" value={delayHours} onChange={(e) => setDelayHours(e.target.value)} />
            <Input
              label="Max reminders"
              value={maxReminders}
              onChange={(e) => setMaxReminders(e.target.value)}
            />
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              Save settings
            </Button>
            {save.isError ? <p className="text-sm text-wine">{save.error.message}</p> : null}
          </div>

          <section className="space-y-3">
            <h2 className="font-display text-xl">Recent reminders</h2>
            {query.data.data.reminders.length === 0 ? (
              <p className="text-sm text-muted">No reminders yet</p>
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Customer</TH>
                    <TH>Cart</TH>
                    <TH>Wave</TH>
                    <TH>Sent</TH>
                  </TR>
                </THead>
                <TBody>
                  {query.data.data.reminders.map((r) => (
                    <TR key={r.id}>
                      <TD>{r.customer?.name ?? r.customer?.id}</TD>
                      <TD className="font-mono text-xs">{r.cartId.slice(0, 8)}…</TD>
                      <TD>{r.wave}</TD>
                      <TD>{new Date(r.sentAt).toLocaleString()}</TD>
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
