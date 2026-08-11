import * as React from "react";
import { cn } from "../lib/cn";

export interface PriceProps {
  amount: number;
  currency?: string;
  compareAt?: number;
  locale?: string;
  className?: string;
}

export function formatMoney(amount: number, currency = "INR", locale = "en-IN") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function Price({
  amount,
  currency = "INR",
  compareAt,
  locale = "en-IN",
  className,
}: PriceProps) {
  return (
    <div className={cn("flex items-baseline gap-2 font-sans", className)}>
      <span className="text-lg font-semibold text-ink">{formatMoney(amount, currency, locale)}</span>
      {compareAt && compareAt > amount ? (
        <span className="text-sm text-muted line-through">
          {formatMoney(compareAt, currency, locale)}
        </span>
      ) : null}
    </div>
  );
}
