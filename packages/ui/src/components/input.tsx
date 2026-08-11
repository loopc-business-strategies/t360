import * as React from "react";
import { cn } from "../lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <label className="flex w-full flex-col gap-1.5 font-sans text-sm text-ink">
        {label ? <span className="font-medium">{label}</span> : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-11 rounded-md border border-border bg-elevated px-3 text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine",
            error && "border-danger focus-visible:ring-danger",
            className,
          )}
          aria-invalid={Boolean(error) || undefined}
          {...props}
        />
        {error ? <span className="text-xs text-danger">{error}</span> : null}
      </label>
    );
  },
);
Input.displayName = "Input";
