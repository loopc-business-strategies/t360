"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, ErrorState, Input, LoadingState, Table, TBody, TD, TH, THead, TR } from "@t360/ui";
import { apiFetch } from "../../lib/api";

type Segment = { id: string; name: string };

type Campaign = {
  id: string;
  name: string;
  status: string;
  channels: string[];
  couponCode: string | null;
  subject: string | null;
  body: string;
  segment: Segment | null;
  _count: { recipients: number };
};

export default function CampaignsPage() {
  const qc = useQueryClient();
  const [name, setName] = React.useState("");
  const [body, setBody] = React.useState("Thanks for shopping with Tharagai.");
  const [subject, setSubject] = React.useState("A note from Tharagai");
  const [couponCode, setCouponCode] = React.useState("");
  const [segmentId, setSegmentId] = React.useState("");
  const [channels, setChannels] = React.useState<string[]>(["email"]);

  const segments = useQuery({
    queryKey: ["admin-segments"],
    queryFn: () => apiFetch<Segment[]>("/admin/segments"),
  });

  const query = useQuery({
    queryKey: ["admin-campaigns"],
    queryFn: () => apiFetch<Campaign[]>("/admin/campaigns"),
  });

  const create = useMutation({
    mutationFn: () =>
      apiFetch("/admin/campaigns", {
        method: "POST",
        body: JSON.stringify({
          name,
          body,
          subject: subject || null,
          couponCode: couponCode || null,
          segmentId: segmentId || null,
          channels,
          status: "draft",
        }),
      }),
    onSuccess: () => {
      setName("");
      qc.invalidateQueries({ queryKey: ["admin-campaigns"] });
    },
  });

  const enqueue = useMutation({
    mutationFn: (id: string) => apiFetch(`/admin/campaigns/${id}/enqueue`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-campaigns"] }),
  });

  function toggleChannel(ch: string) {
    setChannels((prev) => (prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Campaigns</h1>
        <p className="text-sm text-muted">Draft and enqueue consent-aware broadcasts</p>
      </div>

      <div className="grid max-w-2xl gap-3">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <label className="text-sm">
          Body
          <textarea
            className="mt-1 w-full border border-border bg-elevated px-3 py-2"
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </label>
        <Input label="Coupon code (optional)" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
        <label className="text-sm">
          Segment
          <select
            className="mt-1 w-full border border-border bg-elevated px-3 py-2"
            value={segmentId}
            onChange={(e) => setSegmentId(e.target.value)}
          >
            <option value="">All customers</option>
            {(segments.data?.data ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-3 text-sm">
          {(["email", "sms", "push", "whatsapp"] as const).map((ch) => (
            <label key={ch} className="flex items-center gap-2">
              <input type="checkbox" checked={channels.includes(ch)} onChange={() => toggleChannel(ch)} />
              {ch}
            </label>
          ))}
        </div>
        <Button onClick={() => create.mutate()} disabled={!name || !body || channels.length === 0 || create.isPending}>
          Create draft
        </Button>
        {create.isError ? <p className="text-sm text-wine">{create.error.message}</p> : null}
      </div>

      {query.isLoading ? <LoadingState label="Loading campaigns…" /> : null}
      {query.isError ? (
        <ErrorState
          title="Could not load campaigns"
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
              <TH>Status</TH>
              <TH>Segment</TH>
              <TH>Channels</TH>
              <TH>Recipients</TH>
              <TH />
            </TR>
          </THead>
          <TBody>
            {query.data.data.map((c) => (
              <TR key={c.id}>
                <TD className="font-medium">{c.name}</TD>
                <TD>
                  <Badge tone={c.status === "running" || c.status === "completed" ? "success" : "neutral"}>
                    {c.status}
                  </Badge>
                </TD>
                <TD>{c.segment?.name ?? "All"}</TD>
                <TD className="text-xs">{(c.channels ?? []).join(", ")}</TD>
                <TD>{c._count?.recipients ?? 0}</TD>
                <TD>
                  {c.status === "draft" || c.status === "scheduled" ? (
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => enqueue.mutate(c.id)}
                      disabled={enqueue.isPending}
                    >
                      Enqueue
                    </Button>
                  ) : null}
                  {enqueue.isError ? <p className="text-xs text-wine">{enqueue.error.message}</p> : null}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      ) : null}
    </div>
  );
}
