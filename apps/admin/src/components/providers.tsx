"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { initClientSentry } from "../lib/sentry";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(() => new QueryClient());
  React.useEffect(() => {
    initClientSentry();
  }, []);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
