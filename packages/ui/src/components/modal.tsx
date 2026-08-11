"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "../lib/cn";
import { Button } from "./button";

export interface ModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  triggerLabel?: string;
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  triggerLabel,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {triggerLabel ? (
        <Dialog.Trigger asChild>
          <Button variant="outline">{triggerLabel}</Button>
        </Dialog.Trigger>
      ) : null}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/45 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-elevated/95 p-6 shadow-soft backdrop-blur-md animate-fade-in focus:outline-none",
          )}
        >
          <Dialog.Title className="font-display text-xl text-ink">{title}</Dialog.Title>
          {description ? (
            <Dialog.Description className="mt-2 text-sm text-muted">{description}</Dialog.Description>
          ) : null}
          <div className="mt-4">{children}</div>
          <Dialog.Close asChild>
            <Button variant="ghost" className="absolute right-3 top-3" aria-label="Close">
              ✕
            </Button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
