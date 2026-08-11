"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { cn } from "../lib/cn";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {children}
      <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[100] flex w-[min(92vw,22rem)] flex-col gap-2 outline-none" />
    </ToastPrimitive.Provider>
  );
}

export function Toast({
  open,
  onOpenChange,
  title,
  description,
  tone = "neutral",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  tone?: "neutral" | "success" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "border-success/30"
      : tone === "danger"
        ? "border-danger/30"
        : "border-border";

  return (
    <ToastPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      className={cn(
        "rounded-lg border bg-elevated p-4 shadow-soft animate-fade-in data-[state=closed]:opacity-0",
        toneClass,
      )}
    >
      <ToastPrimitive.Title className="font-medium text-ink">{title}</ToastPrimitive.Title>
      {description ? (
        <ToastPrimitive.Description className="mt-1 text-sm text-muted">
          {description}
        </ToastPrimitive.Description>
      ) : null}
    </ToastPrimitive.Root>
  );
}
