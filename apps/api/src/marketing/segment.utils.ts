import type { SegmentRules } from "@t360/validation";

export type CustomerStats = {
  userId: string;
  mobile: string | null;
  orderCount: number;
  spend: number;
};

export function matchesSegmentRules(stats: CustomerStats, rules: SegmentRules): boolean {
  if (rules.minOrders != null && stats.orderCount < rules.minOrders) return false;
  if (rules.minSpend != null && stats.spend < rules.minSpend) return false;
  if (rules.hasMobile === true && !stats.mobile) return false;
  if (rules.hasMobile === false && stats.mobile) return false;
  return true;
}
