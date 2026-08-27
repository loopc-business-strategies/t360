const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

const ACCESS_KEY = "t360_customer_token";
const REFRESH_KEY = "t360_customer_refresh";

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
  requestId?: string;
};

type RefreshResult = "ok" | "auth_failed" | "network_failed" | "no_token";

function migrateFromSessionStorage(key: string) {
  if (typeof window === "undefined") return;
  try {
    const legacy = sessionStorage.getItem(key);
    if (legacy && !localStorage.getItem(key)) {
      localStorage.setItem(key, legacy);
    }
    if (legacy) sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function getCustomerToken() {
  if (typeof window === "undefined") return null;
  migrateFromSessionStorage(ACCESS_KEY);
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  migrateFromSessionStorage(REFRESH_KEY);
  return localStorage.getItem(REFRESH_KEY);
}

export function setCustomerTokens(access: string | null, refresh?: string | null) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
  } catch {
    /* ignore */
  }
  if (access) localStorage.setItem(ACCESS_KEY, access);
  else localStorage.removeItem(ACCESS_KEY);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  if (refresh === null) localStorage.removeItem(REFRESH_KEY);
}

export function clearCustomerSession() {
  setCustomerTokens(null, null);
}

function accessTokenExpiresAt(token: string | null): number | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))) as {
      exp?: number;
    };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function accessNearExpiry(token: string | null, withinMs = 2 * 60 * 1000): boolean {
  const exp = accessTokenExpiresAt(token);
  if (exp == null) return false;
  return exp - Date.now() <= withinMs;
}

let refreshInFlight: Promise<RefreshResult> | null = null;

async function tryRefresh(): Promise<RefreshResult> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async (): Promise<RefreshResult> => {
    const refresh = getRefreshToken();
    if (!refresh) return "no_token";
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      let json: {
        success?: boolean;
        data?: { accessToken?: string; refreshToken?: string };
      } = {};
      try {
        json = (await res.json()) as typeof json;
      } catch {
        /* empty */
      }
      if (!res.ok || !json.success || !json.data?.accessToken || !json.data?.refreshToken) {
        return res.status >= 500 || res.status === 0 ? "network_failed" : "auth_failed";
      }
      setCustomerTokens(json.data.accessToken, json.data.refreshToken);
      return "ok";
    } catch {
      return "network_failed";
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

function redirectToLogin() {
  clearCustomerSession();
  if (typeof window === "undefined") return;
  const path = window.location.pathname + window.location.search;
  if (path.startsWith("/account") && !new URLSearchParams(window.location.search).has("session")) {
    const url = new URL(window.location.href);
    url.searchParams.set("session", "expired");
    window.location.assign(url.toString());
    return;
  }
  if (!path.startsWith("/account")) {
    window.location.assign(`/account?redirect=${encodeURIComponent(path)}&session=expired`);
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { auth?: boolean; _retried?: boolean } = {},
): Promise<ApiSuccess<T>> {
  const useAuth = init.auth !== false;
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (useAuth && !init._retried && accessNearExpiry(getCustomerToken())) {
    const proactive = await tryRefresh();
    if (proactive === "auth_failed" || proactive === "no_token") {
      redirectToLogin();
      throw new ApiError("Your session has expired. Please sign in again.", "INVALID_REFRESH", 401);
    }
  }

  if (useAuth) {
    const token = getCustomerToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError("Unable to connect. Please check your internet connection.", "NETWORK");
  }

  let json: {
    success?: boolean;
    error?: { message?: string; code?: string };
    data?: unknown;
  } = {};
  try {
    json = await res.json();
  } catch {
    json = {};
  }

  if (res.status === 401 && useAuth && !init._retried && !path.includes("/auth/refresh")) {
    const result = await tryRefresh();
    if (result === "ok") {
      return apiFetch<T>(path, { ...init, _retried: true });
    }
    if (result === "network_failed") {
      throw new ApiError("Server temporarily unavailable. Please try again.", "NETWORK", 503);
    }
    redirectToLogin();
    throw new ApiError(
      json?.error?.message ?? "Your session has expired. Please sign in again.",
      json?.error?.code ?? "INVALID_REFRESH",
      401,
    );
  }

  if (!res.ok || json.success === false) {
    throw new ApiError(
      json?.error?.message ?? `Request failed (${res.status})`,
      json?.error?.code,
      res.status,
    );
  }
  return json as ApiSuccess<T>;
}

export { API_URL };
