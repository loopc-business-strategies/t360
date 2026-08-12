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

function MagneticCta({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });

  return (
    <div
      ref={ref}
      className="inline-block transition-transform duration-150 ease-out will-change-transform"
      style={enabled ? { transform: `translate(${offset.x}px, ${offset.y}px)` } : undefined}
      onMouseMove={(e) => {
        if (!enabled || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        setOffset({
          x: (e.clientX - (r.left + r.width / 2)) * 0.2,
          y: (e.clientY - (r.top + r.height / 2)) * 0.2,
        });
      }}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
    >
      {children}
    </div>
  );
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
    : { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

  const hero = storefront?.hero;
  const copy = locale === "ta" ? hero?.ta : hero?.en;
  const headline = copy?.headline ?? t.tagline;
  const support = copy?.support ?? t.heroSupport;
  const ctaLabel = copy?.ctaLabel?.trim() || t.ctaShop;
  const imageUrl = hero?.imageUrl ?? DEFAULT_HERO;
  const cats = flattenCategories(categories).slice(0, 8);

  const reveal = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 28 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.25 },
          transition: { ...transition, delay },
        };

  return (
    <main>
      <section className="relative min-h-[85svh] overflow-hidden">
        <div
          className={`absolute bg-cover bg-center ${
            reduceMotion ? "inset-0" : "-inset-[4%] hero-kenburns-plus"
          }`}
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
            <p className="font-display text-4xl tracking-[0.14em] text-elevated sm:text-5xl md:text-6xl">
              {t.brand}
            </p>
            <span className="mt-3 block h-0.5 w-16 bg-brass sm:w-20" />
            <h1
              className={`mt-6 font-display text-3xl text-elevated sm:text-4xl ${
                reduceMotion ? "" : "text-mask-reveal"
              }`}
            >
              {headline}
            </h1>
            <p className="mt-4 max-w-md text-elevated/85">{support}</p>
            <div className="mt-8">
              <MagneticCta enabled={!reduceMotion}>
                <Link href="/products">
                  <Button className="bg-wine text-elevated hover:bg-wine/90">{ctaLabel}</Button>
                </Link>
              </MagneticCta>
            </div>
          </motion.div>
        </div>
      </section>

      <motion.section
        className="border-y border-border/70 bg-elevated"
        {...reveal(0)}
      >
        <div className="mx-auto max-w-6xl px-6 py-14 sm:py-16">
          <p className="text-xs uppercase tracking-[0.22em] text-brass">{t.storyEyebrow}</p>
          <h2 className="mt-3 max-w-2xl font-display text-2xl text-ink sm:text-3xl">
            {t.storyTitle}
          </h2>
          <p className="mt-4 max-w-xl text-muted leading-relaxed">{t.storyBody}</p>
        </div>
      </motion.section>

      {cats.length ? (
        <motion.section className="mx-auto max-w-6xl px-6 py-14" {...reveal(0.05)}>
          <h2 className="font-display text-2xl">{t.shopByCategory}</h2>
          <div className="lookbook-scroll mt-6 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
            {cats.map((c) => (
              <Link
                key={c.id}
                href={`/categories/${c.slug}`}
                className="snap-start shrink-0 rounded-md border border-border bg-elevated px-5 py-3 text-sm transition hover:border-brass/50"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </motion.section>
      ) : null}

      <motion.section className="mx-auto max-w-6xl px-6 pb-20" {...reveal(0.08)}>
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl sm:text-3xl">{t.newArrivals}</h2>
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
                initial={reduceMotion ? false : { opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  delay: reduceMotion ? 0 : i * 0.07,
                  duration: reduceMotion ? 0 : 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
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
      </motion.section>
    </main>
  );
}
