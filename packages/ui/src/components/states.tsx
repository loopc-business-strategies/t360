import * as React from "react";
import { cn } from "../lib/cn";
import { Button } from "./button";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  className,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-elevated/60 px-6 py-12 text-center",
        className,
      )}
    >
      <h3 className="font-display text-xl text-ink">{title}</h3>
      {description ? <p className="max-w-md text-sm text-muted">{description}</p> : null}
      {actionLabel ? (
        <Button className="mt-3" variant="outline" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function LoadingState({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-4 py-12 text-muted", className)}
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-xs space-y-2 px-4">
        <div className="h-3 animate-pulse rounded-md bg-gradient-to-r from-border via-brass/30 to-border bg-[length:200%_100%]" />
        <div className="h-3 w-4/5 animate-pulse rounded-md bg-gradient-to-r from-border via-brass/20 to-border bg-[length:200%_100%]" />
        <div className="h-3 w-3/5 animate-pulse rounded-md bg-gradient-to-r from-border via-brass/25 to-border bg-[length:200%_100%]" />
      </div>
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ErrorState({
  title,
  description,
  retryLabel,
  onRetry,
  className,
}: {
  title: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-danger/30 bg-danger/5 px-6 py-12 text-center",
        className,
      )}
      role="alert"
    >
      <h3 className="font-display text-xl text-danger">{title}</h3>
      {description ? <p className="max-w-md text-sm text-muted">{description}</p> : null}
      {retryLabel ? (
        <Button className="mt-3" variant="outline" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
