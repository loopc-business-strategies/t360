"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, Badge, LoadingState, ErrorState } from "@t360/ui";
import { apiFetch } from "../../../lib/api";

type MediaStatus = {
  cloudinaryConfigured: boolean;
  uploadBufferSupported: boolean;
  provider: string;
};

export default function SettingsMediaPage() {
  const status = useQuery({
    queryKey: ["admin-media-status"],
    queryFn: () => apiFetch<MediaStatus>("/admin/media/status"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Media settings</h1>
        <p className="text-sm text-muted">Cloudinary credentials are set via server environment only</p>
      </div>
      {status.isLoading ? <LoadingState label="Checking media…" /> : null}
      {status.isError ? (
        <ErrorState title="Failed" description={status.error.message} onRetry={() => status.refetch()} />
      ) : null}
      {status.data ? (
        <Card className="space-y-3">
          <Badge tone={status.data.data.cloudinaryConfigured ? "success" : "neutral"}>
            {status.data.data.cloudinaryConfigured ? "Cloudinary configured" : "Mock / not configured"}
          </Badge>
          <p className="text-sm text-muted">
            Provider: <code>{status.data.data.provider}</code>. Configure{" "}
            <code>CLOUDINARY_CLOUD_NAME</code>, <code>CLOUDINARY_API_KEY</code>, and{" "}
            <code>CLOUDINARY_API_SECRET</code> on the API. Secrets are never returned to the browser.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
