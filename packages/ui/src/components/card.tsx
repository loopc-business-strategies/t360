import * as React from "react";
import { cn } from "../lib/cn";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-elevated p-5 shadow-soft",
        className,
      )}
      {...props}
    />
  );
}
