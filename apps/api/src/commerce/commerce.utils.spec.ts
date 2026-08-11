import {
  calcLineTotal,
  calcOrderTotals,
  generateOrderNumber,
  generatePickupCode,
  shippingFeeForSubtotal,
} from "./commerce.utils";

describe("commerce.utils", () => {
  it("calculates line and order totals", () => {
    expect(calcLineTotal(199.5, 2)).toBe(399);
    expect(calcOrderTotals({ subtotal: 399, shippingFee: 49 }).total).toBe(448);
    expect(calcOrderTotals({ subtotal: 500, shippingFee: 49, discount: 100 }).total).toBe(449);
    expect(calcOrderTotals({ subtotal: 50, shippingFee: 0, discount: 80 }).total).toBe(0);
  });

  it("applies free shipping threshold", () => {
    expect(shippingFeeForSubtotal(500, 49, 999)).toBe(49);
    expect(shippingFeeForSubtotal(1000, 49, 999)).toBe(0);
  });

  it("generates pickup code and order number", () => {
    expect(generatePickupCode()).toMatch(/^\d{6}$/);
    expect(generateOrderNumber(new Date("2026-08-11T00:00:00Z"))).toMatch(/^TR260811\d{4}$/);
  });
});
