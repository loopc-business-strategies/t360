import { matchesSegmentRules, type CustomerStats } from "./segment.utils";

describe("segment.utils", () => {
  const base: CustomerStats = {
    userId: "u1",
    mobile: "+919876543210",
    orderCount: 3,
    spend: 2500,
  };

  it("matches minOrders and minSpend", () => {
    expect(matchesSegmentRules(base, { minOrders: 2, minSpend: 1000 })).toBe(true);
    expect(matchesSegmentRules(base, { minOrders: 5 })).toBe(false);
    expect(matchesSegmentRules(base, { minSpend: 5000 })).toBe(false);
  });

  it("matches hasMobile", () => {
    expect(matchesSegmentRules(base, { hasMobile: true })).toBe(true);
    expect(matchesSegmentRules({ ...base, mobile: null }, { hasMobile: true })).toBe(false);
    expect(matchesSegmentRules({ ...base, mobile: null }, { hasMobile: false })).toBe(true);
  });
});
