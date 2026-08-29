"use client";

import * as React from "react";
import Link from "next/link";
import { useLocale } from "../lib/locale";
import { API_URL } from "../lib/catalog-api";
import type { Branch, CategoryNode, CollectionItem } from "../lib/catalog-api";
import { StoreHeader } from "./store/store-header";
import { BrandLogo } from "./brand-logo";
import { MobileBottomNav } from "./store/mobile-bottom-nav";
import { SocialFabs } from "./store/social-fabs";
import { getInstagramUrl, getWhatsAppE164 } from "../lib/social";

export function SiteHeader() {
  const [categories, setCategories] = React.useState<CategoryNode[]>([]);
  const [collections, setCollections] = React.useState<CollectionItem[]>([]);
  const [announcement, setAnnouncement] = React.useState<{ message: string; href?: string } | null>(
    null,
  );
  const [searchOpen, setSearchOpen] = React.useState(false);

  React.useEffect(() => {
    void fetch(`${API_URL}/categories`)
      .then((r) => r.json())
      .then((json) => setCategories(json.data ?? []))
      .catch(() => undefined);
    void fetch(`${API_URL}/collections`)
      .then((r) => r.json())
      .then((json) => setCollections(json.data ?? []))
      .catch(() => undefined);
    void fetch(`${API_URL}/settings/storefront`)
      .then((r) => r.json())
      .then((json) => {
        const sections = json.data?.sections as Array<{
          type: string;
          visible?: boolean;
          message?: string;
          href?: string;
        }> | undefined;
        const ann = sections?.find((s) => s.type === "announcement" && s.visible !== false);
        if (ann?.message) setAnnouncement({ message: ann.message, href: ann.href });
      })
      .catch(() => undefined);
  }, []);

  return (
    <>
      <StoreHeader
        categories={categories}
        collections={collections}
        announcement={announcement}
        searchOpen={searchOpen}
        onSearchOpenChange={setSearchOpen}
      />
      <MobileBottomNav onSearchOpen={() => setSearchOpen(true)} />
      <SocialFabs />
    </>
  );
}

export function SiteFooter() {
  const { t } = useLocale();
  const [business, setBusiness] = React.useState<{ phone?: string; email?: string }>({});

  React.useEffect(() => {
    void fetch(`${API_URL}/settings/storefront`)
      .then((r) => r.json())
      .then((json) => {
        /* business fields come from general settings in future; use env fallbacks */
      })
      .catch(() => undefined);
  }, []);

  const waNumber = getWhatsAppE164();
  const igUrl = getInstagramUrl();

  return (
    <footer className="mt-auto border-t border-border bg-ink text-elevated">
      <div className="mx-auto grid max-w-content gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <BrandLogo variant="footer" alt={t.brand} />
          <p className="mt-3 text-sm text-elevated/70">{t.footerTagline}</p>
          <p className="mt-2 text-xs text-elevated/50">© 2026 THARAGAI Readymades</p>
          {(waNumber || igUrl) && (
            <div className="mt-4 flex gap-3">
              {waNumber ? (
                <a
                  href={`https://wa.me/${waNumber}`}
                  className="text-sm text-brass hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp
                </a>
              ) : null}
              {igUrl ? (
                <a
                  href={igUrl}
                  className="text-sm text-brass hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Instagram
                </a>
              ) : null}
            </div>
          )}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-brass">Shop</p>
          <nav className="mt-4 flex flex-col gap-2 text-sm">
            <Link href="/women" className="hover:text-brass">Women</Link>
            <Link href="/men" className="hover:text-brass">Men</Link>
            <Link href="/kids" className="hover:text-brass">Kids</Link>
            <Link href="/products?isNew=true" className="hover:text-brass">New Arrivals</Link>
            <Link href="/collections/festive-edit" className="hover:text-brass">Collections</Link>
            <Link href="/sale" className="hover:text-brass">Sale</Link>
          </nav>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-brass">Customer Care</p>
          <nav className="mt-4 flex flex-col gap-2 text-sm">
            <Link href="/account" className="hover:text-brass">Contact</Link>
            <Link href="/policies/shipping" className="hover:text-brass">{t.navShippingPolicy}</Link>
            <Link href="/policies/returns" className="hover:text-brass">{t.navReturns}</Link>
            <Link href="/policies/refunds" className="hover:text-brass">{t.navRefunds}</Link>
            <Link href="/orders" className="hover:text-brass">Track Order</Link>
            <Link href="/policies/terms" className="hover:text-brass">{t.navTerms}</Link>
          </nav>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-brass">Help</p>
          <nav className="mt-4 flex flex-col gap-2 text-sm">
            {waNumber ? (
              <a href={`https://wa.me/${waNumber}`} className="hover:text-brass" target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            ) : null}
            {igUrl ? (
              <a href={igUrl} className="hover:text-brass" target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            ) : null}
            <Link href="/account" className="hover:text-brass">Account</Link>
            <Link href="/policies/privacy" className="hover:text-brass">{t.navPrivacy}</Link>
          </nav>
        </div>
      </div>
      <div className="border-t border-elevated/10 px-6 py-4 text-center text-xs text-elevated/50">
        Pudukkottai, Tamil Nadu · Premium Indian fashion for the whole family
      </div>
    </footer>
  );
}
