"use client";

import * as React from "react";
import { LocaleProvider } from "../lib/locale";
import { initClientSentry } from "../lib/sentry";
import { SiteFooter, SiteHeader } from "./site-chrome";

export function Providers({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    initClientSentry();
  }, []);

  return (
    <LocaleProvider>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </div>
    </LocaleProvider>
  );
}
