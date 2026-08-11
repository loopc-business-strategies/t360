const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
  requestId?: string;
};

function getToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("t360_admin_token");
}

export function setAdminToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) sessionStorage.setItem("t360_admin_token", token);
  else sessionStorage.removeItem("t360_admin_token");
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<ApiSuccess<T>> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (init.auth !== false) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json?.error?.message ?? `Request failed (${res.status})`);
  }
  return json as ApiSuccess<T>;
}

export { API_URL };
