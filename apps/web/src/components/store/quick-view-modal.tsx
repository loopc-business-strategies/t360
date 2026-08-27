"use client";

import * as React from "react";
import Link from "next/link";
import { Button, Price } from "@t360/ui";
import type { ProductListItem } from "../../lib/catalog-api";
import { productPrice } from "../../lib/catalog-api";
import { OptimizedImage } from "./optimized-image";

export function QuickViewModal({
  product,
  open,
  onClose,
  addLabel,
  tryMeLabel,
}: {
  product: ProductListItem | null;
  open: boolean;
  onClose: () => void;
  addLabel: string;
  tryMeLabel: string;
}) {
  const closeRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !product) return null;

  const price = productPrice(product);
  const images = Array.from(
    new Map(
      (product.images ?? [])
        .filter((i) => i.url)
        .map((i) => [i.url, i]),
    ).values(),
  );
  const image =
    images[0]?.url ??
    "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80";

  return (
    <>
      <div className="fixed inset-0 z-overlay bg-ink/40" aria-hidden onClick={onClose} />
      <div
        role="dialog"
        aria-modal
        aria-label={product.name}
        className="fixed inset-x-4 top-[10%] z-overlay mx-auto max-w-3xl rounded-lg border border-border bg-elevated shadow-soft sm:inset-x-auto"
      >
        <div className="grid gap-0 sm:grid-cols-2">
          <div className="relative aspect-square w-full overflow-hidden sm:rounded-l-lg">
            <OptimizedImage
              src={image}
              alt={product.name}
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 50vw"
            />
          </div>
          <div className="p-6">
            <button
              ref={closeRef}
              type="button"
              className="float-right text-muted"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
            <p className="text-xs uppercase tracking-wide text-muted">{product.brand?.name}</p>
            <h2 className="mt-2 font-display text-2xl">{product.name}</h2>
            <div className="mt-3">
              <Price amount={price.amount} compareAt={price.compareAt} />
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href={`/products/${product.slug}`}>
                <Button>{addLabel}</Button>
              </Link>
              {product.tryOnEnabled ? (
                <Link href={`/products/${product.slug}?tryOn=1#try-me`}>
                  <Button variant="secondary">{tryMeLabel}</Button>
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
