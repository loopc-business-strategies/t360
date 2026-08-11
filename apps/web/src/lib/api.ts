const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

const TOKEN_KEY = "t360_customer_token";
const REFRESH_KEY = "t360_customer_refresh";

export function getCustomerToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setCustomerTokens(access: string | null, refresh?: string | null) {
  if (typeof window === "undefined") return;
  if (access) sessionStorage.setItem(TOKEN_KEY, access);
  else sessionStorage.removeItem(TOKEN_KEY);
  if (refresh) sessionStorage.setItem(REFRESH_KEY, refresh);
  if (refresh === null) sessionStorage.removeItem(REFRESH_KEY);
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(REFRESH_KEY);
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<{ success: true; data: T; meta?: Record<string, unknown> }> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  if (init.auth !== false) {
    const token = getCustomerToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json?.error?.message ?? `Request failed (${res.status})`);
  }
  return json;
}

export { API_URL };
