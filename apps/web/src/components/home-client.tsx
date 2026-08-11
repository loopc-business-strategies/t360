"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Button, ProductCard } from "@t360/ui";
import { useLocale } from "../lib/locale";
import type { CategoryNode, ProductListItem, StorefrontSettings } from "../lib/catalog-api";
import { productPrice } from "../lib/catalog-api";

const DEFAULT_HERO =
  "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1800&q=80";

function flattenCategories(nodes: CategoryNode[]): CategoryNode[] {
  const out: CategoryNode[] = [];
  for (const n of nodes) {
    out.push(n);
    if (n.children?.length) out.push(...flattenCategories(n.children));
  }
  return out;
}

export function HomeClient({
  products,
  categories,
  storefront,
}: {
  products: ProductListItem[];
  categories: CategoryNode[];
  storefront: StorefrontSettings | null;
}) {
  const reduceMotion = useReducedMotion();
  const { locale, t } = useLocale();
  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const };

  const hero = storefront?.hero;
  const copy = locale === "ta" ? hero?.ta : hero?.en;
  const headline = copy?.headline ?? t.tagline;
  const support = copy?.support ?? t.heroSupport;
  const ctaLabel = copy?.ctaLabel?.trim() || t.ctaShop;
  const imageUrl = hero?.imageUrl ?? DEFAULT_HERO;
  const cats = flattenCategories(categories).slice(0, 8);

  return (
    <main>
      <section className="relative min-h-[85svh] overflow-hidden">
        <div
          className={`absolute inset-0 bg-cover bg-center ${reduceMotion ? "" : "hero-kenburns"}`}
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/60 to-ink/25" />
        <div className="relative z-10 mx-auto flex min-h-[85svh] max-w-6xl flex-col justify-end px-6 pb-16 pt-10 sm:pb-24">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transition}
            className="max-w-xl"
          >
            <p className="font-display text-4xl tracking-[0.14em] text-elevated sm:text-5xl">
              {t.brand}
            </p>
            <span className="mt-3 block h-0.5 w-16 bg-brass" />
            <h1 className="mt-6 font-display text-3xl text-elevated sm:text-4xl">{headline}</h1>
            <p className="mt-4 text-elevated/85">{support}</p>
            <div className="mt-8">
              <Link href="/products">
                <Button className="bg-wine text-elevated hover:bg-wine/90">{ctaLabel}</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {cats.length ? (
        <section className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="font-display text-2xl">{t.shopByCategory}</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {cats.map((c) => (
              <Link
                key={c.id}
                href={`/categories/${c.slug}`}
                className="rounded-md border border-border bg-elevated px-4 py-2 text-sm hover:border-brass/50"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl">{t.newArrivals}</h2>
          <Link href="/products" className="text-sm text-wine hover:underline">
            {t.ctaShop}
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p, i) => {
            const price = productPrice(p);
            const inStock = p.inStock ?? (p.availableQty ?? 0) > 0;
            return (
              <motion.div
                key={p.id}
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: reduceMotion ? 0 : i * 0.05, duration: 0.4 }}
              >
                <Link href={`/products/${p.slug}`} className="block">
                  <ProductCard
                    name={p.name}
                    brand={p.brand?.name}
                    imageUrl={
                      p.images?.[0]?.url ??
                      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80"
                    }
                    imageAlt={p.name}
                    price={price.amount}
                    compareAt={price.compareAt}
                    addToCartLabel={inStock ? t.addToCart : t.outOfStock}
                  />
                  <p className={`mt-2 text-xs ${inStock ? "text-teal" : "text-muted"}`}>
                    {inStock ? t.inStock : t.outOfStock}
                  </p>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
