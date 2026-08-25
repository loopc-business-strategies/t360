"use client";

import * as React from "react";
import Link from "next/link";
import { Badge, Button, Input, LoadingState } from "@t360/ui";
import { apiFetch, getCustomerToken, getRefreshToken, setCustomerTokens } from "../../lib/api";
import { useLocale } from "../../lib/locale";

type Profile = {
  id: string;
  name: string | null;
  gender: string | null;
  mobile?: string | null;
};

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
  const { t } = useLocale();
  const [ready, setReady] = React.useState(false);
  const [token, setToken] = React.useState<string | null>(null);
  const [mobile, setMobile] = React.useState("+91");
  const [otp, setOtp] = React.useState("");
  const [otpSent, setOtpSent] = React.useState(false);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [name, setName] = React.useState("");
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
    const tkn = getCustomerToken();
    setToken(tkn);
    setReady(true);
    if (tkn) {
      void loadAccount().catch((e) => setError(e instanceof Error ? e.message : "Failed"));
    }
  }, [loadAccount]);

  async function requestOtp() {
    setBusy(true);
    setError(null);
    try {
      await apiFetch("/auth/otp/request", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ mobile }),
      });
      setOtpSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "OTP failed");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch<{ accessToken: string; refreshToken: string }>("/auth/otp/verify", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ mobile, code: otp }),
      });
      setCustomerTokens(res.data.accessToken, res.data.refreshToken);
      setToken(res.data.accessToken);
      await loadAccount();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verify failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile() {
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch<Profile>("/customers/me", {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
      setProfile(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
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
          {error ? <p className="text-sm text-wine">{error}</p> : null}
          {!otpSent ? (
            <Button type="button" disabled={busy} onClick={() => void requestOtp()}>
              {t.requestOtp}
            </Button>
          ) : (
            <Button type="button" disabled={busy} onClick={() => void verifyOtp()}>
              {t.verifyOtp}
            </Button>
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
                  body: JSON.stringify({ refreshToken: refresh }),
                });
              } catch {
                /* ignore */
              }
            }
            setCustomerTokens(null, null);
            setToken(null);
            setProfile(null);
          }}
        >
          {t.logout}
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
