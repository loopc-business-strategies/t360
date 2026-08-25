"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/ai-fashion", label: "Dashboard", exact: true },
  { href: "/ai-fashion/generate", label: "Generate" },
  { href: "/ai-fashion/models", label: "AI Models" },
  { href: "/ai-fashion/images", label: "Generated Images" },
  { href: "/ai-fashion/try-on", label: "Virtual Try-On" },
  { href: "/ai-fashion/settings", label: "Settings" },
];

export function AiFashionNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-2 border-b border-border pb-3">
      {links.map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-md px-3 py-1.5 text-sm ${
              active ? "bg-wine text-elevated" : "text-muted hover:bg-linen"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
