"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, ErrorState, Input, LoadingState, Table, TBody, TD, TH, THead, TR } from "@t360/ui";
import { apiFetch } from "../../lib/api";

type SocialPost = {
  id: string;
  platform: string;
  title: string;
  body: string;
  mediaUrl: string | null;
  status: string;
};

export default function SocialPage() {
  const qc = useQueryClient();
  const [platform, setPlatform] = React.useState<"instagram" | "facebook" | "whatsapp_status">("instagram");
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [mediaUrl, setMediaUrl] = React.useState("");

  const query = useQuery({
    queryKey: ["admin-social-posts"],
    queryFn: () => apiFetch<SocialPost[]>("/admin/social-posts"),
  });

  const create = useMutation({
    mutationFn: () =>
      apiFetch("/admin/social-posts", {
        method: "POST",
        body: JSON.stringify({
          platform,
          title,
          body,
          mediaUrl: mediaUrl || null,
          status: "draft",
        }),
      }),
    onSuccess: () => {
      setTitle("");
      setBody("");
      setMediaUrl("");
      qc.invalidateQueries({ queryKey: ["admin-social-posts"] });
    },
  });

  const markReady = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/admin/social-posts/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "ready" }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-social-posts"] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/admin/social-posts/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-social-posts"] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Social drafts</h1>
        <p className="text-sm text-muted">Draft posts for Instagram, Facebook, WhatsApp status</p>
      </div>

      <div className="grid max-w-2xl gap-3">
        <label className="text-sm">
          Platform
          <select
            className="mt-1 w-full border border-border bg-elevated px-3 py-2"
            value={platform}
            onChange={(e) => setPlatform(e.target.value as typeof platform)}
          >
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="whatsapp_status">WhatsApp status</option>
          </select>
        </label>
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <label className="text-sm">
          Body
          <textarea
            className="mt-1 w-full border border-border bg-elevated px-3 py-2"
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </label>
        <Input label="Media URL (optional)" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} />
        <Button onClick={() => create.mutate()} disabled={!title || !body || create.isPending}>
          Create draft
        </Button>
        {create.isError ? <p className="text-sm text-wine">{create.error.message}</p> : null}
      </div>

      {query.isLoading ? <LoadingState label="Loading drafts…" /> : null}
      {query.isError ? (
        <ErrorState
          title="Could not load social posts"
          description={query.error.message}
          retryLabel="Retry"
          onRetry={() => query.refetch()}
        />
      ) : null}

      {query.data && query.data.data.length > 0 ? (
        <Table>
          <THead>
            <TR>
              <TH>Title</TH>
              <TH>Platform</TH>
              <TH>Status</TH>
              <TH />
            </TR>
          </THead>
          <TBody>
            {query.data.data.map((p) => (
              <TR key={p.id}>
                <TD className="font-medium">{p.title}</TD>
                <TD>{p.platform}</TD>
                <TD>
                  <Badge tone={p.status === "ready" ? "success" : "neutral"}>{p.status}</Badge>
                </TD>
                <TD className="space-x-2">
                  {p.status === "draft" ? (
                    <Button variant="outline" type="button" onClick={() => markReady.mutate(p.id)}>
                      Mark ready
                    </Button>
                  ) : null}
                  <Button variant="outline" type="button" onClick={() => remove.mutate(p.id)}>
                    Archive
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
