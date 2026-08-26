/** Normalize Indian mobile input to E.164 `+91XXXXXXXXXX`. */
export function normalizeIndianMobile(raw: string): string {
  let s = raw.trim().replace(/[\s\-()]/g, "");
  if (s.startsWith("00")) s = `+${s.slice(2)}`;
  if (/^\d{10}$/.test(s) && /^[6-9]/.test(s)) return `+91${s}`;
  if (/^91[6-9]\d{9}$/.test(s)) return `+${s}`;
  if (s.startsWith("+91") && s.length === 13) return s;
  return s;
}
