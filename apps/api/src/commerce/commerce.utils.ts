export function calcLineTotal(unitPrice: number, qty: number): number {
  return Math.round(unitPrice * qty * 100) / 100;
}

export function calcOrderTotals(input: {
  subtotal: number;
  shippingFee: number;
  tax?: number;
  discount?: number;
}) {
  const tax = input.tax ?? 0;
  const discount = Math.max(0, input.discount ?? 0);
  const total =
    Math.round((Math.max(0, input.subtotal - discount) + input.shippingFee + tax) * 100) / 100;
  return { tax, discount, total };
}

export function shippingFeeForSubtotal(
  subtotal: number,
  fee: number,
  freeAbove: number | null,
): number {
  if (freeAbove != null && subtotal >= freeAbove) return 0;
  return fee;
}

export function generatePickupCode(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return String(n);
}

export function generateOrderNumber(now = new Date()): string {
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const r = Math.floor(1000 + Math.random() * 9000);
  return `TR${y}${m}${d}${r}`;
}
