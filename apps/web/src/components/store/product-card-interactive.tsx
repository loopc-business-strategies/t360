"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductCard, Button } from "@t360/ui";
import { apiFetch, getCustomerToken } from "../../lib/api";
import type { ProductListItem } from "../../lib/catalog-api";
import { productPrice } from "../../lib/catalog-api";
import { useLocale } from "../../lib/locale";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80";

export function ProductCardInteractive({ product }: { product: ProductListItem }) {
  const { t } = useLocale();
  const router = useRouter();
  const price = productPrice(product);
  const inStock = product.inStock ?? (product.availableQty ?? 0) > 0;
  const variantId = product.variants?.[0]?.id;
  const [wishIds, setWishIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!getCustomerToken()) return;
    void apiFetch<Array<{ variantId: string }>>("/wishlist")
      .then((res) => setWishIds(res.data.map((i) => i.variantId)))
      .catch(() => undefined);
  }, []);

  async function quickAdd() {
    if (!variantId || !inStock) return;
    if (!getCustomerToken()) {
      router.push(`/account?redirect=/products/${product.slug}`);
      return;
    }
    const multi = (product.variants?.length ?? 0) > 1;
    if (multi) {
      router.push(`/products/${product.slug}`);
      return;
    }
    await apiFetch("/cart/items", {
      method: "POST",
      body: JSON.stringify({ variantId, qty: 1 }),
    });
  }

  async function toggleWishlist() {
    if (!variantId) return;
    if (!getCustomerToken()) {
      router.push(`/account?redirect=/products/${product.slug}`);
      return;
    }
    if (wishIds.includes(variantId)) {
      await apiFetch(`/wishlist/${variantId}`, { method: "DELETE" });
      setWishIds((ids) => ids.filter((id) => id !== variantId));
    } else {
      await apiFetch("/wishlist", {
        method: "POST",
        body: JSON.stringify({ variantId }),
      });
      setWishIds((ids) => [...ids, variantId]);
    }
  }

  return (
    <Link href={`/products/${product.slug}`} className="block">
      <ProductCard
        name={product.name}
        brand={product.brand?.name}
        imageUrl={product.images?.[0]?.url ?? PLACEHOLDER}
        secondImageUrl={product.images?.[1]?.url}
        imageAlt={product.name}
        price={price.amount}
        compareAt={price.compareAt}
        addToCartLabel={inStock ? t.addToCart : t.outOfStock}
        quickAddLabel={t.quickAdd ?? "Quick add"}
        onQuickAdd={inStock ? () => void quickAdd() : undefined}
        tryOnEnabled={Boolean((product as ProductListItem & { tryOnEnabled?: boolean }).tryOnEnabled)}
        tryMeLabel={t.tryMe}
        onTryMe={() => router.push(`/products/${product.slug}?tryOn=1`)}
        wishlisted={variantId ? wishIds.includes(variantId) : false}
        wishlistLabel={t.wishlistAdd}
        onWishlistToggle={() => void toggleWishlist()}
      />
      <p className={`mt-2 text-xs ${inStock ? "text-teal" : "text-muted"}`}>
        {inStock ? t.inStock : t.outOfStock}
      </p>
    </Link>
  );
}

export function QuickAddModal({
  product,
  open,
  onClose,
}: {
  product: ProductListItem;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useLocale();
  const [selected, setSelected] = React.useState(product.variants?.[0]?.id);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-modal flex items-end justify-center bg-ink/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-lg border border-border bg-elevated p-6 shadow-soft">
        <h3 className="font-display text-xl">{product.name}</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {(product.variants ?? []).map((v) => (
            <button
              key={v.id}
              type="button"
              className={`rounded-md border px-3 py-2 text-sm ${
                selected === v.id ? "border-wine text-wine" : "border-border"
              }`}
              onClick={() => setSelected(v.id)}
            >
              {v.attributes?.size ?? v.sku}
            </button>
          ))}
        </div>
        <div className="mt-6 flex gap-2">
          <Button
            className="flex-1"
            disabled={!selected}
            onClick={async () => {
              if (!selected) return;
              await apiFetch("/cart/items", {
                method: "POST",
                body: JSON.stringify({ variantId: selected, qty: 1 }),
              });
              onClose();
            }}
          >
            {t.addToCart}
          </Button>
          <Button variant="outline" onClick={onClose}>
            {t.tryMeCancel ?? "Cancel"}
          </Button>
        </div>
      </div>
    </div>
  );
}
