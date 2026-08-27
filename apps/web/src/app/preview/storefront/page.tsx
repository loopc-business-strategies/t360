import { Suspense } from "react";
import { LoadingState } from "@t360/ui";
import StorefrontPreviewClient from "./preview-client";

export default function StorefrontPreviewPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading draft preview…" />}>
      <StorefrontPreviewClient />
    </Suspense>
  );
}
