"use client";

import * as React from "react";
import Link from "next/link";
import type { CategoryNode, CollectionItem } from "../../lib/catalog-api";

export type MegaPanelId = "new" | "men" | "women" | "kids" | "other" | "collections" | "sale";

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

function leafHref(gender: string, child: CategoryNode) {
  const suffix = child.slug.startsWith(`${gender}-`)
    ? child.slug.slice(gender.length + 1)
    : child.slug;
  return `/${gender}/${suffix}`;
}

function FeaturedColumn({ gender, onClose }: { gender: string; onClose: () => void }) {
  const links = [
    { href: `/${gender}?isNew=true`, label: "New arrivals" },
    { href: `/${gender}?isBestseller=true`, label: "Bestsellers" },
    { href: `/${gender}?isTrending=true`, label: "Trending" },
    { href: `/${gender}?tryOnEnabled=true`, label: "TRY ME" },
  ];
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-muted">Featured</p>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-ink hover:text-wine" onClick={onClose}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GenderPanel({
  gender,
  label,
  categories,
  onClose,
}: {
  gender: "men" | "women" | "kids";
  label: string;
  categories: CategoryNode[];
  onClose: () => void;
}) {
  const cat = findCategory(categories, gender);
  const children = (cat?.children ?? []).filter(
    (child) => child.slug.startsWith(`${gender}-`),
  );
  const mid = Math.ceil(children.length / 2);
  const colA = children.slice(0, mid);
  const colB = children.slice(mid);

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
      <FeaturedColumn gender={gender} onClose={onClose} />
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted">Clothing</p>
        <ul className="mt-3 space-y-2">
          {colA.map((child) => (
            <li key={child.id}>
              <Link
                href={leafHref(gender, child)}
                className="text-sm text-muted hover:text-wine"
                onClick={onClose}
              >
                {child.name}
              </Link>
            </li>
          ))}
          {!colA.length ? (
            <li>
              <Link href={`/${gender}`} className="text-sm text-muted hover:text-wine" onClick={onClose}>
                Shop all {label}
              </Link>
            </li>
          ) : null}
        </ul>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted">More styles</p>
        <ul className="mt-3 space-y-2">
          {colB.map((child) => (
            <li key={child.id}>
              <Link
                href={leafHref(gender, child)}
                className="text-sm text-muted hover:text-wine"
                onClick={onClose}
              >
                {child.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-md bg-linen/80 p-5">
        <p className="font-display text-lg text-ink">Shop {label}</p>
        <p className="mt-2 text-sm text-muted">Explore the full {label.toLowerCase()} edit.</p>
        <Link
          href={`/${gender}`}
          className="mt-4 inline-block text-sm font-medium text-wine hover:underline"
          onClick={onClose}
        >
          View all →
        </Link>
      </div>
    </div>
  );
}

export function MegaMenu({
  panel,
  categories,
  collections = [],
  onClose,
}: {
  panel: MegaPanelId | null;
  categories: CategoryNode[];
  collections?: CollectionItem[];
  onClose: () => void;
}) {
  React.useEffect(() => {
    if (!panel) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel, onClose]);

  if (!panel) return null;

  return (
    <div
      role="navigation"
      aria-label="Shop menu"
      className="absolute left-0 right-0 top-full z-overlay border-b border-border bg-elevated shadow-soft"
      onMouseEnter={(e) => e.stopPropagation()}
    >
      {/* Invisible bridge so pointer can move from nav to panel */}
      <div className="pointer-events-none absolute -top-2 left-0 right-0 h-2" aria-hidden />
      {panel === "new" ? (
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted">New & featured</p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/products?isNew=true" className="text-sm hover:text-wine" onClick={onClose}>
                  New arrivals
                </Link>
              </li>
              <li>
                <Link
                  href="/products?isFeatured=true"
                  className="text-sm hover:text-wine"
                  onClick={onClose}
                >
                  Featured
                </Link>
              </li>
              <li>
                <Link
                  href="/products?isTrending=true"
                  className="text-sm hover:text-wine"
                  onClick={onClose}
                >
                  Trending now
                </Link>
              </li>
              <li>
                <Link
                  href="/products?isBestseller=true"
                  className="text-sm hover:text-wine"
                  onClick={onClose}
                >
                  Bestsellers
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted">Shop by</p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/men?isNew=true" className="text-sm hover:text-wine" onClick={onClose}>
                  Men&apos;s new
                </Link>
              </li>
              <li>
                <Link href="/women?isNew=true" className="text-sm hover:text-wine" onClick={onClose}>
                  Women&apos;s new
                </Link>
              </li>
              <li>
                <Link href="/kids?isNew=true" className="text-sm hover:text-wine" onClick={onClose}>
                  Kids&apos; new
                </Link>
              </li>
            </ul>
          </div>
          <div className="rounded-md bg-linen/80 p-5">
            <p className="font-display text-lg">Just landed</p>
            <p className="mt-2 text-sm text-muted">Fresh drops across Men, Women, and Kids.</p>
            <Link
              href="/products?isNew=true"
              className="mt-4 inline-block text-sm font-medium text-wine hover:underline"
              onClick={onClose}
            >
              Shop new →
            </Link>
          </div>
        </div>
      ) : null}

      {panel === "men" ? (
        <GenderPanel gender="men" label="Men" categories={categories} onClose={onClose} />
      ) : null}
      {panel === "women" ? (
        <GenderPanel gender="women" label="Women" categories={categories} onClose={onClose} />
      ) : null}
      {panel === "kids" ? (
        <GenderPanel gender="kids" label="Kids" categories={categories} onClose={onClose} />
      ) : null}

      {panel === "other" ? (
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {(["sarees", "wedding", "festival"] as const).map((slug) => {
            const cat = findCategory(categories, slug);
            if (!cat) return null;
            return (
              <div key={slug}>
                <Link
                  href={`/categories/${cat.slug}`}
                  className="text-xs font-medium uppercase tracking-wider text-ink hover:text-wine"
                  onClick={onClose}
                >
                  {cat.name}
                </Link>
                <ul className="mt-3 space-y-2">
                  {(cat.children ?? []).map((child) => (
                    <li key={child.id}>
                      <Link
                        href={`/categories/${child.slug}`}
                        className="text-sm text-muted hover:text-wine"
                        onClick={onClose}
                      >
                        {child.name}
                      </Link>
                    </li>
                  ))}
                  {!cat.children?.length ? (
                    <li>
                      <Link
                        href={`/categories/${cat.slug}`}
                        className="text-sm text-muted hover:text-wine"
                        onClick={onClose}
                      >
                        Shop all
                      </Link>
                    </li>
                  ) : null}
                </ul>
              </div>
            );
          })}
          <div className="rounded-md bg-linen/80 p-5">
            <p className="font-display text-lg text-ink">Ethnic &amp; occasion</p>
            <p className="mt-2 text-sm text-muted">Sarees, wedding, and festival edits.</p>
            <Link
              href="/categories/sarees"
              className="mt-4 inline-block text-sm font-medium text-wine hover:underline"
              onClick={onClose}
            >
              Shop sarees →
            </Link>
          </div>
        </div>
      ) : null}

      {panel === "collections" ? (
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted">Collections</p>
            <ul className="mt-3 space-y-2">
              {collections.slice(0, 10).map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/collections/${c.slug}`}
                    className="text-sm text-muted hover:text-wine"
                    onClick={onClose}
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
              {!collections.length ? (
                <li>
                  <Link href="/products" className="text-sm hover:text-wine" onClick={onClose}>
                    View all products
                  </Link>
                </li>
              ) : null}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted">Highlights</p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/collections/new-arrivals"
                  className="text-sm hover:text-wine"
                  onClick={onClose}
                >
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link
                  href="/collections/bestsellers"
                  className="text-sm hover:text-wine"
                  onClick={onClose}
                >
                  Bestsellers
                </Link>
              </li>
              <li>
                <Link href="/collections/sale" className="text-sm hover:text-wine" onClick={onClose}>
                  Sale
                </Link>
              </li>
            </ul>
          </div>
          <div className="rounded-md bg-linen/80 p-5">
            <p className="font-display text-lg">Curated edits</p>
            <p className="mt-2 text-sm text-muted">Seasonal looks and everyday essentials.</p>
            <Link
              href="/products"
              className="mt-4 inline-block text-sm font-medium text-wine hover:underline"
              onClick={onClose}
            >
              Browse all →
            </Link>
          </div>
        </div>
      ) : null}

      {panel === "sale" ? (
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted">Sale</p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/sale" className="text-sm hover:text-wine" onClick={onClose}>
                  All sale
                </Link>
              </li>
              <li>
                <Link href="/men?onSale=true" className="text-sm hover:text-wine" onClick={onClose}>
                  Men&apos;s sale
                </Link>
              </li>
              <li>
                <Link href="/women?onSale=true" className="text-sm hover:text-wine" onClick={onClose}>
                  Women&apos;s sale
                </Link>
              </li>
              <li>
                <Link href="/kids?onSale=true" className="text-sm hover:text-wine" onClick={onClose}>
                  Kids&apos; sale
                </Link>
              </li>
            </ul>
          </div>
          <div className="sm:col-span-2 rounded-md bg-linen/80 p-5">
            <p className="font-display text-lg text-wine">Limited-time offers</p>
            <p className="mt-2 text-sm text-muted">Markdowns on selected styles across the catalog.</p>
            <Link
              href="/sale"
              className="mt-4 inline-block text-sm font-medium text-wine hover:underline"
              onClick={onClose}
            >
              Shop sale →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
