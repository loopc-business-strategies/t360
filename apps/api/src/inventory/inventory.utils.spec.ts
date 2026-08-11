import { availableQty, isLowStock, reservationExpired } from "./inventory.utils";

describe("inventory.utils", () => {
  it("computes available qty", () => {
    expect(availableQty(10, 3)).toBe(7);
    expect(availableQty(2, 5)).toBe(0);
  });

  it("detects low stock", () => {
    expect(isLowStock(6, 1, 5)).toBe(true);
    expect(isLowStock(20, 0, 5)).toBe(false);
  });

  it("detects reservation expiry", () => {
    expect(reservationExpired(new Date(Date.now() - 1000))).toBe(true);
    expect(reservationExpired(new Date(Date.now() + 60_000))).toBe(false);
  });
});
