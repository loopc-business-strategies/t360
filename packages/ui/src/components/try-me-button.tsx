import * as React from "react";
import { cn } from "../lib/cn";

export interface TryMeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  compact?: boolean;
}

export function TryMeButton({
  label = "TRY ME",
  compact,
  className,
  ...props
}: TryMeButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-wine/30 bg-elevated/95 font-medium uppercase tracking-[0.14em] text-wine shadow-sm backdrop-blur-sm transition hover:border-wine hover:bg-wine hover:text-elevated",
        compact ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-xs",
        className,
      )}
      {...props}
    >
      {label}
    </button>
  );
}
