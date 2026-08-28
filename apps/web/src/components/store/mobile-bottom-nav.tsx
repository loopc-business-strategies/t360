"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@t360/ui";

const ITEMS = [
  { href: "/", label: "Home", icon: IconHome },
  { href: "/women", label: "Categories", icon: IconGrid },
  { href: "/search", label: "Search", icon: IconSearch, action: "search" as const },
  { href: "/wishlist", label: "Wishlist", icon: IconHeart },
  { href: "/account", label: "Account", icon: IconUser },
];

function IconHome(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden {...props}>
      <path d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z" strokeLinejoin="round" />
    </svg>
  );
}

function IconGrid(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden {...props}>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </svg>
  );
}

function IconSearch(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function IconHeart(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden {...props}>
      <path d="M12 20s-7-4.4-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.6-7 10-7 10z" strokeLinejoin="round" />
    </svg>
  );
}

function IconUser(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20c0-4 3-6 7-6s7 2 7 6" strokeLinecap="round" />
    </svg>
  );
}

export function MobileBottomNav({ onSearchOpen }: { onSearchOpen?: () => void }) {
  const pathname = usePathname();
  const hidden =
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/preview") ||
    pathname.startsWith("/policies");

  if (hidden) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[var(--z-bottom-nav)] border-t border-border bg-elevated/95 backdrop-blur-md md:hidden"
      aria-label="Mobile navigation"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;

          if (item.action === "search") {
            return (
              <li key={item.href}>
                <button
                  type="button"
                  onClick={onSearchOpen}
                  className="flex min-h-[3.25rem] min-w-[3.5rem] flex-col items-center justify-center gap-0.5 px-2 text-[10px] uppercase tracking-wide text-muted"
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              </li>
            );
          }

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-[3.25rem] min-w-[3.5rem] flex-col items-center justify-center gap-0.5 px-2 text-[10px] uppercase tracking-wide",
                  active ? "text-wine" : "text-muted",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
