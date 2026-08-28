"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Button,
  CategoryTile,
  ProductCarousel,
  ProductCarouselItem,
} from "@t360/ui";
import { useLocale } from "../lib/locale";
import type { CategoryNode, ProductListItem, StorefrontSection, StorefrontSettings } from "../lib/catalog-api";
import { API_URL } from "../lib/catalog-api";
import { ProductCardInteractive } from "./store/product-card-interactive";
import { OptimizedImage, renderTileImage } from "./store/optimized-image";
import { BrandLogo } from "./brand-logo";
import {
  CampaignBlock,
  CompleteTheLookSection,
  EnhancedTryMePromo,
  HeroCampaignSection,
  NewsletterSection,
  ReviewsHighlightSection,
  ShopByCategorySection,
  ShopByOccasionSection,
  SocialFollowSection,
  VisitStoreSection,
  WhyTharagaiSection,
} from "./home/home-sections";

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

function SectionCarousel({
  section,
  reduceMotion,
}: {
  section: Extract<StorefrontSection, { type: "productCarousel" }>;
  reduceMotion: boolean | null;
}) {
  const { t } = useLocale();
  const [products, setProducts] = React.useState<ProductListItem[]>([]);

  React.useEffect(() => {
    const params = new URLSearchParams({ pageSize: "8" });
    if (section.query.sort) params.set("sort", section.query.sort);
    if (section.query.categorySlug) params.set("category", section.query.categorySlug);
    if (section.query.collectionSlug) params.set("collection", section.query.collectionSlug);
    if (section.query.tryOnOnly) params.set("tryOnEnabled", "true");
    if (section.query.isNew) params.set("isNew", "true");
    if (section.query.isBestseller) params.set("isBestseller", "true");
    if (section.query.isTrending) params.set("isTrending", "true");
    if (section.query.isFeatured) params.set("isFeatured", "true");
    if (section.query.onSale) params.set("onSale", "true");
    if (section.query.productIds?.length) {
      void Promise.all(
        section.query.productIds.map((id) =>
          fetch(`${API_URL}/products/${id}`).then((r) => r.json()).then((j) => j.data),
        ),
      )
        .then((rows) => setProducts(rows.filter(Boolean)))
        .catch(() => setProducts([]));
      return;
    }
    void fetch(`${API_URL}/products?${params}`)
      .then((r) => r.json())
      .then((json) => setProducts(json.data ?? []))
      .catch(() => setProducts([]));
  }, [section]);

  if (!products.length) return null;

  return (
    <motion.section
      className="mx-auto max-w-content px-6 py-14"
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <ProductCarousel
        title={section.title}
        action={
          <Link href="/products" className="text-sm text-wine hover:underline">
            {t.ctaShop}
          </Link>
        }
      >
        {products.map((p) => (
          <ProductCarouselItem key={p.id}>
            <ProductCardInteractive product={p} />
          </ProductCarouselItem>
        ))}
      </ProductCarousel>
    </motion.section>
  );
}

function CollectionSection({
  section,
  reduceMotion,
  t,
}: {
  section: Extract<StorefrontSection, { type: "collection" }>;
  reduceMotion: boolean | null;
  t: { ctaShop: string };
}) {
  const [products, setProducts] = React.useState<ProductListItem[]>([]);
  const slug = section.collectionSlug;

  React.useEffect(() => {
    if (!slug) return;
    void fetch(`${API_URL}/products?collection=${encodeURIComponent(slug)}&pageSize=8`)
      .then((r) => r.json())
      .then((json) => setProducts(json.data ?? []))
      .catch(() => setProducts([]));
  }, [slug]);

  if (!products.length) return null;

  return (
    <motion.section
      className="mx-auto max-w-content px-6 py-14"
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <ProductCarousel
        title={section.title}
        action={
          slug ? (
            <Link href={`/products?collection=${slug}`} className="text-sm text-wine hover:underline">
              {t.ctaShop}
            </Link>
          ) : undefined
        }
      >
        {products.map((p) => (
          <ProductCarouselItem key={p.id}>
            <ProductCardInteractive product={p} />
          </ProductCarouselItem>
        ))}
      </ProductCarousel>
    </motion.section>
  );
}

