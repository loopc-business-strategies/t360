"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnnouncementBar, Button } from "@t360/ui";
import { useLocale } from "../../lib/locale";
import { apiFetch, getCustomerToken } from "../../lib/api";
import type { CategoryNode, CollectionItem } from "../../lib/catalog-api";
import { MegaMenu } from "./mega-menu";
import { MiniCartDrawer } from "./mini-cart-drawer";
import { SearchOverlay } from "./search-overlay";

const NAV = [
  { key: "men", slug: "men", fallback: "Men" },
  { key: "women", slug: "women", fallback: "Women" },
  { key: "kids", slug: "kids", fallback: "Kids" },
  { key: "collections", href: "/products", fallback: "Collections" },
] as const;

function findCategory(categories: CategoryNode[], slug: string): CategoryNode | null {
  for (const c of categories) {
    if (c.slug === slug) return c;
    if (c.children?.length) {
      const hit: CategoryNode | null = findCategory(c.children, slug);
      if (hit) return hit;
    }
  }
  return null;
}

export function StoreHeader({
  categories = [],
  collections = [],
  announcement,
}: {
  categories?: CategoryNode[];
  collections?: CollectionItem[];
  announcement?: { message: string; href?: string } | null;
}) {
  const { t, toggleLocale } = useLocale();
  const pathname = usePathname();
  const [cartCount, setCartCount] = React.useState(0);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [cartOpen, setCartOpen] = React.useState(false);
  const [mobileNav, setMobileNav] = React.useState(false);

  React.useEffect(() => {
    if (!getCustomerToken()) {
      setCartCount(0);
      return;
    }
    void apiFetch<{ items: unknown[] }>("/cart")
      .then((res) => setCartCount(res.data.items?.length ?? 0))
      .catch(() => undefined);
  }, [pathname, cartOpen]);

  const topCategories = categories.filter((c) => !c.children?.length || c.children.length >= 0);

  return (
    <>
      {announcement?.message ? (
        <AnnouncementBar message={announcement.message} href={announcement.href} />
      ) : null}
      <header className="sticky top-0 z-header border-b border-border/60 bg-elevated/90 shadow-[0_1px_0_rgb(20_17_15/0.04)] backdrop-blur-xl">
        <div className="relative mx-auto flex h-header max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-md p-2 text-ink lg:hidden"
              aria-label="Open menu"
              aria-expanded={mobileNav}
              onClick={() => setMobileNav((v) => !v)}
            >
              ☰
            </button>
            <Link href="/" className="font-display text-lg tracking-[0.14em] text-ink sm:text-xl">
              {t.brand}
            </Link>
          </div>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {NAV.map((item) => {
              const cat = "slug" in item ? findCategory(topCategories, item.slug) : null;
              const href =
                "href" in item
                  ? item.href
                  : cat
                    ? `/categories/${cat.slug}`
                    : `/products?category=${item.slug}`;
              const label = cat?.name ?? item.fallback;
              const isShop = item.key === "collections";
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`rounded-md px-3 py-2 text-sm ${
                    pathname.startsWith(href) ? "text-wine" : "text-muted hover:text-ink"
                  }`}
                  onMouseEnter={() => isShop && setMenuOpen(true)}
                  onFocus={() => isShop && setMenuOpen(true)}
                  onClick={() => {
                    if (isShop) {
                      setMenuOpen((v) => !v);
                      return;
                    }
                    window.location.href = href;
                  }}
                >
                  {label}
                </button>
              );
            })}
            <Link
              href="/products?sort=price_desc"
              className="rounded-md px-3 py-2 text-sm text-wine hover:underline"
            >
              {t.navSale ?? "Sale"}
            </Link>
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              className="rounded-md px-2 py-2 text-sm text-muted hover:text-ink"
              aria-label={t.search}
              onClick={() => setSearchOpen(true)}
            >
              🔍
            </button>
            <Link
              href="/wishlist"
              className="hidden rounded-md px-2 py-2 text-sm text-muted hover:text-ink sm:inline"
            >
              ♡
            </Link>
            <Link
              href="/account"
              className="rounded-md px-2 py-2 text-sm text-muted hover:text-ink"
            >
              {t.navAccount}
            </Link>
            <button
              type="button"
              className="relative rounded-md px-2 py-2 text-sm text-muted hover:text-ink"
              aria-label={t.navCart}
              onClick={() => setCartOpen(true)}
            >
              👜
              {cartCount ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-wine px-1 text-[10px] text-elevated">
                  {cartCount}
                </span>
              ) : null}
            </button>
            <Button variant="outline" type="button" onClick={toggleLocale} className="hidden sm:inline-flex">
              {t.locale}
            </Button>
          </div>

          <MegaMenu
            categories={topCategories}
            collections={collections}
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            saleLabel={t.navSale ?? "Sale"}
          />
        </div>

        {mobileNav ? (
          <nav className="border-t border-border px-4 py-4 lg:hidden" aria-label="Mobile">
            <ul className="space-y-2">
              {NAV.map((item) => {
                const cat = "slug" in item ? findCategory(topCategories, item.slug) : null;
                const href =
                  "href" in item
                    ? item.href
                    : cat
                      ? `/categories/${cat.slug}`
                      : `/products?category=${item.slug}`;
                return (
                  <li key={item.key}>
                    <Link
                      href={href}
                      className="block py-2 text-sm"
                      onClick={() => setMobileNav(false)}
                    >
                      {cat?.name ?? item.fallback}
                    </Link>
                  </li>
                );
              })}
              <li>
                <Link href="/products" className="block py-2 text-sm text-wine" onClick={() => setMobileNav(false)}>
                  {t.navSale ?? "Sale"}
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="block py-2 text-sm" onClick={() => setMobileNav(false)}>
                  {t.navWishlist}
                </Link>
              </li>
            </ul>
          </nav>
        ) : null}
      </header>

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        searchLabel={t.search}
        recentLabel={t.recentSearches ?? "Recent searches"}
      />
      <MiniCartDrawer
        open={cartOpen}
        onOpenChange={setCartOpen}
        title={t.navCart}
        emptyLabel={t.emptyCart}
        checkoutLabel={t.checkout}
        viewBagLabel={t.viewBag ?? "View bag"}
      />
    </>
  );
}
