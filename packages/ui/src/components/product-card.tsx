import * as React from "react";
import { cn } from "../lib/cn";
import { Button } from "./button";
import { Price } from "./price";

export interface ProductCardProps {
  name: string;
  brand?: string;
  imageUrl: string;
  imageAlt: string;
  price: number;
  compareAt?: number;
  addToCartLabel: string;
  onAddToCart?: () => void;
  className?: string;
}

export function ProductCard({
  name,
  brand,
  imageUrl,
  imageAlt,
  price,
  compareAt,
  addToCartLabel,
  onAddToCart,
  className,
}: ProductCardProps) {
  return (
    <article
      className={cn(
        "group overflow-hidden rounded-lg border border-border bg-elevated shadow-none transition-all duration-300 hover:-translate-y-1 hover:border-brass/40 hover:shadow-soft",
        className,
      )}
    >
      <div className="aspect-[4/5] overflow-hidden bg-linen">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={imageAlt}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-col gap-2 p-4">
        {brand ? <p className="text-xs uppercase tracking-wide text-muted">{brand}</p> : null}
        <h3 className="font-display text-lg text-ink">{name}</h3>
        <Price amount={price} compareAt={compareAt} />
        <Button onClick={onAddToCart} className="mt-1 w-full">
          {addToCartLabel}
        </Button>
      </div>
    </article>
  );
}
