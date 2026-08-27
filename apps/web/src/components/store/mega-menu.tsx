"use client";

import * as React from "react";
import Link from "next/link";
import type { CategoryNode } from "../../lib/catalog-api";

export function MegaMenu({
  categories,
  open,
  onClose,
  saleLabel = "Sale",
}: {
  categories: CategoryNode[];
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
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat) => (
            <div key={cat.id}>
              <Link
                href={`/categories/${cat.slug}`}
                className="font-display text-lg text-ink hover:text-wine"
                onClick={onClose}
              >
                {cat.name}
              </Link>
              {cat.children?.length ? (
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
              ) : null}
            </div>
          ))}
          <div>
            <Link
              href="/products?sale=1"
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
