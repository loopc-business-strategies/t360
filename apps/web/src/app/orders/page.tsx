"use client";

import * as React from "react";
import Link from "next/link";
import { Badge, EmptyState, LoadingState } from "@t360/ui";
import { apiFetch, getCustomerToken } from "../../lib/api";
import { useLocale } from "../../lib/locale";

type Order = {
  id: string;
  number: string;
  status: string;
  total: string | number;
  createdAt: string;
};

export default function OrdersPage() {
  const { t } = useLocale();
  const [orders, setOrders] = React.useState<Order[] | null>(null);

  React.useEffect(() => {
    if (!getCustomerToken()) {
      setOrders([]);
      return;
    }
    void apiFetch<Order[]>("/orders")
      .then((res) => setOrders(res.data))
      .catch(() => setOrders([]));
  }, []);

  if (!getCustomerToken()) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-display text-3xl">{t.navOrders}</h1>
        <Link href="/account" className="mt-4 inline-block text-wine hover:underline">
          {t.navAccount}
        </Link>
      </main>
    );
  }

  if (!orders) return <LoadingState label={t.loading} />;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl">{t.navOrders}</h1>
      {!orders.length ? <EmptyState title="No orders yet" description={t.emptyDescription} /> : null}
      <ul className="mt-8 space-y-3">
        {orders.map((o) => (
          <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
            <Link href={`/orders/${o.id}`} className="font-medium text-wine hover:underline">
              {o.number}
            </Link>
            <Badge tone="neutral">{o.status}</Badge>
            <span>₹{o.total}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
