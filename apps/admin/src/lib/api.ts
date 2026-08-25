const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
  requestId?: string;
};

const ACCESS_KEY = "t360_admin_token";
const REFRESH_KEY = "t360_admin_refresh";

/** Refresh outcome: auth failures clear session; network blips keep tokens. */
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
    /* ignore quota / private mode */
  }
}

export function getAdminToken() {
  if (typeof window === "undefined") return null;
  migrateFromSessionStorage(ACCESS_KEY);
  return localStorage.getItem(ACCESS_KEY);
}

export function getAdminRefreshToken() {
  if (typeof window === "undefined") return null;
  migrateFromSessionStorage(REFRESH_KEY);
  return localStorage.getItem(REFRESH_KEY);
}

export function setAdminToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(ACCESS_KEY);
  } catch {
    /* ignore */
  }
  if (token) localStorage.setItem(ACCESS_KEY, token);
  else localStorage.removeItem(ACCESS_KEY);
}

export function setAdminRefreshToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(REFRESH_KEY);
  } catch {
    /* ignore */
  }
  if (token) localStorage.setItem(REFRESH_KEY, token);
  else localStorage.removeItem(REFRESH_KEY);
}

export function clearAdminSession() {
  setAdminToken(null);
  setAdminRefreshToken(null);
}

/** Decode JWT exp (seconds) without verifying signature. */
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
    const refresh = getAdminRefreshToken();
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
        /* empty body */
      }
      if (!res.ok || !json.success || !json.data?.accessToken || !json.data?.refreshToken) {
        return res.status >= 500 || res.status === 0 ? "network_failed" : "auth_failed";
      }
      setAdminToken(json.data.accessToken);
      setAdminRefreshToken(json.data.refreshToken);
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
  clearAdminSession();
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    window.location.assign("/login");
  }
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

  if (useAuth && !init._retried && accessNearExpiry(getAdminToken())) {
    const proactive = await tryRefresh();
    if (proactive === "auth_failed" || proactive === "no_token") {
      redirectToLogin();
      throw new Error("Session expired. Please sign in again.");
    }
  }

  if (useAuth) {
    const token = getAdminToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const refresh = getAdminRefreshToken();
    if (refresh) headers.set("x-refresh-token", refresh);
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new Error("Network error — check your connection and try again.");
  }

  let json: { success?: boolean; error?: { message?: string } } = {};
  try {
    json = await res.json();
  } catch {
    json = {};
  }

  if (res.status === 401 && useAuth && !init._retried) {
    const result = await tryRefresh();
    if (result === "ok") {
      return apiFetch<T>(path, { ...init, _retried: true });
    }
    if (result === "network_failed") {
      throw new Error("Server temporarily unavailable. Please try again.");
    }
    redirectToLogin();
    throw new Error(json?.error?.message ?? "Session expired. Please sign in again.");
  }

  if (!res.ok || json.success === false) {
    throw new Error(json?.error?.message ?? `Request failed (${res.status})`);
  }
  return json as ApiSuccess<T>;
}

export { API_URL };
