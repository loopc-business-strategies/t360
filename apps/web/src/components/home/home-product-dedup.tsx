"use client";

import * as React from "react";
import type { ProductListItem } from "../../lib/catalog-api";

/** Keep in sync with apps/api/src/demo-data/engine/constants.ts */
export const BANNED_SAREE_IMAGE_IDS = [
  "photo-1594938298603-c8148c4dae35",
  "photo-1583391733956-3750e0ff4e8b",
  "photo-1610030469983-98e550d6193c",
  "photo-1694406175780-38470288c925",
] as const;

export function isBannedSareeUrl(url: string | undefined): boolean {
  if (!url) return false;
  return BANNED_SAREE_IMAGE_IDS.some((id) => url.includes(id));
}

export function productPrimaryImageUrl(p: ProductListItem): string | undefined {
  return p.images?.find((img) => img.mediaType !== "video")?.url ?? p.images?.[0]?.url;
}

export function filterBannedProducts(products: ProductListItem[]): ProductListItem[] {
  return products.filter((p) => !isBannedSareeUrl(productPrimaryImageUrl(p)));
}

type DedupContext = {
  claimProducts: (products: ProductListItem[]) => ProductListItem[];
};

const HomeProductDedupContext = React.createContext<DedupContext | null>(null);

export function HomeProductDedupProvider({ children }: { children: React.ReactNode }) {
  const seenIds = React.useRef(new Set<string>());
  const seenUrls = React.useRef(new Set<string>());

  const claimProducts = React.useCallback((products: ProductListItem[]) => {
    const out: ProductListItem[] = [];
    for (const p of filterBannedProducts(products)) {
      const url = productPrimaryImageUrl(p);
      if (seenIds.current.has(p.id)) continue;
      if (url && seenUrls.current.has(url)) continue;
      seenIds.current.add(p.id);
      if (url) seenUrls.current.add(url);
      out.push(p);
    }
    return out;
  }, []);

  return (
    <HomeProductDedupContext.Provider value={{ claimProducts }}>
      {children}
    </HomeProductDedupContext.Provider>
  );
}

export function useHomeProductDedup(): DedupContext {
  const ctx = React.useContext(HomeProductDedupContext);
  if (!ctx) {
    return { claimProducts: (products) => filterBannedProducts(products) };
  }
  return ctx;
}
