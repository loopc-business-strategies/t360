"use client";

import * as React from "react";
import { cn } from "../lib/cn";
import { Button } from "./button";
import { Price } from "./price";
import { TryMeButton } from "./try-me-button";

export interface ProductCardProps {
  name: string;
  brand?: string;
  imageUrl: string;
  imageAlt: string;
  secondImageUrl?: string;
  price: number;
  compareAt?: number;
  addToCartLabel: string;
  quickAddLabel?: string;
  onAddToCart?: () => void;
  onQuickAdd?: () => void;
  tryOnEnabled?: boolean;
  tryMeLabel?: string;
  onTryMe?: () => void;
  wishlisted?: boolean;
  wishlistLabel?: string;
  onWishlistToggle?: () => void;
  saleBadgeLabel?: string;
  colorCount?: number;
  showActions?: boolean;
  className?: string;
}

export function ProductCard({
  name,
  brand,
  imageUrl,
  imageAlt,
  secondImageUrl,
  price,
  compareAt,
  addToCartLabel,
  quickAddLabel = "Quick add",
  onAddToCart,
  onQuickAdd,
  tryOnEnabled,
  tryMeLabel,
  onTryMe,
  wishlisted,
  wishlistLabel = "Save",
  onWishlistToggle,
  saleBadgeLabel = "Sale",
  colorCount,
  showActions = true,
  className,
}: ProductCardProps) {
  const onSale = compareAt != null && compareAt > price;
  const salePct =
    onSale && compareAt
      ? Math.max(1, Math.round(((compareAt - price) / compareAt) * 100))
      : null;

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-lg border border-border bg-elevated shadow-none transition-all duration-300 hover:-translate-y-1 hover:border-brass/40 hover:shadow-soft",
        className,
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-linen">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={imageAlt}
          loading="lazy"
          decoding="async"
          className={cn(
            "h-full w-full object-cover transition duration-500 ease-out",
            secondImageUrl && secondImageUrl !== imageUrl
              ? "group-hover:opacity-0"
              : "group-hover:scale-[1.06]",
          )}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "data:image/svg+xml," +
              encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect fill="#F3EEE6" width="100%" height="100%"/></svg>`,
              );
          }}
        />
        {secondImageUrl && secondImageUrl !== imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={secondImageUrl}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-500 ease-out group-hover:scale-[1.06] group-hover:opacity-100"
          />
        ) : null}
        {onSale ? (
          <span className="absolute left-3 top-3 rounded-sm bg-wine px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-elevated">
            {salePct != null ? `${salePct}% off` : saleBadgeLabel}
          </span>
        ) : null}
        {tryOnEnabled ? (
          <div className="absolute bottom-3 left-3 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
            <TryMeButton
              label={tryMeLabel}
              compact
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onTryMe?.();
              }}
            />
          </div>
        ) : null}
        {showActions && onWishlistToggle ? (
          <button
            type="button"
            aria-label={wishlistLabel}
            aria-pressed={wishlisted}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-elevated/90 text-lg shadow-sm backdrop-blur-sm transition hover:bg-elevated"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onWishlistToggle();
            }}
          >
            {wishlisted ? "♥" : "♡"}
          </button>
        ) : null}
        {showActions && onQuickAdd ? (
          <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100 max-sm:hidden">
            <Button
              type="button"
              variant="secondary"
              className="w-full bg-elevated/95 backdrop-blur-sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickAdd();
              }}
            >
              {quickAddLabel}
            </Button>
          </div>
        ) : null}
      </div>
      <div className="flex flex-col gap-1.5 p-4">
        {brand ? <p className="text-xs uppercase tracking-wide text-muted">{brand}</p> : null}
        <h3 className="font-display text-lg leading-snug text-ink">{name}</h3>
        <Price amount={price} compareAt={compareAt} />
        {colorCount != null && colorCount > 1 ? (
          <p className="text-xs text-muted">{colorCount} colours</p>
        ) : null}
        {onAddToCart && !onQuickAdd ? (
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToCart();
            }}
            className="mt-1 w-full sm:hidden"
          >
            {addToCartLabel}
          </Button>
        ) : null}
      </div>
    </article>
  );
}

/** Alias for premium storefront usage */
export const ProductCardPremium = ProductCard;
