"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, ErrorState, Input, LoadingState, Table, TBody, TD, TH, THead, TR } from "@t360/ui";
import { apiFetch } from "../../lib/api";

type Segment = {
  id: string;
  name: string;
  rules: { minOrders?: number; minSpend?: number; hasMobile?: boolean };
  active: boolean;
};

export default function SegmentsPage() {
  const qc = useQueryClient();
  const [name, setName] = React.useState("");
  const [minOrders, setMinOrders] = React.useState("2");
  const [minSpend, setMinSpend] = React.useState("");
  const [hasMobile, setHasMobile] = React.useState(false);
  const [previewCounts, setPreviewCounts] = React.useState<Record<string, number>>({});

  const query = useQuery({
    queryKey: ["admin-segments"],
    queryFn: () => apiFetch<Segment[]>("/admin/segments"),
  });

  const create = useMutation({
    mutationFn: () =>
      apiFetch("/admin/segments", {
        method: "POST",
        body: JSON.stringify({
          name,
          active: true,
          rules: {
            ...(minOrders ? { minOrders: Number(minOrders) } : {}),
            ...(minSpend ? { minSpend: Number(minSpend) } : {}),
            ...(hasMobile ? { hasMobile: true } : {}),
          },
        }),
      }),
    onSuccess: () => {
      setName("");
      qc.invalidateQueries({ queryKey: ["admin-segments"] });
    },
  });

  const toggle = useMutation({
    mutationFn: (s: Segment) =>
      apiFetch(`/admin/segments/${s.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !s.active }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-segments"] }),
  });

  const preview = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch<{ count: number }>(`/admin/segments/${id}/preview`, { method: "POST" });
      return { id, count: res.data.count };
    },
    onSuccess: ({ id, count }) => setPreviewCounts((prev) => ({ ...prev, [id]: count })),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Segments</h1>
        <p className="text-sm text-muted">Rule-based customer audiences for campaigns</p>
      </div>

      <div className="grid max-w-2xl gap-3 sm:grid-cols-2">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Min orders" value={minOrders} onChange={(e) => setMinOrders(e.target.value)} />
        <Input label="Min spend" value={minSpend} onChange={(e) => setMinSpend(e.target.value)} />
        <label className="flex items-end gap-2 text-sm">
          <input type="checkbox" checked={hasMobile} onChange={(e) => setHasMobile(e.target.checked)} />
          Require mobile
        </label>
        <Button className="sm:col-span-2" onClick={() => create.mutate()} disabled={!name || create.isPending}>
          Create segment
        </Button>
        {create.isError ? <p className="text-sm text-wine sm:col-span-2">{create.error.message}</p> : null}
      </div>

      {query.isLoading ? <LoadingState label="Loading segments…" /> : null}
      {query.isError ? (
        <ErrorState
          title="Could not load segments"
          description={query.error.message}
          retryLabel="Retry"
          onRetry={() => query.refetch()}
        />
      ) : null}

      {query.data && query.data.data.length > 0 ? (
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Rules</TH>
              <TH>Status</TH>
              <TH>Preview</TH>
              <TH />
            </TR>
          </THead>
          <TBody>
            {query.data.data.map((s) => (
              <TR key={s.id}>
                <TD className="font-medium">{s.name}</TD>
                <TD className="text-xs text-muted">{JSON.stringify(s.rules)}</TD>
                <TD>
                  <Badge tone={s.active ? "success" : "neutral"}>{s.active ? "active" : "off"}</Badge>
                </TD>
                <TD>
                  {previewCounts[s.id] != null ? previewCounts[s.id] : "—"}
                  <Button
                    variant="outline"
                    className="ml-2"
                    type="button"
                    onClick={() => preview.mutate(s.id)}
                    disabled={preview.isPending}
                  >
                    Count
                  </Button>
                </TD>
                <TD>
                  <Button variant="outline" type="button" onClick={() => toggle.mutate(s)}>
                    Toggle
                  </Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      ) : null}
    </div>
  );
}
