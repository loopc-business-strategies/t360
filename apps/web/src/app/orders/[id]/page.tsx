"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge, Button, LoadingState } from "@t360/ui";
import { apiFetch, getCustomerToken } from "../../../lib/api";
import { useLocale } from "../../../lib/locale";

type OrderDetail = {
  id: string;
  number: string;
  status: string;
  total: string | number;
  fulfillment: string;
  pickupCode?: string | null;
  items: Array<{ name: string; sku: string; qty: number; lineTotal: string | number }>;
  events: Array<{ toStatus: string; note?: string | null; createdAt: string }>;
};

export default function OrderDetailPage() {
  const { t } = useLocale();
  const params = useParams<{ id: string }>();
  const [order, setOrder] = React.useState<OrderDetail | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const res = await apiFetch<OrderDetail>(`/orders/${params.id}`);
    setOrder(res.data);
  }, [params.id]);

  React.useEffect(() => {
    if (!getCustomerToken()) return;
    void load().catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, [load]);

  if (!order) return <LoadingState label={t.loading} />;

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-12">
      <Link href="/orders" className="text-sm text-wine hover:underline">
        ← {t.navOrders}
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl">{order.number}</h1>
        <Badge tone="brass">{order.status}</Badge>
      </div>
      {error ? <p className="text-sm text-wine">{error}</p> : null}
      {order.pickupCode ? (
        <p className="text-sm">
          {t.pickupCode}: <strong>{order.pickupCode}</strong>
        </p>
      ) : null}
      <p className="text-lg">
        {t.orderTotal}: ₹{order.total}
      </p>
      <ul className="space-y-2">
        {order.items.map((i, idx) => (
          <li key={idx} className="text-sm">
            {i.name} ({i.sku}) × {i.qty} — ₹{i.lineTotal}
          </li>
        ))}
      </ul>
      <div>
        <h2 className="font-display text-xl">{t.orderStatus}</h2>
        <ul className="mt-2 space-y-1 text-sm text-muted">
          {order.events.map((e, idx) => (
            <li key={idx}>
              {e.toStatus}
              {e.note ? ` — ${e.note}` : ""}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-wrap gap-2">
        {order.status === "PaymentPending" ? (
          <Button
            variant="outline"
            type="button"
            onClick={async () => {
              await apiFetch(`/orders/${order.id}/cancel`, { method: "POST" });
              await load();
            }}
          >
            {t.cancelOrder}
          </Button>
        ) : null}
        {order.status === "Delivered" ? (
          <Button
            variant="outline"
            type="button"
            onClick={async () => {
              await apiFetch(`/orders/${order.id}/return`, { method: "POST" });
              await load();
            }}
          >
            {t.returnOrder}
          </Button>
        ) : null}
      </div>
    </main>
  );
}
