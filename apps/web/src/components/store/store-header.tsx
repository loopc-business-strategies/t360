"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnnouncementBar, Button } from "@t360/ui";
import { useLocale } from "../../lib/locale";
import { apiFetch, getCustomerToken } from "../../lib/api";
import type { CategoryNode, CollectionItem } from "../../lib/catalog-api";
import { MegaMenu, type MegaPanelId } from "./mega-menu";
import { MiniCartDrawer } from "./mini-cart-drawer";
import { SearchOverlay } from "./search-overlay";

const NAV: Array<{ id: MegaPanelId; href: string; fallback: string }> = [
  { id: "new", href: "/products?isNew=true", fallback: "New & Featured" },
  { id: "men", href: "/men", fallback: "Men" },
  { id: "women", href: "/women", fallback: "Women" },
  { id: "kids", href: "/kids", fallback: "Kids" },
  { id: "other", href: "/categories/sarees", fallback: "Other" },
  { id: "collections", href: "/products", fallback: "Collections" },
  { id: "sale", href: "/sale", fallback: "Sale" },
];

const OPEN_MS = 150;
const CLOSE_MS = 200;

function IconSearch(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function IconHeart(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden {...props}>
      <path
        d="M12 20s-7-4.4-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.6-7 10-7 10z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconBag(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden {...props}>
      <path d="M6 8h12l-1 12H7L6 8z" strokeLinejoin="round" />
      <path d="M9 8V7a3 3 0 016 0v1" strokeLinecap="round" />
    </svg>
  );
}

