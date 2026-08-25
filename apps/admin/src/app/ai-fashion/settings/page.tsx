"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Card, ErrorState, Input, LoadingState, Select } from "@t360/ui";
import { apiFetch } from "../../../lib/api";
import { AiFashionNav } from "../../../components/ai-fashion-nav";

type Settings = {
  provider: string;
  apiKeyConfigured: boolean;
  enabled: boolean;
  defaultNumImages: number;
  defaultModelId: string | null;
  autoGenerateOnCreate: boolean;
  dailyLimit: number;
  monthlyLimit: number;
  defaultResolution: string;
  defaultGenerationMode: string;
  maintenanceMode?: boolean;
  productToModelEnabled?: boolean;
  virtualTryOnEnabled?: boolean;
  modelCreationEnabled?: boolean;
  requireApproval?: boolean;
  maxImagesPerJob?: number;
  maxConcurrentJobs?: number;
};

type FashionModel = { id: string; name: string };

type Usage = {
  total: number;
  creditsUsed: number;
  byStatus: Record<string, number>;
};

export default function AiFashionSettingsPage() {
  const qc = useQueryClient();
  const settings = useQuery({
    queryKey: ["ai-fashion-settings"],
    queryFn: () => apiFetch<Settings>("/admin/ai-fashion/settings"),
  });
  const usage = useQuery({
    queryKey: ["ai-fashion-usage"],
    queryFn: () => apiFetch<Usage>("/admin/ai-fashion/usage"),
  });
  const models = useQuery({
    queryKey: ["ai-fashion-models-settings"],
    queryFn: () => apiFetch<FashionModel[]>("/admin/ai-fashion/models?activeOnly=true"),
  });

  const [form, setForm] = React.useState<Partial<Settings>>({});
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    if (settings.data?.data) setForm(settings.data.data);
  }, [settings.data]);

  const save = useMutation({
    mutationFn: () =>
      apiFetch("/admin/ai-fashion/settings", {
        method: "PATCH",
        body: JSON.stringify({
          enabled: form.enabled,
          defaultNumImages: form.defaultNumImages,
          defaultModelId: form.defaultModelId,
          autoGenerateOnCreate: form.autoGenerateOnCreate,
          dailyLimit: form.dailyLimit,
          monthlyLimit: form.monthlyLimit,
          defaultResolution: form.defaultResolution,
          defaultGenerationMode: form.defaultGenerationMode,
          maintenanceMode: form.maintenanceMode,
          productToModelEnabled: form.productToModelEnabled,
          virtualTryOnEnabled: form.virtualTryOnEnabled,
          modelCreationEnabled: form.modelCreationEnabled,
          requireApproval: form.requireApproval,
          maxImagesPerJob: form.maxImagesPerJob,
          maxConcurrentJobs: form.maxConcurrentJobs,
        }),
      }),
    onSuccess: () => {
      setSaved(true);
      qc.invalidateQueries({ queryKey: ["ai-fashion-settings"] });
      setTimeout(() => setSaved(false), 2000);
    },
  });

  if (settings.isLoading) return <LoadingState label="Loading settings…" />;
  if (settings.isError || !settings.data) {
    return (
      <ErrorState
        title="Failed"
        description={settings.error?.message}
        onRetry={() => settings.refetch()}
        retryLabel="Retry"
      />
    );
  }

  const s = settings.data.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">AI Fashion Settings</h1>
        <p className="mt-1 text-sm text-muted">Provider configuration and generation defaults</p>
      </div>
      <AiFashionNav />

      <Card className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge tone={s.apiKeyConfigured ? "success" : "brass"}>
            Provider: {s.provider}
          </Badge>
          <Badge tone={s.apiKeyConfigured ? "success" : "neutral"}>
            API key: {s.apiKeyConfigured ? "Configured (••••••••)" : "Not set"}
          </Badge>
        </div>
        <p className="text-sm text-muted">
          Set <code className="text-xs">FASHION_AI_PROVIDER=fashn</code> and{" "}
          <code className="text-xs">FASHN_API_KEY</code> on the API server. The secret is never shown
          here after save.
        </p>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(form.enabled)}
            onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
          />
          AI Fashion enabled
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(form.maintenanceMode)}
            onChange={(e) => setForm((f) => ({ ...f, maintenanceMode: e.target.checked }))}
          />
          Maintenance mode
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.productToModelEnabled !== false}
            onChange={(e) => setForm((f) => ({ ...f, productToModelEnabled: e.target.checked }))}
          />
          Product → Model enabled
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.virtualTryOnEnabled !== false}
            onChange={(e) => setForm((f) => ({ ...f, virtualTryOnEnabled: e.target.checked }))}
          />
          Virtual Try-On enabled
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.modelCreationEnabled !== false}
            onChange={(e) => setForm((f) => ({ ...f, modelCreationEnabled: e.target.checked }))}
          />
          Model creation enabled
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(form.autoGenerateOnCreate)}
            onChange={(e) => setForm((f) => ({ ...f, autoGenerateOnCreate: e.target.checked }))}
          />
          Automatic generation on product create
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.requireApproval !== false}
            onChange={(e) => setForm((f) => ({ ...f, requireApproval: e.target.checked }))}
          />
          Require approval before gallery publish
        </label>

        <Select
          label="Default model"
          value={form.defaultModelId ?? "none"}
          onValueChange={(v) =>
            setForm((f) => ({ ...f, defaultModelId: v === "none" ? null : v }))
          }
          options={[
            { value: "none", label: "None (product-to-model)" },
            ...(models.data?.data ?? []).map((m) => ({ value: m.id, label: m.name })),
          ]}
        />
        <Select
          label="Default generation count"
          value={String(form.defaultNumImages ?? 1)}
          onValueChange={(v) => setForm((f) => ({ ...f, defaultNumImages: Number(v) }))}
          options={[
            { value: "1", label: "1" },
            { value: "2", label: "2" },
            { value: "4", label: "4" },
          ]}
        />
        <Select
          label="Default resolution"
          value={form.defaultResolution ?? "1k"}
          onValueChange={(v) => setForm((f) => ({ ...f, defaultResolution: v }))}
          options={[
            { value: "1k", label: "1K" },
            { value: "2k", label: "2K" },
            { value: "4k", label: "4K" },
          ]}
        />
        <Select
          label="Default quality"
          value={form.defaultGenerationMode ?? "balanced"}
          onValueChange={(v) => setForm((f) => ({ ...f, defaultGenerationMode: v }))}
          options={[
            { value: "fast", label: "Fast" },
            { value: "balanced", label: "Balanced" },
            { value: "quality", label: "Quality" },
          ]}
        />
        <Input
          label="Daily generation limit"
          type="number"
          value={String(form.dailyLimit ?? 50)}
          onChange={(e) => setForm((f) => ({ ...f, dailyLimit: Number(e.target.value) }))}
        />
        <Input
          label="Monthly generation limit"
          type="number"
          value={String(form.monthlyLimit ?? 500)}
          onChange={(e) => setForm((f) => ({ ...f, monthlyLimit: Number(e.target.value) }))}
        />
        <Input
          label="Max images per job"
          type="number"
          value={String(form.maxImagesPerJob ?? 4)}
          onChange={(e) => setForm((f) => ({ ...f, maxImagesPerJob: Number(e.target.value) }))}
        />
        <Input
          label="Max concurrent jobs"
          type="number"
          value={String(form.maxConcurrentJobs ?? 6)}
          onChange={(e) => setForm((f) => ({ ...f, maxConcurrentJobs: Number(e.target.value) }))}
        />

        <Button type="button" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save settings"}
        </Button>
        {saved ? <p className="text-sm text-success">Saved.</p> : null}
        {save.isError ? <p className="text-sm text-danger">{save.error.message}</p> : null}
      </Card>

      <Card>
        <h2 className="font-display text-xl">Usage (30 days)</h2>
        {usage.isLoading ? <LoadingState label="…" /> : null}
        {usage.data?.data ? (
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted">Generations</dt>
              <dd className="font-display text-2xl">{usage.data.data.total}</dd>
            </div>
            <div>
              <dt className="text-muted">Credits used</dt>
              <dd className="font-display text-2xl">{usage.data.data.creditsUsed}</dd>
            </div>
            <div>
              <dt className="text-muted">By status</dt>
              <dd className="text-sm">
                {Object.entries(usage.data.data.byStatus)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(" · ") || "—"}
              </dd>
            </div>
          </dl>
        ) : null}
      </Card>
    </div>
  );
}
