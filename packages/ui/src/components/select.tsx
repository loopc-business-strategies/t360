"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cn } from "../lib/cn";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function Select({
  label,
  placeholder = "Select",
  options,
  value,
  onValueChange,
  className,
}: SelectProps) {
  return (
    <label className={cn("flex w-full flex-col gap-1.5 font-sans text-sm text-ink", className)}>
      {label ? <span className="font-medium">{label}</span> : null}
      <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
        <SelectPrimitive.Trigger className="flex h-11 items-center justify-between rounded-md border border-border bg-elevated px-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine">
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon className="text-muted">▾</SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content className="z-50 overflow-hidden rounded-md border border-border bg-elevated shadow-soft animate-fade-in">
            <SelectPrimitive.Viewport className="p-1">
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  className="cursor-pointer rounded-sm px-3 py-2 text-sm outline-none data-[highlighted]:bg-linen"
                >
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </label>
  );
}
