import * as React from "react";
import { cn } from "../lib/cn";

export type BadgeTone = "neutral" | "wine" | "teal" | "brass" | "success" | "danger";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-linen text-muted border-border",
  wine: "bg-wine/10 text-wine border-wine/20",
  teal: "bg-teal/10 text-teal border-teal/20",
  brass: "bg-brass/15 text-ink border-brass/30",
  success: "bg-success/10 text-success border-success/20",
  danger: "bg-danger/10 text-danger border-danger/20",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
