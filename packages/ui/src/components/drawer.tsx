"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "../lib/cn";
import { Button } from "./button";

export interface DrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  triggerLabel?: string;
}

export function Drawer({ open, onOpenChange, title, children, triggerLabel }: DrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {triggerLabel ? (
        <Dialog.Trigger asChild>
          <Button variant="secondary">{triggerLabel}</Button>
        </Dialog.Trigger>
      ) : null}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/45 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex w-[min(92vw,24rem)] flex-col border-l border-border bg-elevated/95 p-6 shadow-soft backdrop-blur-md animate-slide-in-right focus:outline-none",
          )}
        >
          <Dialog.Title className="font-display text-xl text-ink">{title}</Dialog.Title>
          <div className="mt-4 flex-1 overflow-y-auto">{children}</div>
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
