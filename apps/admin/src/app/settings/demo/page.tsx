"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Card, ErrorState, LoadingState } from "@t360/ui";
import { apiFetch } from "../../../lib/api";

type DemoStatus = {
  batchId: string;
  products: number;
  categories: number;
  collections: number;
  tryMe: number;
  images: number;
  videos: number;
};

export default function SettingsDemoPage() {
  const qc = useQueryClient();
  const [confirmOpen, setConfirmOpen] = React.useState<"remove" | "reset" | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  const status = useQuery({
    queryKey: ["admin-demo-data-status"],
    queryFn: () => apiFetch<DemoStatus>("/admin/demo-data/status"),
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["admin-demo-data-status"] });

  const seed = useMutation({
    mutationFn: () => apiFetch<DemoStatus>("/admin/demo-data/seed", { method: "POST", body: "{}" }),
    onSuccess: (res) => {
      setMessage(`Seeded ${res.data.products} products (${res.data.batchId ?? "T360_DEMO_001"}).`);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: () =>
      apiFetch<{ removedProducts: number }>("/admin/demo-data/remove", {
        method: "POST",
        body: JSON.stringify({ confirm: "REMOVE_DEMO_DATA" }),
      }),
    onSuccess: (res) => {
      setConfirmOpen(null);
      setMessage(`Removed ${res.data.removedProducts} demo products.`);
      invalidate();
    },
  });

  const reset = useMutation({
    mutationFn: () =>
      apiFetch<DemoStatus>("/admin/demo-data/reset", {
        method: "POST",
        body: JSON.stringify({ confirm: "RESET_DEMO_DATA" }),
      }),
    onSuccess: (res) => {
      setConfirmOpen(null);
      setMessage(`Reset complete — ${res.data.products} products seeded.`);
      invalidate();
    },
  });

  const busy = seed.isPending || remove.isPending || reset.isPending;
  const data = status.data?.data;
  const error =
    (seed.error as Error | undefined)?.message ||
    (remove.error as Error | undefined)?.message ||
    (reset.error as Error | undefined)?.message;

  const cards: Array<{ label: string; value: number | string | undefined }> = [
    { label: "Batch", value: data?.batchId },
    { label: "Products", value: data?.products },
    { label: "Categories", value: data?.categories },
    { label: "Collections", value: data?.collections },
    { label: "Images", value: data?.images },
    { label: "Videos", value: data?.videos },
    { label: "TRY ME", value: data?.tryMe },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Demo catalog</h1>
        <p className="text-sm text-muted">
          Seed, remove, or reset the T360_DEMO_001 premium catalog (120 products). Only demo-tagged rows are
          deleted — real orders and non-demo catalog stay intact.
        </p>
        <Link href="/settings" className="text-sm text-wine underline">
          ← Settings hub
        </Link>
      </div>

      {status.isLoading ? <LoadingState label="Loading status…" /> : null}
      {status.isError ? (
        <ErrorState
          title="Failed to load status"
          description={status.error.message}
          onRetry={() => status.refetch()}
        />
      ) : null}

      {data ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <Card key={c.label} className="space-y-1 p-4">
              <p className="text-xs uppercase tracking-wide text-muted">{c.label}</p>
              <p className="font-display text-2xl">{c.value ?? "—"}</p>
            </Card>
          ))}
        </div>
      ) : null}

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={(data?.products ?? 0) > 0 ? "success" : "neutral"}>
            {(data?.products ?? 0) > 0 ? "Demo data present" : "No demo batch"}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" disabled={busy} onClick={() => seed.mutate()}>
            {seed.isPending ? "Seeding…" : "Seed demo catalog"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy || !(data?.products)}
            onClick={() => setConfirmOpen("remove")}
          >
            Remove demo data
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => setConfirmOpen("reset")}
          >
            Reset (remove + seed)
          </Button>
        </div>
        {message ? <p className="text-sm text-success">{message}</p> : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <p className="text-xs text-muted">
          Production requires ALLOW_DEMO_SEED=true. Seed is idempotent by slug + batch id.
        </p>
      </Card>

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="max-w-md space-y-4 p-6">
            <h2 className="font-display text-xl">
              {confirmOpen === "remove" ? "Remove demo catalog?" : "Reset demo catalog?"}
            </h2>
            <p className="text-sm text-muted">
              {confirmOpen === "remove"
                ? "This permanently deletes products, variants, images, and demo-only categories/collections for T360_DEMO_001. Non-demo data is not touched."
                : "This removes the current demo batch and re-seeds 120 products. May take a few minutes."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={busy}
                onClick={() => (confirmOpen === "remove" ? remove.mutate() : reset.mutate())}
              >
                {busy ? "Working…" : confirmOpen === "remove" ? "Confirm remove" : "Confirm reset"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => setConfirmOpen(null)}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
