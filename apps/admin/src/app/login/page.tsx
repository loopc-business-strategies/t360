"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input } from "@t360/ui";
import { apiFetch, setAdminToken } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = React.useState("owner@tharagai.local");
  const [password, setPassword] = React.useState("TharagaiOwner!123");
  const [mfaCode, setMfaCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [needsMfa, setNeedsMfa] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const isEmail = loginId.includes("@");
      const res = await apiFetch<{ accessToken: string }>("/auth/login", {
        method: "POST",
        auth: false,
        body: JSON.stringify({
          ...(isEmail ? { email: loginId } : { employeeCode: loginId }),
          password,
          mfaCode: mfaCode || undefined,
        }),
      });
      setAdminToken(res.data.accessToken);
      router.push("/");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      if (/MFA/i.test(msg)) setNeedsMfa(true);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <h1 className="font-display text-2xl">THARAGAI Admin</h1>
        <p className="mt-1 text-sm text-muted">Sign in with email or Admin ID</p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Input
            label="Email or Admin ID"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            autoComplete="username"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {(needsMfa || mfaCode) && (
            <Input
              label="MFA code"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              inputMode="numeric"
            />
          )}
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
