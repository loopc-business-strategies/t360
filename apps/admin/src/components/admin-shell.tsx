"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@t360/ui";
import { apiFetch, clearAdminSession, getAdminToken } from "../lib/api";

type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
  anyOf?: string[];
};

type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ href: "/", label: "Dashboard", exact: true, anyOf: ["dashboard.view", "reports.read"] }],
  },
  {
    label: "Management",
    items: [
      { href: "/products", label: "Products", anyOf: ["products.read"] },
      { href: "/categories", label: "Categories", anyOf: ["categories.manage", "products.read"] },
      { href: "/collections", label: "Collections", anyOf: ["collections.manage", "products.read"] },
      { href: "/reviews", label: "Reviews", anyOf: ["reviews.moderate", "products.read"] },
      { href: "/brands", label: "Brands", anyOf: ["brands.manage", "products.read"] },
      { href: "/inventory", label: "Inventory", anyOf: ["inventory.read"] },
      { href: "/orders", label: "Orders", anyOf: ["orders.read"] },
      { href: "/customers", label: "Customers", anyOf: ["customers.read"] },
      { href: "/staff", label: "Staff", anyOf: ["staff.manage"] },
      { href: "/branches", label: "Branches", anyOf: ["branches.manage"] },
    ],
  },
  {
    label: "AI",
    items: [
      { href: "/ai-fashion", label: "AI Fashion Studio", anyOf: ["ai_fashion.view", "ai.fashion"] },
      { href: "/ai-fashion/models", label: "AI Models", anyOf: ["ai_models.view", "ai.fashion"] },
      { href: "/ai-fashion/images", label: "Generated Images", anyOf: ["ai_fashion.view", "ai.fashion"] },
      { href: "/ai-fashion/try-on", label: "Virtual Try-On", anyOf: ["ai.tryon.read", "ai.fashion"] },
      { href: "/ai-fashion/settings", label: "AI Settings", anyOf: ["ai_settings.view", "settings.manage"] },
      { href: "/ai-fashion/settings#usage", label: "AI Usage", anyOf: ["ai_settings.view", "ai_fashion.view", "ai.fashion"] },
      { href: "/ai", label: "AI Chat", anyOf: ["ai.admin"] },
    ],
  },
  {
    label: "Marketing",
    items: [
      { href: "/campaigns", label: "Campaigns", anyOf: ["offers.manage", "cms.manage"] },
      { href: "/coupons", label: "Coupons", anyOf: ["coupons.manage"] },
      { href: "/loyalty", label: "Loyalty", anyOf: ["loyalty.manage"] },
      { href: "/segments", label: "Segments", anyOf: ["offers.manage"] },
      { href: "/abandoned-cart", label: "Abandoned cart", anyOf: ["offers.manage"] },
      { href: "/social", label: "Social", anyOf: ["cms.manage"] },
      { href: "/marketing", label: "Marketing", anyOf: ["offers.manage"] },
    ],
  },
  {
    label: "Reports",
    items: [{ href: "/reports", label: "Reports", anyOf: ["reports.read"] }],
  },
  {
    label: "Administration",
    items: [
      { href: "/roles", label: "Roles", anyOf: ["roles.manage"] },
      { href: "/audit", label: "Audit Logs", anyOf: ["audit.read"] },
      { href: "/notifications", label: "Notifications", anyOf: ["notifications.manage"] },
      { href: "/search", label: "Search", anyOf: ["settings.manage"] },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/settings", label: "General", anyOf: ["settings.manage"] },
      { href: "/settings/ai", label: "AI", anyOf: ["ai_settings.view", "settings.manage", "ai.fashion"] },
      { href: "/settings/media", label: "Media", anyOf: ["settings.manage"] },
      { href: "/settings/demo", label: "Demo data", anyOf: ["settings.manage"] },
      { href: "/settings/security", label: "Security", anyOf: ["settings.manage"] },
      { href: "/storefront", label: "Storefront", anyOf: ["settings.manage", "cms.manage"] },
      { href: "/integrations", label: "Integrations", anyOf: ["integrations.manage"] },
      { href: "/profile", label: "Profile" },
    ],
  },
];

function canSee(perms: string[], item: NavItem) {
  if (!item.anyOf?.length) return true;
  if (perms.includes("*")) return true;
  return item.anyOf.some((p) => perms.includes(p) || (p.startsWith("ai_") && perms.includes("ai.fashion")));
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = React.useState(pathname === "/login");

  const me = useQuery({
    queryKey: ["admin-me"],
    queryFn: () =>
      apiFetch<{ permissions: string[]; roles: string[]; email?: string; employee?: { name?: string } }>(
        "/users/me",
      ),
    enabled: Boolean(getAdminToken()) && pathname !== "/login",
  });

  const permissions = me.data?.data?.permissions ?? [];

  React.useEffect(() => {
    if (pathname === "/login") {
      setReady(true);
      return;
    }
    if (!getAdminToken()) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [pathname, router]);

  if (pathname === "/login") return <>{children}</>;

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted">
        Redirecting to sign in…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-ink text-elevated md:flex md:flex-col">
        <div className="border-b border-white/10 px-5 py-5">
          <p className="font-display text-xl tracking-[0.14em]">THARAGAI</p>
          <p className="mt-1 text-xs text-elevated/70">Admin Control Center</p>
          <span className="mt-2 block h-0.5 w-10 bg-brass" aria-hidden />
        </div>
        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
          {NAV_GROUPS.map((group) => {
            const items = group.items.filter((i) => canSee(permissions, i));
            if (!items.length) return null;
            return (
              <div key={group.label}>
                <p className="mb-1 px-3 text-[10px] uppercase tracking-wider text-elevated/50">
                  {group.label}
                </p>
                <div className="flex flex-col gap-0.5">
                  {items.map((item) => {
                    const active = item.exact
                      ? pathname === item.href
                      : pathname === item.href ||
                        (item.href !== "/" && pathname.startsWith(item.href + "/"));
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
                </div>
              </div>
            );
          })}
        </nav>
        <div className="space-y-2 p-3">
          <Link href="/profile" className="block truncate px-1 text-xs text-elevated/70">
            {me.data?.data?.employee?.name ?? me.data?.data?.email ?? "Profile"}
          </Link>
          <Button
            variant="outline"
            className="w-full border-elevated/30 text-elevated"
            onClick={() => {
              clearAdminSession();
              router.push("/login");
            }}
          >
            Log out
          </Button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-border/80 bg-elevated/80 px-4 py-3 backdrop-blur-md sm:px-6">
          <p className="text-sm text-muted">Admin Control Center</p>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
