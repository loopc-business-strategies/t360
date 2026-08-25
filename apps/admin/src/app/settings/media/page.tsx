"use client";

import { Card, Badge } from "@t360/ui";

export default function SettingsMediaPage() {
  const configured = false; // secrets stay server-side; status via integrations
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Media settings</h1>
        <p className="text-sm text-muted">Cloudinary credentials are set via server environment only</p>
      </div>
      <Card className="space-y-3">
        <Badge tone="neutral">CLOUDINARY_* env vars</Badge>
        <p className="text-sm text-muted">
          Configure <code>CLOUDINARY_CLOUD_NAME</code>, <code>CLOUDINARY_API_KEY</code>, and{" "}
          <code>CLOUDINARY_API_SECRET</code> on the API. Secrets are never returned to the browser.
          {configured ? null : " Without credentials, mock media storage is used locally."}
        </p>
      </Card>
    </div>
  );
}
