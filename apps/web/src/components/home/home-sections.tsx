"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button, CategoryTile, ProductCarousel, ProductCarouselItem } from "@t360/ui";
import type { Branch, CategoryNode, ProductListItem, StorefrontSection } from "../../lib/catalog-api";
import { API_URL } from "../../lib/catalog-api";
import { ProductCardInteractive } from "../store/product-card-interactive";
import { OptimizedImage, renderTileImage } from "../store/optimized-image";
import { BrandLogo } from "../brand-logo";
import {
  DEFAULT_SHOP_CATEGORY_SLUGS,
  getCategoryImageUrl,
  HERO_DESKTOP_IMAGE,
  HERO_MOBILE_IMAGE,
} from "../../lib/category-images";
import { getWhatsAppE164 } from "../../lib/social";
import { isBannedSareeUrl, useHomeProductDedup } from "./home-product-dedup";

const OCCASION_CARDS = [
  { label: "Wedding", href: "/collections/wedding-edit", slug: "wedding-lehengas" },
  { label: "Festival", href: "/collections/festive-edit", slug: "festival-kurtas" },
  { label: "Party", href: "/women?category=women-party-dresses", slug: "women-party-dresses" },
  { label: "Family Function", href: "/collections/family-celebration", slug: "women-ethnic-sets" },
  { label: "Everyday", href: "/products?sort=newest", slug: "women-kurtis" },
  { label: "Gifting", href: "/sale", slug: "women-ethnic-sets" },
];

const WHY_PILLARS = [
  { title: "Quality Checked", desc: "Every piece inspected before it reaches you." },
  { title: "Secure Payments", desc: "Razorpay & COD with full encryption." },
  { title: "Easy Returns", desc: "Hassle-free returns at our Pudukkottai store." },
  { title: "Fast Delivery", desc: "Dispatch from Pudukkottai & Chennai." },
  { title: "Family Fashion", desc: "Women, men & kids under one roof." },
  { title: "Pudukkottai Store", desc: "Visit us for personalised styling." },
];

function flattenCategories(nodes: CategoryNode[]): CategoryNode[] {
  const out: CategoryNode[] = [];
  for (const n of nodes) {
    out.push(n);
    if (n.children?.length) out.push(...flattenCategories(n.children));
  }
  return out;
}

type HeroSlide = { desktop: string; mobile: string };

function HeroChevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
      {dir === "left" ? (
        <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export function HeroCampaignSection({
  section,
  hero,
  reduceMotion,
  t,
}: {
  section: Extract<StorefrontSection, { type: "heroCampaign" }>;
  hero: { desktopImageUrl?: string; mobileImageUrl?: string; imageUrl?: string } | null;
  reduceMotion: boolean | null;
  t: Record<string, string | undefined>;
}) {
  const campaignDesktop =
    section.imageUrl ?? hero?.desktopImageUrl ?? hero?.imageUrl ?? HERO_DESKTOP_IMAGE;
  const campaignMobile =
    section.mobileImageUrl ?? hero?.mobileImageUrl ?? HERO_MOBILE_IMAGE ?? campaignDesktop;
  const headline = section.headline ?? "DRESS EVERY MOMENT BEAUTIFULLY";
  const subtitle = section.subtitle ?? "Discover fashion for women, men & kids at THARAGAI.";
  const kenBurns = reduceMotion ? "" : "hero-kenburns-plus";
  const textTransition = reduceMotion ? { duration: 0 } : { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

  const [productSlides, setProductSlides] = React.useState<HeroSlide[]>([]);
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const touchStartX = React.useRef<number | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function loadSlides() {
      const collect = (items: ProductListItem[]): HeroSlide[] => {
        const out: HeroSlide[] = [];
        for (const p of items) {
          const url = p.images?.find((img) => img.mediaType !== "video")?.url ?? p.images?.[0]?.url;
          if (!url || isBannedSareeUrl(url)) continue;
          out.push({ desktop: url, mobile: url });
        }
        return out;
      };
      try {
        const featuredRes = await fetch(`${API_URL}/products?isFeatured=true&pageSize=12`);
        const featuredJson = await featuredRes.json();
        let rows = collect((featuredJson.data ?? []) as ProductListItem[]);
        if (rows.length < 1) {
          const newRes = await fetch(`${API_URL}/products?isNew=true&pageSize=12`);
          const newJson = await newRes.json();
          rows = collect((newJson.data ?? []) as ProductListItem[]);
        }
        if (!cancelled) setProductSlides(rows);
      } catch {
        if (!cancelled) setProductSlides([]);
      }
    }
    void loadSlides();
    return () => {
      cancelled = true;
    };
  }, []);

  const slides = React.useMemo(() => {
    const base: HeroSlide[] = [];
    if (campaignDesktop && !isBannedSareeUrl(campaignDesktop)) {
      base.push({ desktop: campaignDesktop, mobile: campaignMobile || campaignDesktop });
    }
    const seen = new Set(base.map((s) => s.desktop));
    for (const s of productSlides) {
      if (seen.has(s.desktop) || isBannedSareeUrl(s.desktop)) continue;
      seen.add(s.desktop);
      base.push(s);
    }
    return base;
  }, [campaignDesktop, campaignMobile, productSlides]);

  const safeIndex = slides.length ? index % slides.length : 0;
  const active = slides[safeIndex];
  const showControls = slides.length >= 2;

  React.useEffect(() => {
    if (index >= slides.length && slides.length > 0) setIndex(0);
  }, [index, slides.length]);

  const goPrev = () => {
    setIndex((i) => (slides.length ? (i - 1 + slides.length) % slides.length : 0));
  };

  const goNext = () => {
    setIndex((i) => (slides.length ? (i + 1) % slides.length : 0));
  };

  React.useEffect(() => {
    if (reduceMotion || !showControls || paused) return;
    const timer = window.setInterval(() => {
      setIndex((i) => (slides.length ? (i + 1) % slides.length : 0));
    }, 6000);
    return () => window.clearInterval(timer);
  }, [reduceMotion, showControls, paused, slides.length]);

  return (
    <motion.section
      className="relative min-h-[72svh] overflow-hidden bg-ink text-elevated lg:min-h-[78vh]"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(e) => {
        touchStartX.current = e.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchStartX.current;
        touchStartX.current = null;
        if (start == null || !showControls) return;
        const end = e.changedTouches[0]?.clientX ?? start;
        const delta = end - start;
        if (Math.abs(delta) < 40) return;
        if (delta < 0) goNext();
        else goPrev();
      }}
    >
      {active ? (
        <div
          key={`${active.desktop}-${safeIndex}`}
          className={`absolute inset-0 ${reduceMotion ? "" : "animate-fade-in"}`}
        >
          <div className={`absolute inset-0 hidden sm:block ${kenBurns}`}>
            <OptimizedImage
              src={active.desktop}
              alt=""
              className="h-full w-full object-cover object-center"
              sizes="100vw"
              priority={safeIndex === 0}
            />
          </div>
          <div className={`absolute inset-0 sm:hidden ${kenBurns}`}>
            <OptimizedImage
              src={active.mobile}
              alt=""
              className="h-full w-full object-cover object-top"
              sizes="100vw"
              priority={safeIndex === 0}
            />
          </div>
        </div>
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/30 to-ink/20" />

      {showControls ? (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={goPrev}
            className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-elevated/95 text-ink shadow-md transition hover:bg-elevated sm:left-5"
          >
            <HeroChevron dir="left" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={goNext}
            className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-elevated/95 text-ink shadow-md transition hover:bg-elevated sm:right-5"
          >
            <HeroChevron dir="right" />
          </button>
          <div
            className="absolute bottom-28 left-1/2 z-20 flex -translate-x-1/2 gap-2 sm:bottom-32"
            role="tablist"
            aria-label="Hero slides"
          >
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === safeIndex}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === safeIndex ? "w-6 bg-brass" : "w-2 bg-elevated/50 hover:bg-elevated/80"
                }`}
              />
            ))}
          </div>
        </>
      ) : null}

      <div className="relative z-10 mx-auto flex min-h-[85svh] max-w-content flex-col justify-end px-6 pb-16 pt-28 lg:min-h-[90svh]">
        <motion.p
          className="text-xs uppercase tracking-[0.25em] text-brass"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...textTransition, delay: 0.1 }}
        >
          THARAGAI Readymades
        </motion.p>
        <motion.h1
          className="mt-4 max-w-3xl font-display text-[var(--font-display-scale)] leading-tight"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...textTransition, delay: 0.25 }}
        >
          {headline}
        </motion.h1>
        <motion.p
          className="mt-4 max-w-xl text-lg text-elevated/85"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...textTransition, delay: 0.4 }}
        >
          {subtitle}
        </motion.p>
        <motion.div
          className="mt-8 flex flex-wrap gap-3"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...textTransition, delay: 0.55 }}
        >
          <Link href="/women">
            <Button variant="secondary" className="bg-elevated text-ink hover:bg-linen">
              SHOP WOMEN
            </Button>
          </Link>
          <Link href="/men">
            <Button variant="outline" className="border-elevated/40 text-elevated hover:bg-elevated/10">
              SHOP MEN
            </Button>
          </Link>
          <Link href="/kids">
            <Button variant="outline" className="border-elevated/40 text-elevated hover:bg-elevated/10">
              SHOP KIDS
            </Button>
          </Link>
        </motion.div>
      </div>
    </motion.section>
  );
}

export function ShopByCategorySection({
  section,
  categories,
  reduceMotion,
  t,
}: {
  section: Extract<StorefrontSection, { type: "shopByCategory" }>;
  categories: CategoryNode[];
  reduceMotion: boolean | null;
  t: Record<string, string | undefined>;
}) {
  const configuredSlugs =
    section.categorySlugs?.length ? section.categorySlugs : [...DEFAULT_SHOP_CATEGORY_SLUGS];
  const flat = flattenCategories(categories);
  const bySlug = new Map(flat.map((c) => [c.slug, c]));
  const tiles: CategoryNode[] = [];
  for (const slug of configuredSlugs) {
    const cat = bySlug.get(slug);
    if (cat) tiles.push(cat);
  }
  if (tiles.length < 8) {
    for (const slug of DEFAULT_SHOP_CATEGORY_SLUGS) {
      if (tiles.length >= 8) break;
      const cat = bySlug.get(slug);
      if (cat && !tiles.some((t) => t.slug === slug)) tiles.push(cat);
    }
  }
  const tileTransition = reduceMotion ? { duration: 0 } : { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <motion.section
      className="mx-auto max-w-content px-6 py-[var(--section-py)]"
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <h2 className="font-display text-[var(--font-section-scale)]">
        {section.title ?? t.shopByCategory ?? "Shop by Category"}
      </h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((c, i) => (
          <motion.div
            key={c.id}
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ ...tileTransition, delay: reduceMotion ? 0 : i * 0.05 }}
          >
            <CategoryTile
              name={c.name}
              href={`/categories/${c.slug}`}
              imageUrl={getCategoryImageUrl(c.slug)}
              renderImage={renderTileImage}
            />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

export function CampaignBlock({
  section,
  reduceMotion,
  dark = false,
}: {
  section: {
    headline: string;
    subtitle?: string;
    imageUrl?: string;
    ctaHref?: string;
    ctaLabel?: string;
  };
  reduceMotion: boolean | null;
  dark?: boolean;
}) {
  return (
    <motion.section
      className={`relative overflow-hidden ${dark ? "bg-ink text-elevated" : "bg-linen/50"}`}
      initial={reduceMotion ? false : { opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      <div className="mx-auto grid max-w-content lg:grid-cols-2">
        {section.imageUrl ? (
          <div className="relative aspect-[4/5] lg:aspect-auto lg:min-h-[28rem]">
            <OptimizedImage src={section.imageUrl} alt="" className="object-cover" sizes="50vw" />
          </div>
        ) : null}
        <div className="flex flex-col justify-center px-6 py-14 lg:px-12">
          <h2 className="font-display text-3xl sm:text-4xl">{section.headline}</h2>
          {section.subtitle ? <p className="mt-4 text-muted">{section.subtitle}</p> : null}
          {section.ctaHref ? (
            <Link href={section.ctaHref} className="mt-8 inline-block">
              <Button variant={dark ? "secondary" : "primary"}>
                {section.ctaLabel ?? "SHOP NOW"}
              </Button>
            </Link>
          ) : null}
        </div>
      </div>
    </motion.section>
  );
}

export function ShopByOccasionSection({
  section,
  reduceMotion,
}: {
  section: Extract<StorefrontSection, { type: "shopByOccasion" }>;
  reduceMotion: boolean | null;
}) {
  return (
    <motion.section
      className="mx-auto max-w-content px-6 py-[var(--section-py)]"
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <h2 className="font-display text-[var(--font-section-scale)]">
        {section.title ?? "Shop by Occasion"}
      </h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {OCCASION_CARDS.map((o) => (
          <Link
            key={o.label}
            href={o.href}
            className="group rounded-lg border border-border bg-elevated p-6 transition-shadow hover:shadow-[var(--shadow-card-hover)]"
          >
            <p className="text-xs uppercase tracking-wider text-brass">{o.label}</p>
            <p className="mt-2 font-display text-xl group-hover:text-wine">Explore →</p>
          </Link>
        ))}
      </div>
    </motion.section>
  );
}

export function WhyTharagaiSection({ reduceMotion }: { reduceMotion: boolean | null }) {
  return (
    <motion.section
      className="border-y border-border bg-elevated px-6 py-[var(--section-py)]"
      initial={reduceMotion ? false : { opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      <div className="mx-auto max-w-content">
        <h2 className="text-center font-display text-[var(--font-section-scale)]">Why THARAGAI</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {WHY_PILLARS.map((p) => (
            <div key={p.title} className="text-center sm:text-left">
              <p className="font-medium text-ink">{p.title}</p>
              <p className="mt-1 text-sm text-muted">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

export function VisitStoreSection({
  branches,
  businessName,
  reduceMotion,
}: {
  branches: Branch[];
  businessName?: string;
  reduceMotion: boolean | null;
}) {
  const branch = branches.find((b) => b.code === "PDK01") ?? branches[0];
  if (!branch) return null;

  return (
    <motion.section
      className="mx-auto max-w-content px-6 py-[var(--section-py)]"
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <h2 className="font-display text-[var(--font-section-scale)]">Visit THARAGAI</h2>
      <div className="mt-6 rounded-lg border border-border bg-elevated p-8">
        <p className="font-display text-2xl">{businessName ?? "THARAGAI Readymades"}</p>
        <p className="mt-2 text-muted">Pudukkottai, Tamil Nadu</p>
        <p className="mt-4 text-sm">{branch.address}</p>
        {branch.phone ? (
          <p className="mt-2 text-sm">
            <a href={`tel:${branch.phone}`} className="text-wine hover:underline">
              {branch.phone}
            </a>
          </p>
        ) : null}
        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(branch.address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-sm text-wine hover:underline"
        >
          Get directions →
        </a>
      </div>
    </motion.section>
  );
}

export function SocialFollowSection({
  section,
  reduceMotion,
}: {
  section: Extract<StorefrontSection, { type: "socialFollow" }>;
  reduceMotion: boolean | null;
}) {
  const waDigits = getWhatsAppE164();
  const links = [
    { label: "Instagram", url: section.instagramUrl },
    {
      label: "WhatsApp",
      url: waDigits ? `https://wa.me/${waDigits}` : undefined,
    },
    { label: "Facebook", url: section.facebookUrl },
    { label: "YouTube", url: section.youtubeUrl },
  ].filter((l): l is { label: string; url: string } => Boolean(l.url));

  if (!links.length) return null;

  return (
    <motion.section
      className="bg-ink px-6 py-14 text-elevated"
      initial={reduceMotion ? false : { opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      <div className="mx-auto max-w-content text-center">
        <h2 className="font-display text-2xl">Follow THARAGAI</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-elevated/30 px-4 py-2 text-sm hover:bg-elevated/10"
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

export function CompleteTheLookSection({
  section,
  reduceMotion,
}: {
  section: Extract<StorefrontSection, { type: "completeTheLook" }>;
  reduceMotion: boolean | null;
}) {
  type LookRow = { label: string; products: ProductListItem[] };

  const { claimProducts } = useHomeProductDedup();
  const [looks, setLooks] = React.useState<LookRow[]>([]);

  const LOOK_CURATIONS = React.useMemo(
    () => [
      {
        label: "Festive ethnic ensemble",
        categories: ["women-chudidars", "women-blouses", "women-ethnic-sets"],
      },
      {
        label: "Smart casual for him",
        categories: ["men-casual-shirts", "men-jeans", "men-polos"],
      },
      {
        label: "Kids celebration ready",
        categories: ["kids-frocks", "kids-ethnic", "kids-dresses"],
      },
    ],
    [],
  );

  React.useEffect(() => {
    void (async () => {
      try {
        const rows = await Promise.all(
          LOOK_CURATIONS.map(async (look) => {
            const products = await Promise.all(
              look.categories.map(async (cat) => {
                const res = await fetch(
                  `${API_URL}/products?category=${encodeURIComponent(cat)}&pageSize=1&sort=featured`,
                );
                const json = (await res.json()) as { data?: ProductListItem[] };
                return json.data?.[0] ?? null;
              }),
            );
            return {
              label: look.label,
              products: products.filter(Boolean) as ProductListItem[],
            };
          }),
        );
        setLooks(
          rows
            .map((row) => {
              const claimed = claimProducts(row.products);
              const claimedIds = new Set(claimed.map((p) => p.id));
              return {
                label: row.label,
                products: row.products.filter((p) => claimedIds.has(p.id)),
              };
            })
            .filter((r) => r.products.length >= 2),
        );
      } catch {
        setLooks([]);
      }
    })();
  }, [LOOK_CURATIONS, claimProducts]);

  if (!looks.length) return null;

  return (
    <motion.section
      className="mx-auto max-w-content px-6 py-[var(--section-py)]"
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <h2 className="font-display text-[var(--font-section-scale)]">
        {section.title ?? "Complete the Look"}
      </h2>
      <div className="mt-10 space-y-12">
        {looks.map((look) => (
          <div key={look.label}>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">{look.label}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3 sm:gap-4">
              {look.products.map((p, i) => (
                <React.Fragment key={p.id}>
                  {i > 0 ? (
                    <span className="hidden text-2xl font-light text-brass sm:inline" aria-hidden>
                      +
                    </span>
                  ) : null}
                  <div className="w-[calc(50%-0.375rem)] min-w-[9rem] flex-1 sm:w-48 sm:flex-none">
                    <ProductCardInteractive product={p} />
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

export function RecommendationsSection({
  section,
  reduceMotion,
}: {
  section: Extract<StorefrontSection, { type: "recommendations" }>;
  reduceMotion: boolean | null;
}) {
  const { claimProducts } = useHomeProductDedup();
  const [products, setProducts] = React.useState<ProductListItem[]>([]);

  React.useEffect(() => {
    void fetch(`${API_URL}/products?pageSize=8&sort=featured&isFeatured=true`)
      .then((r) => r.json())
      .then((j) => setProducts(claimProducts(j.data ?? [])))
      .catch(() => setProducts([]));
  }, [claimProducts]);

  if (!products.length) return null;

  return (
    <motion.section
      className="border-t border-border bg-linen/30 px-6 py-[var(--section-py)]"
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="mx-auto max-w-content">
        <h2 className="font-display text-[var(--font-section-scale)]">
          {section.title ?? "You May Also Like"}
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCardInteractive key={p.id} product={p} />
          ))}
        </div>
        <Link
          href="/products?sort=featured"
          className="mt-8 inline-block text-sm font-medium text-wine hover:underline"
        >
          View all recommendations →
        </Link>
      </div>
    </motion.section>
  );
}

export function ReviewsHighlightSection({
  section,
  reduceMotion,
}: {
  section: Extract<StorefrontSection, { type: "reviewsHighlight" }>;
  reduceMotion: boolean | null;
}) {
  const [reviews, setReviews] = React.useState<
    Array<{ rating: number; title: string; body: string; authorName: string }>
  >([]);

  React.useEffect(() => {
    void fetch(`${API_URL}/products?pageSize=1&sort=rating`)
      .then((r) => r.json())
      .then(async (j) => {
        const p = j.data?.[0];
        if (!p?.slug) return;
        const rr = await fetch(`${API_URL}/products/${p.slug}/reviews?pageSize=3`);
        const body = await rr.json();
        setReviews(body.data?.items ?? []);
      })
      .catch(() => setReviews([]));
  }, []);

  if (!reviews.length) return null;

  return (
    <motion.section
      className="border-t border-border bg-linen/50 px-6 py-[var(--section-py)]"
      initial={reduceMotion ? false : { opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      <div className="mx-auto max-w-content">
        <h2 className="font-display text-[var(--font-section-scale)]">
          {section.title ?? "Customer Reviews"}
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {reviews.map((r, i) => (
            <blockquote key={i} className="rounded-lg border border-border bg-elevated p-6">
              <p className="text-brass">{"★".repeat(r.rating)}</p>
              <p className="mt-2 font-medium">{r.title}</p>
              <p className="mt-2 text-sm text-muted line-clamp-3">{r.body}</p>
              <footer className="mt-4 text-xs text-muted">— {r.authorName}</footer>
            </blockquote>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

export function NewsletterSection({
  reduceMotion,
  t,
}: {
  reduceMotion: boolean | null;
  t: Record<string, string | undefined>;
}) {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "done" | "error">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch(`${API_URL}/marketing/newsletter/subscribe`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, source: "homepage" }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("done");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <motion.section
      className="border-t border-border bg-linen/80 px-6 py-16"
      initial={reduceMotion ? false : { opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      <div className="mx-auto max-w-xl text-center">
        <h2 className="font-display text-2xl">{t.newsletterTitle ?? "Stay in touch"}</h2>
        <p className="mt-2 text-sm text-muted">{t.newsletterBody ?? t.footerTagline}</p>
        <form className="mt-6 flex flex-col gap-2 sm:flex-row" onSubmit={onSubmit}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.emailPlaceholder ?? "Your email address"}
            className="h-11 flex-1 rounded-md border border-border bg-elevated px-3 text-sm"
            aria-label={t.emailPlaceholder ?? "Email"}
          />
          <Button type="submit" disabled={status === "loading"}>
            {status === "done" ? "Subscribed!" : t.newsletterCta ?? "Subscribe"}
          </Button>
        </form>
        {status === "error" ? (
          <p className="mt-2 text-sm text-danger">Something went wrong. Please try again.</p>
        ) : null}
      </div>
    </motion.section>
  );
}

export function EnhancedTryMePromo({ reduceMotion, t }: { reduceMotion: boolean | null; t: Record<string, string | undefined> }) {
  return (
    <motion.section
      className="relative overflow-hidden bg-ink px-6 py-16 text-elevated"
      initial={reduceMotion ? false : { opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      <div className="mx-auto flex max-w-content flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
        <div className="max-w-lg">
          <p className="text-xs uppercase tracking-[0.2em] text-brass">Virtual Try-On</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl">
            {t.tryMePromoHeadline ?? "SEE YOURSELF IN THARAGAI"}
          </h2>
          <p className="mt-3 text-elevated/80">
            {t.tryMePromoBody ?? "Try selected outfits virtually before you buy."}
          </p>
        </div>
        <Link href="/try-me">
          <Button variant="secondary" className="bg-elevated text-ink hover:bg-linen">
            TRY IT NOW
          </Button>
        </Link>
      </div>
    </motion.section>
  );
}