function IconMenu(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function findCategory(categories: CategoryNode[], slug: string): CategoryNode | null {
  for (const c of categories) {
    if (c.slug === slug) return c;
    if (c.children?.length) {
      const hit = findCategory(c.children, slug);
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
  const router = useRouter();
  const [cartCount, setCartCount] = React.useState(0);
  const [panel, setPanel] = React.useState<MegaPanelId | null>(null);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [cartOpen, setCartOpen] = React.useState(false);
  const [mobileNav, setMobileNav] = React.useState(false);
  const [mobileExpanded, setMobileExpanded] = React.useState<MegaPanelId | null>(null);
  const openTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = React.useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  }, []);

  const scheduleOpen = React.useCallback(
    (id: MegaPanelId) => {
      clearTimers();
      openTimer.current = setTimeout(() => setPanel(id), OPEN_MS);
    },
    [clearTimers],
  );

  const scheduleClose = React.useCallback(() => {
    clearTimers();
    closeTimer.current = setTimeout(() => setPanel(null), CLOSE_MS);
  }, [clearTimers]);

  const closeNow = React.useCallback(() => {
    clearTimers();
    setPanel(null);
  }, [clearTimers]);

  React.useEffect(() => () => clearTimers(), [clearTimers]);

  React.useEffect(() => {
    if (!getCustomerToken()) {
      setCartCount(0);
      return;
    }
    void apiFetch<{ items: unknown[] }>("/cart")
      .then((res) => setCartCount(res.data.items?.length ?? 0))
      .catch(() => undefined);
  }, [pathname, cartOpen]);

  const labelFor = (id: MegaPanelId, fallback: string) => {
    if (id === "men" || id === "women" || id === "kids") {
      return findCategory(categories, id)?.name ?? fallback;
    }
    if (id === "sale") return t.navSale ?? fallback;
    return fallback;
  };

  const hasOther =
    Boolean(findCategory(categories, "sarees")) ||
    Boolean(findCategory(categories, "wedding")) ||
    Boolean(findCategory(categories, "festival"));
  const navItems = NAV.filter((item) => item.id !== "other" || hasOther);

  return (
    <>
      {announcement?.message ? (
        <AnnouncementBar message={announcement.message} href={announcement.href} />
      ) : null}
      <header className="sticky top-0 z-header border-b border-border/60 bg-elevated/90 shadow-[0_1px_0_rgb(20_17_15/0.04)] backdrop-blur-xl">
        <div
          className="relative mx-auto flex h-header max-w-6xl items-center justify-between gap-3 px-4 sm:px-6"
          onMouseLeave={scheduleClose}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-md p-2 text-ink lg:hidden"
              aria-label="Open menu"
              aria-expanded={mobileNav}
              onClick={() => setMobileNav((v) => !v)}
            >
              <IconMenu className="h-5 w-5" />
            </button>
            <Link href="/" className="flex items-center" aria-label={t.brand}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt={t.brand}
                className="h-9 w-auto sm:h-10"
                width={160}
                height={40}
              />
            </Link>
          </div>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {navItems.map((item) => {
              const label = labelFor(item.id, item.fallback);
              const active =
                pathname === item.href ||
                pathname.startsWith(`/${item.id}`) ||
                (item.id === "new" && pathname.startsWith("/products"));
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`rounded-md px-3 py-2 text-sm ${
                    active || panel === item.id ? "text-wine" : "text-muted hover:text-ink"
                  }`}
                  aria-expanded={panel === item.id}
                  aria-haspopup="true"
                  onMouseEnter={() => scheduleOpen(item.id)}
                  onFocus={() => scheduleOpen(item.id)}
                  onClick={() => {
                    closeNow();
                    router.push(item.href);
                  }}
                >
                  {label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              className="rounded-md p-2 text-muted hover:text-ink"
              aria-label={t.search}
              onClick={() => setSearchOpen(true)}
            >
              <IconSearch className="h-5 w-5" />
            </button>
            <Link
              href="/wishlist"
              className="hidden rounded-md p-2 text-muted hover:text-ink sm:inline-flex"
              aria-label={t.navWishlist}
            >
              <IconHeart className="h-5 w-5" />
            </Link>
            <Link href="/account" className="rounded-md px-2 py-2 text-sm text-muted hover:text-ink">
              {t.navAccount}
            </Link>
            <button
              type="button"
              className="relative rounded-md p-2 text-muted hover:text-ink"
              aria-label={t.navCart}
              onClick={() => setCartOpen(true)}
            >
              <IconBag className="h-5 w-5" />
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

          <div onMouseEnter={() => panel && scheduleOpen(panel)}>
            <MegaMenu
              panel={panel}
              categories={categories}
              collections={collections}
              onClose={closeNow}
            />
          </div>
        </div>

        {mobileNav ? (
          <nav className="border-t border-border px-4 py-4 lg:hidden" aria-label="Mobile">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const label = labelFor(item.id, item.fallback);
                const expanded = mobileExpanded === item.id;
                const cat =
                  item.id === "men" || item.id === "women" || item.id === "kids"
                    ? findCategory(categories, item.id)
                    : null;
                const otherRoots =
                  item.id === "other"
                    ? (["sarees", "wedding", "festival"] as const)
                        .map((slug) => findCategory(categories, slug))
                        .filter(Boolean)
                    : [];
                return (
                  <li key={item.id}>
                    <div className="flex items-center gap-2">
                      <Link
                        href={item.href}
                        className="flex-1 py-2 text-sm font-medium"
                        onClick={() => setMobileNav(false)}
                      >
                        {label}
                      </Link>
                      <button
                        type="button"
                        className="rounded-md px-2 py-1 text-xs text-muted"
                        aria-expanded={expanded}
                        onClick={() => setMobileExpanded(expanded ? null : item.id)}
                      >
                        {expanded ? "−" : "+"}
                      </button>
                    </div>
                    {expanded ? (
                      <ul className="mb-2 space-y-1 border-l border-border pl-3">
                        {item.id === "collections"
                          ? collections.slice(0, 12).map((c) => (
                              <li key={c.id}>
                                <Link
                                  href={`/collections/${c.slug}`}
                                  className="block py-1.5 text-sm text-muted"
                                  onClick={() => setMobileNav(false)}
                                >
                                  {c.name}
                                </Link>
                              </li>
                            ))
                          : null}
                        {cat?.children
                          ?.filter((child) => child.slug.startsWith(`${item.id}-`))
                          .map((child) => (
                          <li key={child.id}>
                            <Link
                              href={`/${item.id}/${
                                child.slug.startsWith(`${item.id}-`)
                                  ? child.slug.slice(item.id.length + 1)
                                  : child.slug
                              }`}
                              className="block py-1.5 text-sm text-muted"
                              onClick={() => setMobileNav(false)}
                            >
                              {child.name}
                            </Link>
                          </li>
                        ))}
                        {otherRoots.map((root) =>
                          root ? (
                            <li key={root.id}>
                              <Link
                                href={`/categories/${root.slug}`}
                                className="block py-1.5 text-sm font-medium text-muted"
                                onClick={() => setMobileNav(false)}
                              >
                                {root.name}
                              </Link>
                              <ul className="pl-2">
                                {(root.children ?? []).map((child) => (
                                  <li key={child.id}>
                                    <Link
                                      href={`/categories/${child.slug}`}
                                      className="block py-1 text-sm text-muted"
                                      onClick={() => setMobileNav(false)}
                                    >
                                      {child.name}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </li>
                          ) : null,
                        )}
                        {item.id === "new" ? (
                          <>
                            <li>
                              <Link
                                href="/products?isNew=true"
                                className="block py-1.5 text-sm text-muted"
                                onClick={() => setMobileNav(false)}
                              >
                                New arrivals
                              </Link>
                            </li>
                            <li>
                              <Link
                                href="/products?isFeatured=true"
                                className="block py-1.5 text-sm text-muted"
                                onClick={() => setMobileNav(false)}
                              >
                                Featured
                              </Link>
                            </li>
                          </>
                        ) : null}
                        {item.id === "sale" ? (
                          <li>
                            <Link
                              href="/sale"
                              className="block py-1.5 text-sm text-muted"
                              onClick={() => setMobileNav(false)}
                            >
                              All sale
                            </Link>
                          </li>
                        ) : null}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
              <li>
                <Link
                  href="/wishlist"
                  className="block py-2 text-sm"
                  onClick={() => setMobileNav(false)}
                >
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
