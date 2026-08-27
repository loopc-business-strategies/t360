"use client";

import * as React from "react";
import Link from "next/link";
import { useLocale } from "../lib/locale";
import { API_URL } from "../lib/catalog-api";
import type { CategoryNode } from "../lib/catalog-api";
import { StoreHeader } from "./store/store-header";

export function SiteHeader() {
  const [categories, setCategories] = React.useState<CategoryNode[]>([]);
  const [announcement, setAnnouncement] = React.useState<{ message: string; href?: string } | null>(
    null,
  );

  React.useEffect(() => {
    void fetch(`${API_URL}/categories`)
      .then((r) => r.json())
      .then((json) => setCategories(json.data ?? []))
      .catch(() => undefined);
    void fetch(`${API_URL}/settings/storefront`)
      .then((r) => r.json())
      .then((json) => {
        const sections = json.data?.sections as Array<{
          type: string;
          visible?: boolean;
          message?: string;
          href?: string;
        }> | undefined;
        const ann = sections?.find((s) => s.type === "announcement" && s.visible !== false);
        if (ann?.message) setAnnouncement({ message: ann.message, href: ann.href });
      })
      .catch(() => undefined);
  }, []);

  return <StoreHeader categories={categories} announcement={announcement} />;
}

export function SiteFooter() {
  const { t } = useLocale();
  return (
    <footer className="mt-auto border-t border-border bg-linen/70">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-10 sm:px-6">
        <div>
          <p className="font-display text-lg tracking-[0.14em]">{t.brand}</p>
          <p className="mt-1 text-sm text-muted">{t.footerTagline}</p>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link href="/policies/privacy" className="text-wine hover:underline">
            {t.navPrivacy}
          </Link>
          <Link href="/policies/terms" className="text-wine hover:underline">
            {t.navTerms}
          </Link>
          <Link href="/policies/shipping" className="text-wine hover:underline">
            {t.navShippingPolicy}
          </Link>
          <Link href="/policies/returns" className="text-wine hover:underline">
            {t.navReturns}
          </Link>
          <Link href="/policies/refunds" className="text-wine hover:underline">
            {t.navRefunds}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
