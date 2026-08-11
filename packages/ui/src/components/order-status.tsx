import * as React from "react";
import { Badge, type BadgeTone } from "./badge";

export type OrderStatusCode =
  | "pending"
  | "confirmed"
  | "processing"
  | "packed"
  | "ready_for_pickup"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "refunded";

const toneMap: Record<OrderStatusCode, BadgeTone> = {
  pending: "brass",
  confirmed: "teal",
  processing: "teal",
  packed: "wine",
  ready_for_pickup: "wine",
  out_for_delivery: "teal",
  delivered: "success",
  cancelled: "danger",
  refunded: "neutral",
};

export function OrderStatus({
  status,
  label,
}: {
  status: OrderStatusCode;
  label: string;
}) {
  return <Badge tone={toneMap[status]}>{label}</Badge>;
}
