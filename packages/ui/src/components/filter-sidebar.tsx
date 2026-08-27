"use client";

import * as React from "react";
import { cn } from "../lib/cn";
import { Button } from "./button";

export interface FilterSidebarProps {
  title?: string;
  children: React.ReactNode;
  onApply?: () => void;
  onClear?: () => void;
  applyLabel?: string;
  clearLabel?: string;
  loading?: boolean;
  className?: string;
}

export function FilterSidebar({
  title = "Filters",
  children,
  onApply,
  onClear,
  applyLabel = "Apply",
  clearLabel = "Clear",
  loading,
  className,
}: FilterSidebarProps) {
  return (
    <aside
      className={cn(
        "space-y-6 rounded-lg border border-border bg-elevated p-5 lg:sticky lg:top-[calc(var(--header-height)+0.75rem)] lg:max-h-[calc(100vh-var(--header-height)-1.5rem)] lg:overflow-y-auto",
        className,
      )}
    >
      <h2 className="font-display text-lg text-ink">{title}</h2>
      <div className="space-y-4">{children}</div>
      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        {onApply ? (
          <Button type="button" onClick={onApply} disabled={loading} className="flex-1">
            {loading ? "…" : applyLabel}
          </Button>
        ) : null}
        {onClear ? (
          <Button type="button" variant="outline" onClick={onClear} className="flex-1">
            {clearLabel}
          </Button>
        ) : null}
      </div>
    </aside>
  );
}
