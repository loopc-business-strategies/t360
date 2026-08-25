const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
  requestId?: string;
};

const ACCESS_KEY = "t360_admin_token";
const REFRESH_KEY = "t360_admin_refresh";

export function getAdminToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ACCESS_KEY);
}

export function getAdminRefreshToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(REFRESH_KEY);
}

export function setAdminToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) sessionStorage.setItem(ACCESS_KEY, token);
  else sessionStorage.removeItem(ACCESS_KEY);
}

export function setAdminRefreshToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) sessionStorage.setItem(REFRESH_KEY, token);
  else sessionStorage.removeItem(REFRESH_KEY);
}

export function clearAdminSession() {
  setAdminToken(null);
  setAdminRefreshToken(null);
}

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const refresh = getAdminRefreshToken();
    if (!refresh) return false;
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: { accessToken?: string; refreshToken?: string };
      };
      if (!res.ok || !json.success || !json.data?.accessToken || !json.data?.refreshToken) {
        return false;
      }
      setAdminToken(json.data.accessToken);
      setAdminRefreshToken(json.data.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { auth?: boolean; _retried?: boolean } = {},
): Promise<ApiSuccess<T>> {
  const useAuth = init.auth !== false;
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (useAuth) {
    const token = getAdminToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const refresh = getAdminRefreshToken();
    if (refresh) headers.set("x-refresh-token", refresh);
  }
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  let json: { success?: boolean; error?: { message?: string } } = {};
  try {
    json = await res.json();
  } catch {
    json = {};
  }
  if (res.status === 401 && useAuth && !init._retried) {
    const ok = await tryRefresh();
    if (ok) {
      return apiFetch<T>(path, { ...init, _retried: true });
    }
    clearAdminSession();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.assign("/login");
    }
  }
  if (!res.ok || json.success === false) {
    throw new Error(json?.error?.message ?? `Request failed (${res.status})`);
  }
  return json as ApiSuccess<T>;
}

export { API_URL };
