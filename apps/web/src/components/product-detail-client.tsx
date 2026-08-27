"use client";

import * as React from "react";
import Link from "next/link";
import { Button, Price, ProductGallery, Badge, Select, ProductCarousel, ProductCarouselItem } from "@t360/ui";
import type { Branch, ProductDetail, ProductListItem } from "../lib/catalog-api";
import { API_URL, SITE_URL, productPrice } from "../lib/catalog-api";
import { apiFetch, getCustomerToken } from "../lib/api";
import { useLocale } from "../lib/locale";
import { buildWhatsAppEnquiryUrl } from "../lib/whatsapp";
import { TryOnModal } from "./try-on/try-on-modal";
import { ProductReviews } from "./product-reviews";
import { ProductCardInteractive } from "./store/product-card-interactive";

export function ProductDetailClient({
  product: initial,
  branches,
}: {
  product: ProductDetail;
  branches: Branch[];
}) {
  const { t } = useLocale();
  const [product, setProduct] = React.useState(initial);
  const [branch, setBranch] = React.useState("");
  const [selected, setSelected] = React.useState(initial.variants?.[0]?.id);
  const [wishIds, setWishIds] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [tryOnOpen, setTryOnOpen] = React.useState(false);
  const [related, setRelated] = React.useState<ProductListItem[]>([]);
  const [infoTab, setInfoTab] = React.useState<"materials" | "care" | "shipping">("materials");

  const variant = product.variants?.find((v) => v.id === selected) ?? product.variants?.[0];
  const sizes = Array.from(
    new Set((product.variants ?? []).map((v) => v.attributes?.size).filter(Boolean)),
  ) as string[];
  const inStock = variant?.inStock ?? product.inStock;
  const price = Number(variant?.salePrice ?? variant?.price ?? productPrice(product).amount);
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_E164 ?? "919876543210";

  React.useEffect(() => {
    const token = getCustomerToken();
    if (!token) return;
    void apiFetch<Array<{ variantId: string }>>("/wishlist")
      .then((res) => setWishIds(res.data.map((i) => i.variantId)))
      .catch(() => undefined);
  }, []);

  React.useEffect(() => {
    const slug = product.category?.slug;
    if (!slug) {
      setRelated([]);
      return;
    }
    const params = new URLSearchParams({ pageSize: "8", sort: "newest", category: slug });
    void fetch(`${API_URL}/products?${params}`)
      .then((r) => r.json())
      .then((json) => {
        const items = (json.data as ProductListItem[] | undefined) ?? [];
        setRelated(items.filter((p) => p.id !== product.id).slice(0, 8));
      })
      .catch(() => setRelated([]));
  }, [product.id, product.category?.slug]);

  async function onBranchChange(code: string) {
    setBranch(code === "__" ? "" : code);
    if (!code || code === "__") {
      setProduct(initial);
      return;
    }
    const res = await fetch(`${API_URL}/products/${initial.slug}?branch=${encodeURIComponent(code)}`);
    const json = await res.json();
    if (json.success) setProduct(json.data);
  }

  async function toggleWishlist() {
    if (!variant) return;
    if (!getCustomerToken()) {
      window.location.href = `/account?redirect=/products/${initial.slug}`;
      return;
    }
    setBusy(true);
    try {
      if (wishIds.includes(variant.id)) {
        await apiFetch(`/wishlist/${variant.id}`, { method: "DELETE" });
        setWishIds((ids) => ids.filter((id) => id !== variant.id));
      } else {
        await apiFetch("/wishlist", {
          method: "POST",
          body: JSON.stringify({ variantId: variant.id }),
        });
        setWishIds((ids) => [...ids, variant.id]);
      }
    } finally {
      setBusy(false);
    }
  }

  const waUrl = buildWhatsAppEnquiryUrl({
    e164: waNumber,
    productName: product.name,
    sku: variant?.sku ?? "",
    price,
    url: `${SITE_URL}/products/${product.slug}`,
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: variant?.sku,
    image: product.images?.[0]?.url,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: String(price),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 pb-28 lg:pb-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="grid gap-10 lg:grid-cols-2">
      <div>
        <Link href="/products" className="text-sm text-wine hover:underline">
          ← {t.navProducts}
        </Link>
        <div className="mt-4 lg:sticky lg:top-24">
          <ProductGallery
            images={
              (product.images ?? []).length
                ? (product.images ?? []).map((img) => ({
                    src: img.url,
                    alt: img.alt || product.name,
                    mediaType: (img.mediaType === "video" ? "video" : "image") as "image" | "video",
                  }))
                : [
                    {
                      src: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80",
                      alt: product.name,
                    },
                  ]
            }
          />
        </div>
      </div>
      <div className="lg:sticky lg:top-24 lg:self-start">
        {product.brand?.name ? (
          <p className="text-xs uppercase tracking-wide text-muted">{product.brand.name}</p>
        ) : null}
        <h1 className="mt-2 font-display text-4xl">{product.name}</h1>
        {(product as ProductDetail & { reviewCount?: number; averageRating?: number | null }).reviewCount ? (
          <p className="mt-2 text-sm text-muted">
            {(product as ProductDetail & { averageRating?: number | null }).averageRating?.toFixed(1)} ★ ·{" "}
            {(product as ProductDetail & { reviewCount?: number }).reviewCount} reviews
          </p>
        ) : null}
        <div className="mt-4">
          <Price
            amount={price}
            compareAt={variant?.salePrice != null ? Number(variant.price) : undefined}
          />
        </div>
        <p className="mt-4 text-muted">{product.description}</p>

        {branches.length ? (
          <div className="mt-6 max-w-xs">
            <Select
              label={t.branch}
              value={branch || "__"}
              onValueChange={(v) => void onBranchChange(v)}
              options={[
                { value: "__", label: t.allBranches },
                ...branches.map((b) => ({ value: b.code, label: `${b.code} — ${b.name}` })),
              ]}
            />
          </div>
        ) : null}

        {sizes.length ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {sizes.map((size) => {
              const match = product.variants?.find((v) => v.attributes?.size === size);
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => match && setSelected(match.id)}
                  className={`rounded-md border px-3 py-2 text-sm ${
                    variant?.attributes?.size === size
                      ? "border-wine text-wine"
                      : "border-border"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="brass">{variant?.sku}</Badge>
          {variant?.attributes?.colour ? (
            <Badge tone="teal">{variant.attributes.colour}</Badge>
          ) : null}
          <Badge tone={inStock ? "success" : "neutral"}>
            {inStock ? t.inStock : t.outOfStock}
          </Badge>
        </div>

        <div className="mt-8 hidden flex-wrap gap-3 lg:flex">
          <Button
            disabled={!inStock || busy}
            type="button"
            onClick={async () => {
              if (!variant) return;
              if (!getCustomerToken()) {
                window.location.href = "/account";
                return;
              }
              setBusy(true);
              try {
                await apiFetch("/cart/items", {
                  method: "POST",
                  body: JSON.stringify({
                    variantId: variant.id,
                    qty: 1,
                  }),
                });
              } finally {
                setBusy(false);
              }
            }}
          >
            {t.addToCart}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!product.tryOnEnabled || busy}
            onClick={() => {
              if (!getCustomerToken()) {
                window.location.href = `/account?redirect=/products/${product.slug}`;
                return;
              }
              setTryOnOpen(true);
            }}
          >
            TRY IT ON
          </Button>
          <Button variant="secondary" type="button" disabled={busy} onClick={() => void toggleWishlist()}>
            {variant && wishIds.includes(variant.id) ? t.wishlistRemove : t.wishlistAdd}
          </Button>
          <Link href="/policies/returns" className="self-center text-sm text-wine hover:underline">
            {t.sizeGuide ?? "Size guide"}
          </Link>
          <a href={waUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" type="button">
              {t.ctaWhatsapp}
            </Button>
          </a>
        </div>
        <TryOnModal
          open={tryOnOpen}
          onClose={() => setTryOnOpen(false)}
          productId={product.id}
          productName={product.name}
          productSlug={product.slug}
          variantId={variant?.id}
          tryOnEnabled={Boolean(product.tryOnEnabled)}
        />
      </div>
      </div>

      <ProductReviews slug={product.slug} />

      <section className="mt-16 border-t border-border pt-12">
        <div className="flex flex-wrap gap-2 border-b border-border pb-3">
          {(
            [
              ["materials", "Materials"],
              ["care", "Care"],
              ["shipping", "Shipping"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`rounded-md px-3 py-2 text-sm ${
                infoTab === key ? "bg-wine text-elevated" : "text-muted hover:text-ink"
              }`}
              onClick={() => setInfoTab(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-6 max-w-2xl text-sm leading-relaxed text-muted">
          {infoTab === "materials" ? (
            <p>
              Soft, breathable fabrics chosen for everyday Indian wear. Exact composition varies by
              style — check the product description for fibre details. Colours may differ slightly
              from screen due to lighting and dye lots.
            </p>
          ) : null}
          {infoTab === "care" ? (
            <p>
              Gentle machine wash cold or hand wash. Do not bleach. Dry in shade. Iron on low heat.
              For embroidered or embellished pieces, turn inside out and use a laundry bag.
            </p>
          ) : null}
          {infoTab === "shipping" ? (
            <p>
              We ship across India with tracked delivery. Free shipping applies above the threshold
              shown at checkout.{" "}
              <Link href="/policies/shipping" className="text-wine hover:underline">
                Full shipping policy
              </Link>
              .
            </p>
          ) : null}
        </div>
      </section>

      {related.length ? (
        <section className="mt-16">
          <ProductCarousel title="You may also like">
            {related.map((p) => (
              <ProductCarouselItem key={p.id}>
                <ProductCardInteractive product={p} />
              </ProductCarouselItem>
            ))}
          </ProductCarousel>
        </section>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-header border-t border-border bg-elevated/95 p-4 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-6xl gap-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            disabled={!product.tryOnEnabled || busy}
            onClick={() => {
              if (!getCustomerToken()) {
                window.location.href = `/account?redirect=/products/${product.slug}`;
                return;
              }
              setTryOnOpen(true);
            }}
          >
            TRY IT ON
          </Button>
          <Button
            className="flex-[2]"
            disabled={!inStock || busy}
            type="button"
            onClick={async () => {
              if (!variant) return;
              if (!getCustomerToken()) {
                window.location.href = "/account";
                return;
              }
              setBusy(true);
              try {
                await apiFetch("/cart/items", {
                  method: "POST",
                  body: JSON.stringify({ variantId: variant.id, qty: 1 }),
                });
              } finally {
                setBusy(false);
              }
            }}
          >
            {t.addToCart}
          </Button>
        </div>
      </div>
    </main>
  );
}
