"use client";

import { Suspense } from "react";
import { LoadingState } from "@t360/ui";
import GenerateClient from "./generate-client";

export default function AiFashionGeneratePage() {
  return (
    <Suspense fallback={<LoadingState label="Loading…" />}>
      <GenerateClient />
    </Suspense>
  );
}
