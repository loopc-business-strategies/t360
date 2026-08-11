"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Button } from "./button";
import { cn } from "../lib/cn";

export interface DropdownItem {
  label: string;
  onSelect?: () => void;
}

export function Dropdown({
  label,
  items,
}: {
  label: string;
  items: DropdownItem[];
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="outline">{label}</Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={cn(
            "z-50 min-w-[10rem] rounded-md border border-border bg-elevated p-1 shadow-soft animate-fade-in",
          )}
          sideOffset={6}
        >
          {items.map((item) => (
            <DropdownMenu.Item
              key={item.label}
              className="cursor-pointer rounded-sm px-3 py-2 text-sm outline-none data-[highlighted]:bg-linen"
              onSelect={item.onSelect}
            >
              {item.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
