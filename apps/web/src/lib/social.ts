/** Placeholder used in .env.example — treated as unset. */
export const WHATSAPP_PLACEHOLDER_E164 = "919876543210";

/** Public Tharagai Readymades contacts (Pudukkottai). Override via env. */
export const DEFAULT_WHATSAPP_E164 = "917373725604";
export const DEFAULT_INSTAGRAM_URL =
  "https://www.instagram.com/tharagai_readymades/";

export function getWhatsAppE164(): string | null {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_E164?.trim();
  const source =
    !raw || raw === WHATSAPP_PLACEHOLDER_E164 ? DEFAULT_WHATSAPP_E164 : raw;
  const digits = source.replace(/\D/g, "");
  return digits.length >= 10 ? digits : null;
}

export function getInstagramUrl(): string | null {
  const raw =
    process.env.NEXT_PUBLIC_INSTAGRAM_URL?.trim() ||
    process.env.NEXT_PUBLIC_STOREFRONT_INSTAGRAM_URL?.trim();
  const source = raw || DEFAULT_INSTAGRAM_URL;
  try {
    const u = new URL(source);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}
