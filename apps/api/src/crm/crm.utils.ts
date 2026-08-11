export function calcCouponDiscount(input: {
  type: "percent" | "fixed" | string;
  value: number;
  subtotal: number;
  minOrder?: number;
}): { ok: true; discount: number } | { ok: false; reason: string } {
  const minOrder = input.minOrder ?? 0;
  if (input.subtotal < minOrder) {
    return { ok: false, reason: `Minimum order ₹${minOrder}` };
  }
  let discount = 0;
  if (input.type === "percent") {
    discount = Math.round(((input.subtotal * input.value) / 100) * 100) / 100;
  } else {
    discount = Math.min(input.value, input.subtotal);
  }
  discount = Math.min(discount, input.subtotal);
  return { ok: true, discount };
}

export function calcLoyaltyRedeem(input: {
  points: number;
  balance: number;
  subtotalAfterCoupon: number;
  valuePerPoint: number;
  maxRedeemPercent: number;
}): { ok: true; pointsUsed: number; discount: number } | { ok: false; reason: string } {
  if (input.points <= 0) return { ok: true, pointsUsed: 0, discount: 0 };
  if (input.points > input.balance) {
    return { ok: false, reason: "Insufficient loyalty points" };
  }
  const maxDiscount = Math.round(((input.subtotalAfterCoupon * input.maxRedeemPercent) / 100) * 100) / 100;
  const requested = Math.round(input.points * input.valuePerPoint * 100) / 100;
  const discount = Math.min(requested, maxDiscount, input.subtotalAfterCoupon);
  const pointsUsed = input.valuePerPoint > 0 ? Math.ceil(discount / input.valuePerPoint) : 0;
  return { ok: true, pointsUsed: Math.min(pointsUsed, input.points), discount };
}

export function calcLoyaltyEarn(orderTotal: number, earnPerRupee: number): number {
  if (earnPerRupee <= 0 || orderTotal <= 0) return 0;
  return Math.floor(orderTotal * earnPerRupee);
}
