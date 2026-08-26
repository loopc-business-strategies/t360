"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Card, ErrorState, Input, LoadingState } from "@t360/ui";
import { apiFetch } from "../../../lib/api";

type Catalog = {
  categories: Array<{
    id: string;
    fields: Array<{ key: string; label: string; value: unknown }>;
    status?: { configured?: boolean; provider?: string };
  }>;
};

export default function SettingsMediaPage() {
  const qc = useQueryClient();
  const catalog = useQuery({
    queryKey: ["admin-settings-catalog"],
    queryFn: () => apiFetch<Catalog>("/admin/settings/catalog"),
  });
  const storage = catalog.data?.data.categories.find((c) => c.id === "storage");
  const maxField = storage?.fields.find((f) => f.key === "media.maxUploadBytes");
  const [maxUploadBytes, setMaxUploadBytes] = React.useState<number>(12_000_000);

  React.useEffect(() => {
    if (typeof maxField?.value === "number") setMaxUploadBytes(maxField.value);
  }, [maxField?.value]);

  const save = useMutation({
    mutationFn: () =>
      apiFetch("/admin/settings/storage", {
        method: "PATCH",
        body: JSON.stringify({ maxUploadBytes }),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin-settings-catalog"] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Media / Storage</h1>
        <p className="text-sm text-muted">
          Cloudinary secrets are server-only. Upload size is editable here and on Admin Mobile.
        </p>
        <Link href="/settings" className="text-sm text-wine underline">
          ← Settings hub
        </Link>
      </div>
      {catalog.isLoading ? <LoadingState label="Loading…" /> : null}
      {catalog.isError ? (
        <ErrorState
          title="Failed"
          description={catalog.error.message}
          onRetry={() => catalog.refetch()}
        />
      ) : null}
      {storage ? (
        <Card className="space-y-4">
          <Badge tone={storage.status?.configured ? "success" : "neutral"}>
            {storage.status?.configured
              ? `Provider: ${storage.status.provider}`
              : "Mock / not configured"}
          </Badge>
          <Input
            label="Max upload bytes"
            type="number"
            value={String(maxUploadBytes)}
            onChange={(e) => setMaxUploadBytes(Number(e.target.value))}
          />
          <Button type="button" disabled={save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? "Saving…" : "Save storage settings"}
          </Button>
          {save.isError ? (
            <p className="text-sm text-danger">{(save.error as Error).message}</p>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
