"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Badge, Card, ErrorState, LoadingState } from "@t360/ui";
import { apiFetch } from "../../lib/api";
import { AiFashionNav } from "../../components/ai-fashion-nav";

type Dashboard = {
  counts: {
    queued: number;
    processing: number;
    completed: number;
    failed: number;
    activeModels: number;
  };
  provider: string;
  apiKeyConfigured: boolean;
  enabled: boolean;
  recent: Array<{
    id: string;
    status: string;
    type: string;
    createdAt: string;
    product?: { id: string; name: string } | null;
    model?: { id: string; name: string } | null;
    outputImageUrl?: string | null;
  }>;
};

export default function AiFashionDashboardPage() {
  const query = useQuery({
    queryKey: ["ai-fashion-dashboard"],
    queryFn: () => apiFetch<Dashboard>("/admin/ai-fashion/dashboard"),
  });

  if (query.isLoading) return <LoadingState label="Loading AI Fashion…" />;
  if (query.isError || !query.data) {
    return (
      <ErrorState
        title="Could not load dashboard"
        description={query.error?.message}
        onRetry={() => query.refetch()}
        retryLabel="Retry"
      />
    );
  }

  const d = query.data.data;
  const cards = [
    { label: "Queued", value: d.counts.queued },
    { label: "Processing", value: d.counts.processing },
    { label: "Completed", value: d.counts.completed },
    { label: "Failed", value: d.counts.failed },
    { label: "Active models", value: d.counts.activeModels },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">AI Fashion Studio</h1>
        <p className="mt-1 text-sm text-muted">
          Generate professional on-model fashion images from product photos
        </p>
      </div>
      <AiFashionNav />

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge tone={d.enabled ? "success" : "neutral"}>
          {d.enabled ? "Enabled" : "Disabled"}
        </Badge>
        <Badge tone={d.apiKeyConfigured ? "success" : "brass"}>
          Provider: {d.provider}
          {d.apiKeyConfigured ? "" : " (not configured)"}
        </Badge>
        {!d.apiKeyConfigured ? (
          <Link href="/ai-fashion/settings" className="text-wine underline">
            Configure provider
          </Link>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <Card key={c.label} className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted">{c.label}</p>
            <p className="mt-1 font-display text-2xl">{c.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Recent generations</h2>
          <Link href="/ai-fashion/generate" className="text-sm text-wine underline">
            Generate image
          </Link>
        </div>
        <ul className="mt-4 divide-y divide-border">
          {d.recent.length === 0 ? (
            <li className="py-6 text-sm text-muted">No generations yet.</li>
          ) : (
            d.recent.map((j) => (
              <li key={j.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {j.product?.name ?? "Model create"} · {j.type}
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(j.createdAt).toLocaleString()}
                    {j.model ? ` · ${j.model.name}` : ""}
                  </p>
                </div>
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
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  );
}
