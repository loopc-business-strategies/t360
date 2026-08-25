"use client";

import * as React from "react";
import Link from "next/link";
import { Button, Price, ProductGallery, Badge, Select } from "@t360/ui";
import type { Branch, ProductDetail } from "../lib/catalog-api";
import { API_URL, SITE_URL, productPrice } from "../lib/catalog-api";
import { apiFetch, getCustomerToken } from "../lib/api";
import { useLocale } from "../lib/locale";
import { buildWhatsAppEnquiryUrl } from "../lib/whatsapp";
import { TryOnModal } from "./try-on/try-on-modal";

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
      window.location.href = "/account";
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
    <main className="mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-2">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div>
        <Link href="/products" className="text-sm text-wine hover:underline">
          ← {t.navProducts}
        </Link>
        <div className="mt-4">
          <ProductGallery
            images={
              (product.images ?? []).length
                ? (product.images ?? []).map((img) => ({
                    src: img.url,
                    alt: img.alt || product.name,
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
      <div>
        {product.brand?.name ? (
          <p className="text-xs uppercase tracking-wide text-muted">{product.brand.name}</p>
        ) : null}
        <h1 className="mt-2 font-display text-4xl">{product.name}</h1>
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

        <div className="mt-8 flex flex-wrap gap-3">
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
          <span title={product.tryOnEnabled ? undefined : t.tryMeUnavailable}>
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
              {t.tryMe}
            </Button>
          </span>
          <Button variant="secondary" type="button" disabled={busy} onClick={() => void toggleWishlist()}>
            {variant && wishIds.includes(variant.id) ? t.wishlistRemove : t.wishlistAdd}
          </Button>
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
    </main>
  );
}
