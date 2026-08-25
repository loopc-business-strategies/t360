"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Card, ErrorState, LoadingState, Modal, Select } from "@t360/ui";
import { apiFetch } from "../../../lib/api";
import { AiFashionNav } from "../../../components/ai-fashion-nav";

type Job = {
  id: string;
  status: string;
  type: string;
  createdAt: string;
  outputImageUrl?: string | null;
  inputImageUrl: string;
  error?: string | null;
  approvedAs?: string | null;
  product?: { id: string; name: string } | null;
  model?: { id: string; name: string } | null;
};

export default function AiFashionImagesPage() {
  const qc = useQueryClient();
  const [status, setStatus] = React.useState("all");
  const [preview, setPreview] = React.useState<Job | null>(null);

  const list = useQuery({
    queryKey: ["ai-fashion-jobs", status],
    queryFn: () =>
      apiFetch<Job[]>(
        `/admin/ai-fashion/jobs?pageSize=50${status !== "all" ? `&status=${status}` : ""}`,
      ),
    refetchInterval: 5000,
  });

  const approve = useMutation({
    mutationFn: ({ id, as }: { id: string; as: "primary" | "gallery" }) =>
      apiFetch(`/admin/ai-fashion/jobs/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ as }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai-fashion-jobs"] });
      setPreview(null);
    },
  });

  const retry = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/admin/ai-fashion/jobs/${id}/retry`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-fashion-jobs"] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/admin/ai-fashion/jobs/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-fashion-jobs"] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Generated Images</h1>
        <p className="mt-1 text-sm text-muted">Preview, approve, and manage AI fashion outputs</p>
      </div>
      <AiFashionNav />

      <Select
        label="Status"
        value={status}
        onValueChange={setStatus}
        options={[
          { value: "all", label: "All" },
          { value: "QUEUED", label: "Queued" },
          { value: "PROCESSING", label: "Processing" },
          { value: "COMPLETED", label: "Completed" },
          { value: "FAILED", label: "Failed" },
        ]}
      />

      {list.isLoading ? <LoadingState label="Loading…" /> : null}
      {list.isError ? (
        <ErrorState
          title="Failed to load"
          description={list.error.message}
          onRetry={() => list.refetch()}
          retryLabel="Retry"
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(list.data?.data ?? []).map((j) => (
          <Card key={j.id} className="overflow-hidden p-0">
            <div className="aspect-[3/4] bg-linen">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={j.outputImageUrl || j.inputImageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
            <div className="space-y-2 p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-medium">{j.product?.name ?? j.type}</p>
                <Badge
                  tone={
                    j.status === "COMPLETED"
                      ? "success"
                      : j.status === "FAILED"
                        ? "danger"
                        : "neutral"
                  }
                >
                  {j.status}
                </Badge>
              </div>
              <p className="text-xs text-muted">
                {j.type}
                {j.model ? ` · ${j.model.name}` : ""}
                <br />
                {new Date(j.createdAt).toLocaleString()}
              </p>
              {j.approvedAs ? (
                <p className="text-xs text-success">Approved as {j.approvedAs}</p>
              ) : null}
              {j.error ? <p className="text-xs text-danger">{j.error}</p> : null}
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => setPreview(j)}>
                  Preview
                </Button>
                {j.status === "COMPLETED" && j.product ? (
                  <>
                    <Button type="button" onClick={() => approve.mutate({ id: j.id, as: "gallery" })}>
                      Approve
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => approve.mutate({ id: j.id, as: "primary" })}
                    >
                      Primary
                    </Button>
                  </>
                ) : null}
                {j.status === "FAILED" ? (
                  <Button type="button" onClick={() => retry.mutate(j.id)}>
                    Retry
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (confirm("Delete this generation?")) remove.mutate(j.id);
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={Boolean(preview)} onOpenChange={(o) => !o && setPreview(null)} title="Preview">
        {preview ? (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview.outputImageUrl || preview.inputImageUrl}
              alt=""
              className="max-h-[70vh] w-full object-contain"
            />
            <p className="text-sm text-muted">
              {preview.product?.name ?? preview.type} · {preview.status}
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
