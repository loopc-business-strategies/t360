"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Button } from "@t360/ui";
import { useLocale } from "../lib/locale";
import { apiFetch, getCustomerToken } from "../lib/api";

export function SiteHeader() {
  const { t, toggleLocale } = useLocale();
  const pathname = usePathname();
  const [cartCount, setCartCount] = React.useState(0);

  React.useEffect(() => {
    if (!getCustomerToken()) return;
    void apiFetch<{ items: unknown[] }>("/cart")
      .then((res) => setCartCount(res.data.items?.length ?? 0))
      .catch(() => undefined);
  }, [pathname]);

  const links = [
    { href: "/products", label: t.navProducts },
    { href: "/ai", label: t.navAi },
    { href: "/cart", label: cartCount ? `${t.navCart} (${cartCount})` : t.navCart },
    { href: "/orders", label: t.navOrders },
    { href: "/wishlist", label: t.navWishlist },
    { href: "/account", label: t.navAccount },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-elevated/75 shadow-[0_1px_0_rgb(20_17_15/0.04)] backdrop-blur-xl supports-[backdrop-filter]:bg-elevated/65">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <Link href="/" className="font-display text-xl tracking-[0.14em] text-ink sm:text-[1.35rem]">
          {t.brand}
          <span className="mt-1 block h-0.5 w-10 bg-brass" />
        </Link>
        <nav className="flex flex-wrap items-center gap-1 sm:gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-md px-2 py-1.5 text-sm ${
                pathname.startsWith(l.href) ? "text-wine" : "text-muted hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Button variant="outline" type="button" onClick={toggleLocale} className="ml-1">
            {t.locale}
          </Button>
        </nav>
      </div>
    </header>
  );
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
