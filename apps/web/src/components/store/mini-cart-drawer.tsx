"use client";

import * as React from "react";
import Link from "next/link";
import { Button, Drawer } from "@t360/ui";
import { apiFetch, getCustomerToken } from "../../lib/api";

type CartItem = {
  id: string;
  qty: number;
  lineTotal: number;
  variant: { sku: string; product: { name: string; slug: string } };
};

export function MiniCartDrawer({
  open,
  onOpenChange,
  title = "Your bag",
  emptyLabel = "Your cart is empty",
  checkoutLabel = "Checkout",
  viewBagLabel = "View bag",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  emptyLabel?: string;
  checkoutLabel?: string;
  viewBagLabel?: string;
}) {
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = React.useState(0);

  React.useEffect(() => {
    if (!open || !getCustomerToken()) {
      setItems([]);
      setSubtotal(0);
      return;
    }
    void apiFetch<{ items: CartItem[]; subtotal: number }>("/cart")
      .then((res) => {
        setItems(res.data.items ?? []);
        setSubtotal(res.data.subtotal ?? 0);
      })
      .catch(() => {
        setItems([]);
        setSubtotal(0);
      });
  }, [open]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} title={title}>
      {!getCustomerToken() ? (
        <p className="text-sm text-muted">
          <Link href="/account" className="text-wine hover:underline">
            Sign in
          </Link>{" "}
          to view your bag.
        </p>
      ) : !items.length ? (
        <p className="text-sm text-muted">{emptyLabel}</p>
      ) : (
        <>
          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.id} className="border-b border-border pb-3">
                <Link
                  href={`/products/${item.variant.product.slug}`}
                  className="font-medium text-wine hover:underline"
                  onClick={() => onOpenChange(false)}
                >
                  {item.variant.product.name}
                </Link>
                <p className="text-xs text-muted">{item.variant.sku}</p>
                <p className="mt-1 text-sm">
                  Qty {item.qty} · ₹{item.lineTotal}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-4 font-medium">Subtotal · ₹{subtotal}</p>
        </>
      )}
      <div className="mt-6 flex flex-col gap-2">
        <Link href="/cart" onClick={() => onOpenChange(false)}>
          <Button variant="outline" className="w-full">
            {viewBagLabel}
          </Button>
        </Link>
        <Link href="/checkout" onClick={() => onOpenChange(false)}>
          <Button className="w-full" disabled={!items.length}>
            {checkoutLabel}
          </Button>
        </Link>
      </div>
    </Drawer>
  );
}
