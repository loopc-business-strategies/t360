"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@t360/ui";
import { setAdminToken } from "../lib/api";

const nav = [
  { href: "/", label: "Dashboard", exact: true },
  { href: "/customers", label: "Customers" },
  { href: "/staff", label: "Staff" },
  { href: "/coupons", label: "Coupons" },
  { href: "/loyalty", label: "Loyalty" },
  { href: "/segments", label: "Segments" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/abandoned-cart", label: "Abandoned cart" },
  { href: "/social", label: "Social" },
  { href: "/marketing", label: "Marketing" },
  { href: "/ai", label: "AI" },
  { href: "/integrations", label: "Integrations" },
  { href: "/storefront", label: "Storefront" },
  { href: "/search", label: "Search" },
  { href: "/reports", label: "Reports" },
  { href: "/notifications", label: "Notifications" },
  { href: "/orders", label: "Orders" },
  { href: "/products", label: "Products" },
  { href: "/categories", label: "Categories" },
  { href: "/brands", label: "Brands" },
  { href: "/branches", label: "Branches" },
  { href: "/inventory", label: "Inventory" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login") return <>{children}</>;

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-ink text-elevated md:flex md:flex-col">
        <div className="border-b border-white/10 px-5 py-5">
          <p className="font-display text-xl tracking-[0.14em]">THARAGAI</p>
          <p className="mt-1 text-xs text-elevated/70">Admin</p>
          <span className="mt-2 block h-0.5 w-10 bg-brass" aria-hidden />
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {nav.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative rounded-md px-3 py-2 text-sm transition-colors ${
                  active ? "bg-wine text-elevated" : "text-elevated/80 hover:bg-white/10"
                }`}
              >
                {active ? (
                  <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-brass" />
                ) : null}
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3">
          <Button
            variant="outline"
            className="w-full border-elevated/30 text-elevated"
            onClick={() => {
              setAdminToken(null);
              router.push("/login");
            }}
          >
            Log out
          </Button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-border/80 bg-elevated/80 px-4 py-3 backdrop-blur-md sm:px-6">
          <p className="text-sm text-muted">Admin CRM — live API</p>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