export function HomeClient({
  categories,
  storefront,
  branches = [],
}: {
  products?: ProductListItem[];
  categories: CategoryNode[];
  storefront: StorefrontSettings | null;
  branches?: import("../lib/catalog-api").Branch[];
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
  const ctaHref = hero?.ctaHref ?? "/products";
  const desktopImage = hero?.desktopImageUrl ?? hero?.imageUrl ?? DEFAULT_HERO;
  const mobileImage = hero?.mobileImageUrl ?? hero?.imageUrl ?? desktopImage;
  const imageUrl = desktopImage;
  const videoUrl = hero?.videoUrl;
  const allCats = flattenCategories(categories);
  const sections = (storefront?.sections ?? []).filter((s) => s.visible !== false);

  function renderSection(section: StorefrontSection, index: number) {
    switch (section.type) {
      case "hero":
        return (
          <section key={`hero-${index}`} className="relative min-h-[85svh] overflow-hidden">
            {videoUrl ? (
              <video
                className={`absolute inset-0 h-full w-full object-cover ${reduceMotion ? "" : "hero-kenburns-plus"}`}
                src={videoUrl}
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <picture className={`absolute inset-0 block ${reduceMotion ? "" : "hero-kenburns-plus"}`}>
                <source media="(max-width: 768px)" srcSet={mobileImage} />
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${desktopImage})` }}
                />
              </picture>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/60 to-ink/25" />
            <div className="relative z-10 mx-auto flex min-h-[85svh] max-w-content flex-col justify-end px-6 pb-16 pt-10 sm:pb-24">
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={transition}
                className="max-w-xl"
              >
                <BrandLogo variant="hero" alt={t.brand} />
                <h1
                  className={`mt-6 font-display text-3xl text-elevated sm:text-4xl ${
                    reduceMotion ? "" : "text-mask-reveal"
                  }`}
                >
                  {headline}
                </h1>
                <p className="mt-4 max-w-md text-elevated/85">{support}</p>
                <div className="mt-8">
                  <Link href={ctaHref}>
                    <Button className="bg-wine text-elevated hover:bg-wine/90">{ctaLabel}</Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </section>
        );
      case "story":
        return (
          <motion.section
            key={`story-${index}`}
            className="border-y border-border/70 bg-elevated"
            initial={reduceMotion ? false : { opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="mx-auto max-w-content px-6 py-14 sm:py-16">
              <p className="text-xs uppercase tracking-[0.22em] text-brass">{t.storyEyebrow}</p>
              <h2 className="mt-3 max-w-2xl font-display text-2xl text-ink sm:text-3xl">
                {t.storyTitle}
              </h2>
              <p className="mt-4 max-w-xl leading-relaxed text-muted">{t.storyBody}</p>
            </div>
          </motion.section>
        );
      case "categoryGrid": {
        const slugs = section.categorySlugs?.length
          ? section.categorySlugs
          : allCats.slice(0, 6).map((c) => c.slug);
        const tiles = slugs
          .map((slug) => allCats.find((c) => c.slug === slug))
          .filter(Boolean) as CategoryNode[];
        if (!tiles.length) return null;
        return (
          <motion.section
            key={`cats-${index}`}
            className="mx-auto max-w-content px-6 py-14"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-2xl sm:text-3xl">{t.shopByCategory}</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tiles.map((c) => (
                <CategoryTile
                  key={c.id}
                  name={c.name}
                  href={`/categories/${c.slug}`}
                  renderImage={renderTileImage}
                />
              ))}
            </div>
          </motion.section>
        );
      }
      case "productCarousel":
        return (
          <SectionCarousel
            key={`carousel-${index}`}
            section={section}
            reduceMotion={reduceMotion}
          />
        );
      case "tryMePromo":
        return <EnhancedTryMePromo key={`try-me-${index}`} reduceMotion={reduceMotion} t={t} />;
      case "heroCampaign":
        return (
          <HeroCampaignSection
            key={`hero-campaign-${index}`}
            section={section as Extract<StorefrontSection, { type: "heroCampaign" }>}
            hero={hero ?? null}
            reduceMotion={reduceMotion}
            t={t}
          />
        );
      case "shopByCategory":
        return (
          <ShopByCategorySection
            key={`shop-cat-${index}`}
            section={section as Extract<StorefrontSection, { type: "shopByCategory" }>}
            categories={categories}
            reduceMotion={reduceMotion}
            t={t}
          />
        );
      case "festiveEdit":
        return (
          <CampaignBlock
            key={`festive-${index}`}
            section={section as Extract<StorefrontSection, { type: "festiveEdit" }>}
            reduceMotion={reduceMotion}
            dark
          />
        );
      case "familyCollection":
        return (
          <CampaignBlock
            key={`family-${index}`}
            section={section as Extract<StorefrontSection, { type: "familyCollection" }>}
            reduceMotion={reduceMotion}
          />
        );
      case "shopByOccasion":
        return (
          <ShopByOccasionSection
            key={`occasion-${index}`}
            section={section as Extract<StorefrontSection, { type: "shopByOccasion" }>}
            reduceMotion={reduceMotion}
          />
        );
      case "whyTharagai":
        return <WhyTharagaiSection key={`why-${index}`} reduceMotion={reduceMotion} />;
      case "visitStore":
        return (
          <VisitStoreSection
            key={`visit-${index}`}
            branches={branches}
            businessName={storefront?.businessName}
            reduceMotion={reduceMotion}
          />
        );
      case "socialFollow":
        return (
          <SocialFollowSection
            key={`social-${index}`}
            section={section as Extract<StorefrontSection, { type: "socialFollow" }>}
            reduceMotion={reduceMotion}
          />
        );
      case "reviewsHighlight":
        return (
          <ReviewsHighlightSection
            key={`reviews-${index}`}
            section={section as Extract<StorefrontSection, { type: "reviewsHighlight" }>}
            reduceMotion={reduceMotion}
          />
        );
      case "completeTheLook":
        return (
          <CompleteTheLookSection
            key={`ctl-${index}`}
            section={section as Extract<StorefrontSection, { type: "completeTheLook" }>}
            reduceMotion={reduceMotion}
          />
        );
      case "editorial":
        return (
          <motion.section
            key={`editorial-${index}`}
            className="mx-auto max-w-content px-6 py-14"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="grid overflow-hidden rounded-lg border border-border lg:grid-cols-2">
              <div className="relative aspect-[4/3] w-full lg:aspect-auto lg:min-h-[20rem]">
                {section.imageUrl ? (
                  <OptimizedImage
                    src={section.imageUrl}
                    alt=""
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                ) : null}
              </div>
              <div className="flex flex-col justify-center bg-elevated p-8 sm:p-12">
                <h2 className="font-display text-3xl text-ink">{section.headline}</h2>
                {section.body ? <p className="mt-4 text-muted">{section.body}</p> : null}
                {section.ctaHref ? (
                  <Link href={section.ctaHref} className="mt-6 inline-block">
                    <Button variant="outline">{section.ctaLabel ?? t.ctaShop}</Button>
                  </Link>
                ) : null}
              </div>
            </div>
          </motion.section>
        );
      case "newsletter":
        return <NewsletterSection key={`newsletter-${index}`} reduceMotion={reduceMotion} t={t} />;
      case "collection":
        return (
          <CollectionSection key={`collection-${index}`} section={section} reduceMotion={reduceMotion} t={t} />
        );
      case "promotion":
      case "sale":
        return (
          <motion.section
            key={`${section.type}-${index}`}
            className="mx-auto max-w-content px-6 py-14"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="overflow-hidden rounded-lg border border-border bg-elevated p-8 sm:p-12">
              {section.imageUrl ? (
                <div className="relative mb-6 h-64 w-full overflow-hidden rounded-md">
                  <OptimizedImage
                    src={section.imageUrl}
                    alt=""
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 72rem"
                  />
                </div>
              ) : null}
              <p className="text-xs uppercase tracking-[0.2em] text-brass">{section.type}</p>
              <h2 className="mt-2 font-display text-3xl">{section.headline}</h2>
              {section.subtitle ? <p className="mt-3 text-muted">{section.subtitle}</p> : null}
              {section.ctaHref ? (
                <Link href={section.ctaHref} className="mt-6 inline-block">
                  <Button>{section.ctaLabel ?? t.ctaShop}</Button>
                </Link>
              ) : null}
            </div>
          </motion.section>
        );
      case "videoHero":
        return section.videoUrl ? (
          <section key={`video-hero-${index}`} className="relative min-h-[70svh] overflow-hidden">
            <video className="absolute inset-0 h-full w-full object-cover" src={section.videoUrl} autoPlay muted loop playsInline />
            <div className="absolute inset-0 bg-ink/40" />
            {section.ctaHref ? (
              <div className="relative z-10 flex min-h-[70svh] items-end p-8">
                <Link href={section.ctaHref}>
                  <Button>{section.ctaLabel ?? t.ctaShop}</Button>
                </Link>
              </div>
            ) : null}
          </section>
        ) : null;
      default:
        return null;
    }
  }

  return (
    <main>
      {sections.length
        ? sections.map((section, i) => renderSection(section, i))
        : renderSection({ type: "hero", visible: true, order: 0 }, 0)}
    </main>
  );
}
