"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Card, ErrorState, LoadingState, Select } from "@t360/ui";
import { apiFetch } from "../../../lib/api";
import { AiFashionNav } from "../../../components/ai-fashion-nav";

type Dashboard = {
  counts?: Record<string, number>;
  averageProcessingMs?: number;
  topProducts?: Array<{ productId: string; count: number; product?: { name: string } | null }>;
};

type Session = {
  id: string;
  status: string;
  createdAt: string;
  errorMessage?: string | null;
  resultImageUrl?: string | null;
  inputImageUrl?: string | null;
  product?: { id: string; name: string } | null;
  customer?: { id: string; mobile?: string | null } | null;
};

export default function AdminTryOnPage() {
  const qc = useQueryClient();
  const [status, setStatus] = React.useState("all");
  const [settingsForm, setSettingsForm] = React.useState({
    enabled: true,
    retentionHours: 24,
    perUserPerHour: 10,
    maxConcurrentPerUser: 2,
    consentRequired: true,
    allowCamera: true,
    allowUpload: true,
    maxImageBytes: 8_000_000,
  });
  const [settingsSaved, setSettingsSaved] = React.useState(false);

  const dash = useQuery({
    queryKey: ["admin-try-on-dash"],
    queryFn: () => apiFetch<Dashboard>("/admin/ai-fashion/try-on/dashboard"),
  });

  const settingsQ = useQuery({
    queryKey: ["admin-try-on-settings"],
    queryFn: () => apiFetch<typeof settingsForm>("/admin/ai-fashion/try-on/settings"),
  });

  React.useEffect(() => {
    if (settingsQ.data?.data) setSettingsForm(settingsQ.data.data);
  }, [settingsQ.data]);

  const saveSettings = useMutation({
    mutationFn: () =>
      apiFetch("/admin/ai-fashion/try-on/settings", {
        method: "PATCH",
        body: JSON.stringify(settingsForm),
      }),
    onSuccess: () => {
      setSettingsSaved(true);
      void qc.invalidateQueries({ queryKey: ["admin-try-on-settings"] });
      setTimeout(() => setSettingsSaved(false), 2000);
    },
  });

  const list = useQuery({
    queryKey: ["admin-try-on-list", status],
    queryFn: () =>
      apiFetch<{ items: Session[] }>(
        `/admin/ai-fashion/try-on?pageSize=50${status !== "all" ? `&status=${status}` : ""}`,
      ),
    refetchInterval: 8000,
  });

  const retry = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/admin/ai-fashion/try-on/${id}/retry`, { method: "POST" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-try-on-list"] });
      void qc.invalidateQueries({ queryKey: ["admin-try-on-dash"] });
    },
  });

  const cancel = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/admin/ai-fashion/try-on/${id}/cancel`, { method: "POST" }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin-try-on-list"] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/admin/ai-fashion/try-on/${id}`, { method: "DELETE" }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin-try-on-list"] }),
  });

  const counts = dash.data?.data?.counts ?? {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Virtual Try-On</h1>
        <p className="mt-1 text-sm text-muted">Customer TRY ME sessions, metrics, and media cleanup</p>
      </div>
      <AiFashionNav />

      <Card className="space-y-3">
        <h2 className="font-display text-xl">TRY ME settings</h2>
        <p className="text-sm text-muted">Shared with Admin Mobile — same database settings.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settingsForm.enabled}
              onChange={(e) => setSettingsForm((s) => ({ ...s, enabled: e.target.checked }))}
            />
            Enable customer TRY ME
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settingsForm.consentRequired}
              onChange={(e) => setSettingsForm((s) => ({ ...s, consentRequired: e.target.checked }))}
            />
            Require photo retention consent UI
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settingsForm.allowCamera}
              onChange={(e) => setSettingsForm((s) => ({ ...s, allowCamera: e.target.checked }))}
            />
            Allow camera
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settingsForm.allowUpload}
              onChange={(e) => setSettingsForm((s) => ({ ...s, allowUpload: e.target.checked }))}
            />
            Allow gallery upload
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm">
            Retention hours
            <input
              className="mt-1 w-full rounded-md border border-border px-2 py-1"
              type="number"
              value={settingsForm.retentionHours}
              onChange={(e) =>
                setSettingsForm((s) => ({ ...s, retentionHours: Number(e.target.value) }))
              }
            />
          </label>
          <label className="text-sm">
            Per user / hour
            <input
              className="mt-1 w-full rounded-md border border-border px-2 py-1"
              type="number"
              value={settingsForm.perUserPerHour}
              onChange={(e) =>
                setSettingsForm((s) => ({ ...s, perUserPerHour: Number(e.target.value) }))
              }
            />
          </label>
          <label className="text-sm">
            Max concurrent / user
            <input
              className="mt-1 w-full rounded-md border border-border px-2 py-1"
              type="number"
              value={settingsForm.maxConcurrentPerUser}
              onChange={(e) =>
                setSettingsForm((s) => ({ ...s, maxConcurrentPerUser: Number(e.target.value) }))
              }
            />
          </label>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" disabled={saveSettings.isPending} onClick={() => saveSettings.mutate()}>
            {saveSettings.isPending ? "Saving…" : "Save TRY ME settings"}
          </Button>
          {settingsSaved ? <span className="text-sm text-success">Saved</span> : null}
          {saveSettings.isError ? (
            <span className="text-sm text-danger">{(saveSettings.error as Error).message}</span>
          ) : null}
        </div>
      </Card>

      {dash.isLoading ? <LoadingState label="Loading metrics…" /> : null}
      {dash.isError ? (
        <ErrorState title="Failed to load dashboard" description={dash.error.message} />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(counts).map(([k, v]) => (
          <Card key={k}>
            <p className="text-xs uppercase tracking-wide text-muted">{k}</p>
            <p className="mt-1 font-display text-2xl">{v}</p>
          </Card>
        ))}
        {dash.data?.data?.averageProcessingMs != null ? (
          <Card>
            <p className="text-xs uppercase tracking-wide text-muted">Avg ms</p>
            <p className="mt-1 font-display text-2xl">{dash.data.data.averageProcessingMs}</p>
          </Card>
        ) : null}
      </div>

      <div className="flex flex-wrap items-end gap-3">
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
            { value: "CANCELLED", label: "Cancelled" },
            { value: "EXPIRED", label: "Expired" },
          ]}
        />
      </div>

      {list.isLoading ? <LoadingState label="Loading sessions…" /> : null}
      {list.isError ? (
        <ErrorState title="Failed to load sessions" description={list.error.message} />
      ) : null}

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-linen text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Created</th>
              <th className="px-3 py-2 font-medium">Product</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Preview</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(list.data?.data?.items ?? []).map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="px-3 py-2 whitespace-nowrap">
                  {new Date(s.createdAt).toLocaleString()}
                </td>
                <td className="px-3 py-2">{s.product?.name ?? "—"}</td>
                <td className="px-3 py-2">
                  <Badge
                    tone={
                      s.status === "COMPLETED"
                        ? "success"
                        : s.status === "FAILED"
                          ? "danger"
                          : "neutral"
                    }
                  >
                    {s.status}
                  </Badge>
                  {s.errorMessage ? (
                    <p className="mt-1 max-w-xs truncate text-xs text-muted">{s.errorMessage}</p>
                  ) : null}
                </td>
                <td className="px-3 py-2">
                  {s.resultImageUrl || s.inputImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.resultImageUrl || s.inputImageUrl || ""}
                      alt=""
                      className="h-14 w-10 rounded object-cover"
                    />
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {s.status === "FAILED" ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => retry.mutate(s.id)}
                        disabled={retry.isPending}
                      >
                        Retry
                      </Button>
                    ) : null}
                    {s.status === "QUEUED" ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => cancel.mutate(s.id)}
                        disabled={cancel.isPending}
                      >
                        Cancel
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (confirm("Delete session and purge media?")) remove.mutate(s.id);
                      }}
                      disabled={remove.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(list.data?.data?.items ?? []).length === 0 && !list.isLoading ? (
          <p className="p-4 text-sm text-muted">No try-on sessions yet.</p>
        ) : null}
      </div>
    </div>
  );
}
