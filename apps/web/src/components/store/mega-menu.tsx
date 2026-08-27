"use client";

import * as React from "react";
import Link from "next/link";
import type { CategoryNode, CollectionItem } from "../../lib/catalog-api";

const COLUMN_DEFS = [
  { key: "men", slug: "men", label: "Men" },
  { key: "women", slug: "women", label: "Women" },
  { key: "kids", slug: "kids", label: "Kids" },
] as const;

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

export function MegaMenu({
  categories,
  collections = [],
  open,
  onClose,
  saleLabel = "Sale",
}: {
  categories: CategoryNode[];
  collections?: CollectionItem[];
  open: boolean;
  onClose: () => void;
  saleLabel?: string;
}) {
  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-overlay bg-ink/20" aria-hidden onClick={onClose} />
      <div
        role="navigation"
        aria-label="Shop categories"
        className="absolute left-0 right-0 top-full z-overlay border-b border-border bg-elevated shadow-soft"
      >
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 sm:grid-cols-2 lg:grid-cols-5">
          {COLUMN_DEFS.map((col) => {
            const cat = findCategory(categories, col.slug);
            return (
              <div key={col.key}>
                <Link
                  href={cat ? `/categories/${cat.slug}` : `/products?category=${col.slug}`}
                  className="font-display text-lg text-ink hover:text-wine"
                  onClick={onClose}
                >
                  {cat?.name ?? col.label}
                </Link>
                {cat?.children?.length ? (
                  <ul className="mt-3 space-y-2">
                    {cat.children.map((child) => (
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
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-muted">Shop {col.label.toLowerCase()} styles.</p>
                )}
              </div>
            );
          })}
          <div>
            <p className="font-display text-lg text-ink">Collections</p>
            <ul className="mt-3 space-y-2">
              {collections.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/products?collection=${c.slug}`}
                    className="text-sm text-muted hover:text-wine"
                    onClick={onClose}
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
              {!collections.length ? (
                <li>
                  <Link href="/products" className="text-sm text-muted hover:text-wine" onClick={onClose}>
                    View all products
                  </Link>
                </li>
              ) : null}
            </ul>
          </div>
          <div>
            <Link
              href="/products?sort=price_desc"
              className="font-display text-lg text-wine hover:underline"
              onClick={onClose}
            >
              {saleLabel}
            </Link>
            <p className="mt-3 text-sm text-muted">Curated offers and last-chance styles.</p>
          </div>
        </div>
      </div>
    </>
  );
}
