"use client";

import * as React from "react";
import Link from "next/link";
import { Badge, Button, EmptyState, LoadingState } from "@t360/ui";
import { apiFetch, getCustomerToken } from "../../lib/api";
import { useLocale } from "../../lib/locale";

type WishItem = {
  id: string;
  variantId: string;
  variant: {
    id: string;
    sku: string;
    price: string | number;
    salePrice?: string | number | null;
    product: {
      name: string;
      slug: string;
    };
  };
};

export default function WishlistPage() {
  const { t } = useLocale();
  const [authed, setAuthed] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  const [items, setItems] = React.useState<WishItem[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!getCustomerToken()) {
      setItems([]);
      return;
    }
    const res = await apiFetch<WishItem[]>("/wishlist");
    setItems(res.data);
  }, []);

  React.useEffect(() => {
    setAuthed(Boolean(getCustomerToken()));
    setReady(true);
    void load().catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, [load]);

  if (!ready) return <LoadingState label={t.loading} />;

  if (!authed) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-display text-3xl">{t.navWishlist}</h1>
        <div className="mt-6">
          <EmptyState title={t.wishlistLogin} description="" />
        </div>
        <Link href="/account?redirect=/wishlist" className="mt-4 inline-block text-wine hover:underline">
          {t.navAccount}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl">{t.navWishlist}</h1>
      {error ? <p className="mt-4 text-sm text-wine">{error}</p> : null}
      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyState title={t.wishlistEmpty} description={t.emptyDescription} />
        </div>
      ) : null}
      <ul className="mt-8 space-y-4">
        {items.map((item) => {
          const amount = Number(item.variant.salePrice ?? item.variant.price);
          return (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4"
            >
              <div>
                <Link
                  href={`/products/${item.variant.product.slug}`}
                  className="font-medium text-wine hover:underline"
                >
                  {item.variant.product.name}
                </Link>
                <div className="mt-1 flex gap-2 text-sm text-muted">
                  <Badge tone="brass">{item.variant.sku}</Badge>
                  <span>₹{amount}</span>
                </div>
              </div>
              <Button
                variant="outline"
                type="button"
                onClick={async () => {
                  await apiFetch(`/wishlist/${item.variantId}`, { method: "DELETE" });
                  await load();
                }}
              >
                {t.wishlistRemove}
              </Button>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
