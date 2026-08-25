"use client";

import Link from "next/link";
import { Card } from "@t360/ui";

const links = [
  { href: "/settings/ai", title: "AI", desc: "AI Fashion enablement, modes, limits" },
  { href: "/settings/media", title: "Media", desc: "Cloudinary configuration status" },
  { href: "/settings/security", title: "Security", desc: "Password, MFA, sessions" },
  { href: "/storefront", title: "Storefront", desc: "Public storefront hero content" },
  { href: "/integrations", title: "Integrations", desc: "External systems" },
  { href: "/notifications", title: "Notifications", desc: "Templates and channels" },
];

export default function SettingsHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Settings</h1>
        <p className="text-sm text-muted">System configuration hub</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((l) => (
          <Link key={l.href} href={l.href}>
            <Card className="h-full transition-colors hover:bg-linen/40">
              <h2 className="font-display text-lg">{l.title}</h2>
              <p className="mt-1 text-sm text-muted">{l.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
