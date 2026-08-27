import * as React from "react";
import { cn } from "../lib/cn";

export type TryOnJobStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | string;

const STEPS: Array<{ key: TryOnJobStatus; label: string }> = [
  { key: "QUEUED", label: "Queued" },
  { key: "PROCESSING", label: "Generating" },
  { key: "COMPLETED", label: "Ready" },
];

function stepIndex(status: TryOnJobStatus): number {
  if (status === "COMPLETED") return 2;
  if (status === "PROCESSING") return 1;
  if (status === "FAILED") return -1;
  return 0;
}

export interface FashionProgressProps {
  status: TryOnJobStatus;
  labels?: Partial<Record<TryOnJobStatus, string>>;
  className?: string;
}

export function FashionProgress({ status, labels, className }: FashionProgressProps) {
  const active = stepIndex(status);
  const failed = status === "FAILED";

  return (
    <div className={cn("space-y-3", className)} role="status" aria-live="polite">
      <div className="flex gap-2">
        {STEPS.map((step, i) => {
          const done = !failed && active >= i;
          const current = !failed && active === i;
          return (
            <div key={step.key} className="flex-1">
              <div
                className={cn(
                  "h-1 rounded-full transition-colors",
                  failed ? "bg-danger/30" : done ? "bg-wine" : "bg-border",
                  current && !failed && "animate-pulse",
                )}
              />
              <p
                className={cn(
                  "mt-2 text-xs",
                  current ? "font-medium text-wine" : "text-muted",
                )}
              >
                {labels?.[step.key] ?? step.label}
              </p>
            </div>
          );
        })}
      </div>
      {failed ? <p className="text-sm text-danger">Generation failed. Please try again.</p> : null}
    </div>
  );
}
