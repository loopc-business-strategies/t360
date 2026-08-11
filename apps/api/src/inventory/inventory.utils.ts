export function availableQty(physicalQty: number, reservedQty: number): number {
  return Math.max(0, physicalQty - reservedQty);
}

export function isLowStock(
  physicalQty: number,
  reservedQty: number,
  threshold: number,
): boolean {
  return availableQty(physicalQty, reservedQty) <= threshold;
}

export function reservationExpired(expiresAt: Date, now = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}
