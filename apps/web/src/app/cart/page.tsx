"use client";

import * as React from "react";
import Link from "next/link";
import { Button, EmptyState, Input, LoadingState } from "@t360/ui";
import { apiFetch, getCustomerToken } from "../../lib/api";
import { useLocale } from "../../lib/locale";

type Cart = {
  id: string;
  subtotal: number;
  items: Array<{
    id: string;
    qty: number;
    unitPrice: number;
    lineTotal: number;
    variant: { sku: string; product: { name: string; slug: string } };
  }>;
};

export default function CartPage() {
  const { t } = useLocale();
  const [cart, setCart] = React.useState<Cart | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!getCustomerToken()) {
      setCart(null);
      return;
    }
    const res = await apiFetch<Cart>("/cart");
    setCart(res.data);
  }, []);

  React.useEffect(() => {
    void load().catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, [load]);

  if (!getCustomerToken()) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-display text-3xl">{t.navCart}</h1>
        <EmptyState title={t.wishlistLogin} description="" />
        <Link href="/account" className="mt-4 inline-block text-wine hover:underline">
          {t.navAccount}
        </Link>
      </main>
    );
  }

  if (!cart) return <LoadingState label={t.loading} />;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl">{t.navCart}</h1>
      {error ? <p className="mt-2 text-sm text-wine">{error}</p> : null}
      {!cart.items.length ? (
        <div className="mt-8">
          <EmptyState title={t.emptyCart} description={t.emptyDescription} />
          <Link href="/products" className="mt-4 inline-block text-wine hover:underline">
            {t.ctaShop}
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-8 space-y-4">
            {cart.items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
                <div>
                  <Link href={`/products/${item.variant.product.slug}`} className="font-medium text-wine hover:underline">
                    {item.variant.product.name}
                  </Link>
                  <p className="text-sm text-muted">{item.variant.sku}</p>
                  <p className="mt-1">₹{item.lineTotal}</p>
                </div>
                <div className="flex items-end gap-2">
                  <Input
                    label={t.qty}
                    type="number"
                    className="w-20"
                    value={String(item.qty)}
                    onChange={async (e) => {
                      const qty = Number(e.target.value);
                      if (qty < 1) return;
                      await apiFetch(`/cart/items/${item.id}`, {
                        method: "PATCH",
                        body: JSON.stringify({ qty }),
                      });
                      await load();
                    }}
                  />
                  <Button
                    variant="outline"
                    type="button"
                    onClick={async () => {
                      await apiFetch(`/cart/items/${item.id}`, { method: "DELETE" });
                      await load();
                    }}
                  >
                    {t.remove}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <p className="text-lg font-medium">
              {t.orderTotal}: ₹{cart.subtotal}
            </p>
            <Link href="/checkout">
              <Button>{t.checkout}</Button>
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
