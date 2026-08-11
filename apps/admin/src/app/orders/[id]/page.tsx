"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Input, LoadingState, Select } from "@t360/ui";
import { apiFetch } from "../../../lib/api";

type OrderDetail = {
  id: string;
  number: string;
  status: string;
  fulfillment: string;
  total: string | number;
  pickupCode?: string | null;
  pickupVerifiedAt?: string | null;
  items: Array<{ name: string; sku: string; qty: number; lineTotal: string | number }>;
  events: Array<{ toStatus: string; note?: string | null }>;
};

const STATUSES = [
  "Confirmed",
  "Processing",
  "Packed",
  "ReadyForPickup",
  "OutForDelivery",
  "Delivered",
  "Returned",
  "Cancelled",
];

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [status, setStatus] = React.useState("");
  const [pickupCode, setPickupCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const query = useQuery({
    queryKey: ["admin-order", params.id],
    queryFn: async () => {
      const res = await apiFetch<OrderDetail>(`/admin/orders/${params.id}`);
      setStatus(res.data.status);
      return res;
    },
  });

  const updateStatus = useMutation({
    mutationFn: () =>
      apiFetch(`/admin/orders/${params.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: async () => {
      setError(null);
      await qc.invalidateQueries({ queryKey: ["admin-order", params.id] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const verify = useMutation({
    mutationFn: () =>
      apiFetch(`/admin/orders/${params.id}/pickup/verify`, {
        method: "POST",
        body: JSON.stringify({ pickupCode }),
      }),
    onSuccess: async () => {
      setError(null);
      await qc.invalidateQueries({ queryKey: ["admin-order", params.id] });
    },
    onError: (e: Error) => setError(e.message),
  });

  if (query.isLoading || !query.data) return <LoadingState label="Loading order…" />;
  const order = query.data.data;

  return (
    <div className="space-y-6">
      <Link href="/orders" className="text-sm text-wine hover:underline">
        ← Orders
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl">{order.number}</h1>
        <Badge tone="brass">{order.status}</Badge>
        <Badge tone="neutral">{order.fulfillment}</Badge>
      </div>
      {error ? <p className="text-sm text-wine">{error}</p> : null}
      <p className="text-lg">Total ₹{order.total}</p>
      <ul className="space-y-1 text-sm">
        {order.items.map((i, idx) => (
          <li key={idx}>
            {i.name} ({i.sku}) × {i.qty} — ₹{i.lineTotal}
          </li>
        ))}
      </ul>

      <div className="flex max-w-md flex-wrap items-end gap-3">
        <Select
          label="Status"
          value={status}
          onValueChange={setStatus}
          options={STATUSES.map((s) => ({ value: s, label: s }))}
        />
        <Button type="button" onClick={() => updateStatus.mutate()} disabled={updateStatus.isPending}>
          Update status
        </Button>
      </div>

      {order.fulfillment === "PICKUP" && !order.pickupVerifiedAt ? (
        <div className="flex max-w-md flex-wrap items-end gap-3">
          <Input
            label="Pickup code"
            value={pickupCode}
            onChange={(e) => setPickupCode(e.target.value)}
            placeholder={order.pickupCode ?? ""}
          />
          <Button type="button" onClick={() => verify.mutate()} disabled={verify.isPending}>
            Verify pickup
          </Button>
        </div>
      ) : null}

      <div>
        <h2 className="font-display text-xl">Timeline</h2>
        <ul className="mt-2 space-y-1 text-sm text-muted">
          {order.events.map((e, idx) => (
            <li key={idx}>
              {e.toStatus}
              {e.note ? ` — ${e.note}` : ""}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
