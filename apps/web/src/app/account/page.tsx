"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge, Button, Input, LoadingState } from "@t360/ui";
import { apiFetch, ApiError, clearCustomerSession, getCustomerToken, getRefreshToken, setCustomerTokens } from "../../lib/api";
import { useLocale } from "../../lib/locale";
import { normalizeIndianMobile } from "../../lib/phone";

type Profile = {
  id: string;
  name: string | null;
  gender: string | null;
  mobile?: string | null;
  email?: string | null;
};

function mapAuthError(e: unknown): string {
  if (e instanceof ApiError) {
    switch (e.code) {
      case "INVALID_OTP":
        return "Invalid or expired OTP.";
      case "RATE_LIMITED":
        return "Too many attempts. Please try again later.";
      case "NETWORK":
        return e.message;
      case "INVALID_REFRESH":
        return "Your session has expired. Please sign in again.";
      default:
        return e.message;
    }
  }
  if (e instanceof Error) return e.message;
  return "Something went wrong";
}

type Address = {
  id: string;
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

export default function AccountPage() {
  return (
    <React.Suspense fallback={<LoadingState label="Loading…" />}>
      <AccountPageInner />
    </React.Suspense>
  );
}

function AccountPageInner() {
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = React.useState(false);
  const [token, setToken] = React.useState<string | null>(null);
  const [mobile, setMobile] = React.useState("+91");
  const [otp, setOtp] = React.useState("");
  const [otpSent, setOtpSent] = React.useState(false);
  const [devOtpHint, setDevOtpHint] = React.useState<string | null>(null);
  const [resendIn, setResendIn] = React.useState(0);
  const [needsProfile, setNeedsProfile] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [name, setName] = React.useState("");
  const [sessionBanner, setSessionBanner] = React.useState<string | null>(null);
  const [addresses, setAddresses] = React.useState<Address[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const [addr, setAddr] = React.useState({
    name: "",
    phone: "",
    line1: "",
    city: "Pudukkottai",
    state: "Tamil Nadu",
    pincode: "622001",
  });

  const [loyaltyBalance, setLoyaltyBalance] = React.useState<number | null>(null);
  const [prefs, setPrefs] = React.useState({
    marketingEmail: true,
    marketingSms: true,
    marketingPush: true,
    marketingWhatsapp: true,
  });
  const [inbox, setInbox] = React.useState<
    Array<{ id: string; channel: string; templateCode: string; status: string; createdAt: string }>
  >([]);

  const loadAccount = React.useCallback(async () => {
    const res = await apiFetch<Profile>("/customers/me");
    setProfile(res.data);
    setName(res.data.name ?? "");
    setEmail(res.data.email ?? "");
    if (!res.data.name?.trim()) setNeedsProfile(true);
    const [addrs, loyalty, prefRes, notifRes] = await Promise.all([
      apiFetch<Address[]>("/customers/me/addresses"),
      apiFetch<{ pointsBalance: number }>("/loyalty/me"),
      apiFetch<typeof prefs>("/notifications/me/preferences"),
      apiFetch<typeof inbox>("/notifications/me"),
    ]);
    setAddresses(addrs.data);
    setLoyaltyBalance(loyalty.data.pointsBalance);
    setPrefs({
      marketingEmail: prefRes.data.marketingEmail,
      marketingSms: prefRes.data.marketingSms,
      marketingPush: prefRes.data.marketingPush,
      marketingWhatsapp: prefRes.data.marketingWhatsapp,
    });
    setInbox(notifRes.data);
  }, []);

  React.useEffect(() => {
    if (searchParams.get("session") === "expired") {
      setSessionBanner("Your session has expired. Please sign in again.");
    }
  }, [searchParams]);

  React.useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendIn]);

  React.useEffect(() => {
    const tkn = getCustomerToken();
    setToken(tkn);
    setReady(true);
    if (tkn) {
      void loadAccount().catch((e) => setError(mapAuthError(e)));
    }
  }, [loadAccount]);

  async function requestOtp() {
    setBusy(true);
    setError(null);
    setDevOtpHint(null);
    try {
      const normalized = normalizeIndianMobile(mobile);
      setMobile(normalized);
      const res = await apiFetch<{ sent: boolean; provider: string; devOtp?: string }>(
        "/auth/otp/request",
        {
          method: "POST",
          auth: false,
          body: JSON.stringify({ mobile: normalized }),
        },
      );
      if (res.data.devOtp) {
        setOtp(res.data.devOtp);
        setDevOtpHint(`Staging code: ${res.data.devOtp}`);
      }
      setOtpSent(true);
      setResendIn(30);
    } catch (e) {
      setError(mapAuthError(e));
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
    setBusy(true);
    setError(null);
    try {
      const normalized = normalizeIndianMobile(mobile);
      setMobile(normalized);
      const res = await apiFetch<{
        accessToken: string;
        refreshToken: string;
        isNewCustomer?: boolean;
      }>("/auth/otp/verify", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ mobile: normalized, code: otp }),
      });
      setCustomerTokens(res.data.accessToken, res.data.refreshToken);
      setToken(res.data.accessToken);
      setSessionBanner(null);
      if (res.data.isNewCustomer) setNeedsProfile(true);
      const redirect = searchParams.get("redirect");
      if (redirect && redirect.startsWith("/") && !res.data.isNewCustomer) {
        router.replace(redirect);
        return;
      }
      await loadAccount();
      if (redirect && redirect.startsWith("/") && !needsProfile) {
        // after loadAccount, if profile already has name, redirect happens below via effect skip
      }
    } catch (e) {
      setError(mapAuthError(e));
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile(opts?: { skip?: boolean }) {
    setBusy(true);
    setError(null);
    try {
      if (!opts?.skip) {
        const res = await apiFetch<Profile>("/customers/me", {
          method: "PATCH",
          body: JSON.stringify({
            name: name.trim() || null,
            email: email.trim() || null,
          }),
        });
        setProfile(res.data);
      }
      setNeedsProfile(false);
      const redirect = searchParams.get("redirect");
      if (redirect && redirect.startsWith("/")) {
        router.replace(redirect);
        return;
      }
      await loadAccount();
    } catch (e) {
      setError(mapAuthError(e));
    } finally {
      setBusy(false);
    }
  }

  async function addAddress() {
    setBusy(true);
    setError(null);
    try {
      await apiFetch("/customers/me/addresses", {
        method: "POST",
        body: JSON.stringify(addr),
      });
      const addrs = await apiFetch<Address[]>("/customers/me/addresses");
      setAddresses(addrs.data);
      setAddr((a) => ({ ...a, line1: "", name: "" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Address failed");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return <LoadingState label={t.loading} />;

  if (!token) {
    return (
      <main className="mx-auto max-w-md px-6 py-12">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">{t.accountBrand}</p>
        <h1 className="mt-3 font-display text-3xl">{t.accountTitle}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{t.accountLogin}</p>
        <p className="mt-2 text-sm text-muted">
          New customer? Your account will be created after OTP verification.
        </p>
        <p className="mt-2 text-xs text-muted">Use +91 and your 10-digit mobile number</p>
        {sessionBanner ? <p className="mt-4 text-sm text-wine">{sessionBanner}</p> : null}
        <div className="mt-8 space-y-4 border border-border bg-elevated p-5">
          <Input label={t.mobile} value={mobile} onChange={(e) => setMobile(e.target.value)} autoComplete="tel" />
          {otpSent ? (
            <Input
              label={t.otp}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              autoComplete="one-time-code"
              inputMode="numeric"
            />
          ) : null}
          {devOtpHint ? (
            <p className="rounded-md border border-border bg-elevated px-3 py-2 text-sm font-medium text-ink">
              {devOtpHint}
            </p>
          ) : null}
          {error ? <p className="text-sm text-wine">{error}</p> : null}
          {!otpSent ? (
            <Button type="button" disabled={busy} onClick={() => void requestOtp()}>
              {t.requestOtp}
            </Button>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={busy} onClick={() => void verifyOtp()}>
                {t.verifyOtp}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy || resendIn > 0}
                onClick={() => void requestOtp()}
              >
                {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend OTP"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                  setDevOtpHint(null);
                  setResendIn(0);
                }}
              >
                Change number
              </Button>
            </div>
          )}
        </div>
        <p className="mt-6 text-xs text-muted">
          <a className="underline underline-offset-2" href="/policies/privacy">
            {t.navPrivacy}
          </a>
          {" · "}
          <a className="underline underline-offset-2" href="/policies/terms">
            {t.navTerms}
          </a>
        </p>
      </main>
    );
  }

  if (needsProfile) {
    return (
      <main className="mx-auto max-w-md space-y-4 px-6 py-12">
        <h1 className="font-display text-3xl">Complete your profile</h1>
        <p className="text-sm text-muted">Optional — you can skip and finish later.</p>
        {error ? <p className="text-sm text-wine">{error}</p> : null}
        <Input label={t.name} value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          label="Email (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <div className="flex gap-2">
          <Button type="button" disabled={busy} onClick={() => void saveProfile()}>
            {t.save}
          </Button>
          <Button type="button" variant="outline" disabled={busy} onClick={() => void saveProfile({ skip: true })}>
            Skip for now
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl space-y-10 px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">{t.accountTitle}</h1>
          <p className="text-sm text-muted">{profile?.mobile}</p>
        </div>
        <Button
          variant="outline"
          type="button"
          onClick={async () => {
            const refresh = getRefreshToken();
            if (refresh) {
              try {
                await apiFetch("/auth/logout", {
                  method: "POST",
                  auth: false,
                  body: JSON.stringify({ refreshToken: refresh }),
                });
              } catch {
                /* ignore */
              }
            }
            clearCustomerSession();
            setToken(null);
            setProfile(null);
          }}
        >
          {t.logout}
        </Button>
        <Button
          variant="outline"
          type="button"
          onClick={async () => {
            try {
              await apiFetch("/auth/logout-all", { method: "POST", body: JSON.stringify({}) });
            } catch {
              /* ignore */
            }
            clearCustomerSession();
            setToken(null);
            setProfile(null);
          }}
        >
          Logout all devices
        </Button>
      </div>

      {error ? <p className="text-sm text-wine">{error}</p> : null}

      <section className="space-y-3">
        <h2 className="font-display text-xl">{t.profile}</h2>
        <p className="text-sm">
          <Link href="/account/try-ons" className="text-wine hover:underline">
            {t.tryMeHistory}
          </Link>
        </p>
        {loyaltyBalance != null ? (
          <p className="text-sm">
            {t.loyaltyBalance}:{" "}
            <span className="font-medium">
              {loyaltyBalance} {t.loyaltyPoints}
            </span>
          </p>
        ) : null}
        <Input label={t.name} value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          label="Email (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <Button type="button" disabled={busy} onClick={() => void saveProfile()}>
          {t.save}
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">{t.notifications}</h2>
        <p className="text-sm text-muted">{t.notificationPrefs}</p>
        {(
          [
            ["marketingEmail", t.prefEmail],
            ["marketingSms", t.prefSms],
            ["marketingPush", t.prefPush],
            ["marketingWhatsapp", t.prefWhatsapp],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={prefs[key]}
              onChange={(e) => {
                const next = { ...prefs, [key]: e.target.checked };
                setPrefs(next);
                void apiFetch("/notifications/me/preferences", {
                  method: "PATCH",
                  body: JSON.stringify({ [key]: e.target.checked }),
                }).catch((err) => setError(err instanceof Error ? err.message : "Prefs failed"));
              }}
            />
            {label}
          </label>
        ))}
        <h3 className="pt-2 text-sm font-medium">{t.recentNotifications}</h3>
        <ul className="space-y-2 text-sm">
          {inbox.length === 0 ? <li className="text-muted">—</li> : null}
          {inbox.slice(0, 10).map((n) => (
            <li key={n.id} className="border border-border bg-elevated px-3 py-2">
              {n.templateCode} · {n.channel} · {n.status}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl">{t.addresses}</h2>
        <ul className="space-y-3">
          {addresses.map((a) => (
            <li key={a.id} className="border border-border bg-elevated p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">
                  {a.label} — {a.name}
                  {a.isDefault ? (
                    <Badge tone="success" className="ml-2">
                      {t.default}
                    </Badge>
                  ) : null}
                </p>
                <Button
                  variant="outline"
                  type="button"
                  onClick={async () => {
                    await apiFetch(`/customers/me/addresses/${a.id}`, { method: "DELETE" });
                    const addrs = await apiFetch<Address[]>("/customers/me/addresses");
                    setAddresses(addrs.data);
                  }}
                >
                  {t.delete}
                </Button>
              </div>
              <p className="mt-2 text-muted">
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ""}
                <br />
                {a.city}, {a.state} {a.pincode}
                <br />
                {a.phone}
              </p>
            </li>
          ))}
        </ul>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label={t.name}
            value={addr.name}
            onChange={(e) => setAddr({ ...addr, name: e.target.value })}
          />
          <Input
            label={t.phone}
            value={addr.phone}
            onChange={(e) => setAddr({ ...addr, phone: e.target.value })}
          />
          <Input
            label={t.line1}
            value={addr.line1}
            onChange={(e) => setAddr({ ...addr, line1: e.target.value })}
            className="sm:col-span-2"
          />
          <Input
            label={t.city}
            value={addr.city}
            onChange={(e) => setAddr({ ...addr, city: e.target.value })}
          />
          <Input
            label={t.state}
            value={addr.state}
            onChange={(e) => setAddr({ ...addr, state: e.target.value })}
          />
          <Input
            label={t.pincode}
            value={addr.pincode}
            onChange={(e) => setAddr({ ...addr, pincode: e.target.value })}
          />
          <Button
            type="button"
            disabled={busy}
            className="sm:col-span-2 sm:w-fit"
            onClick={() => void addAddress()}
          >
            {t.addAddress}
          </Button>
        </div>
      </section>
    </main>
  );
}
