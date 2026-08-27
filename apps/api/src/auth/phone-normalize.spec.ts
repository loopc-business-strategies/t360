import { normalizeIndianMobile } from "@t360/validation";

describe("normalizeIndianMobile", () => {
  it("prepends +91 for 10-digit numbers", () => {
    expect(normalizeIndianMobile("9876543210")).toBe("+919876543210");
  });

  it("normalizes 91-prefixed and spaced forms", () => {
    expect(normalizeIndianMobile("919876543210")).toBe("+919876543210");
    expect(normalizeIndianMobile("+91 98765 43210")).toBe("+919876543210");
  });

  it("keeps valid E.164", () => {
    expect(normalizeIndianMobile("+919876543210")).toBe("+919876543210");
  });
});
