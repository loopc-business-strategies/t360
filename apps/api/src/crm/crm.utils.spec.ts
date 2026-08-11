import { calcCouponDiscount, calcLoyaltyEarn, calcLoyaltyRedeem } from "./crm.utils";

describe("crm.utils", () => {
  it("calculates percent and fixed coupon discounts", () => {
    const percent = calcCouponDiscount({ type: "percent", value: 10, subtotal: 1000 });
    const fixed = calcCouponDiscount({ type: "fixed", value: 150, subtotal: 100 });
    expect(percent.ok).toBe(true);
    expect(fixed.ok).toBe(true);
    if (percent.ok) expect(percent.discount).toBe(100);
    if (fixed.ok) expect(fixed.discount).toBe(100);
    expect(calcCouponDiscount({ type: "fixed", value: 50, subtotal: 40, minOrder: 100 }).ok).toBe(
      false,
    );
  });

  it("caps loyalty redeem by percent and balance", () => {
    const r = calcLoyaltyRedeem({
      points: 1000,
      balance: 1000,
      subtotalAfterCoupon: 500,
      valuePerPoint: 0.25,
      maxRedeemPercent: 20,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.discount).toBe(100);
      expect(r.pointsUsed).toBe(400);
    }
  });

  it("earns loyalty points", () => {
    expect(calcLoyaltyEarn(999.5, 1)).toBe(999);
  });
});
