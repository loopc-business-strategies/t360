"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, ErrorState, Input, LoadingState } from "@t360/ui";
import { apiFetch } from "../../../lib/api";

type Me = { mfaEnabled: boolean; permissions: string[] };

type MfaSetup = {
  secret: string;
  otpauthUrl: string;
  note?: string;
};

export default function SettingsSecurityPage() {
  const qc = useQueryClient();
  const [setup, setSetup] = React.useState<MfaSetup | null>(null);
  const [code, setCode] = React.useState("");
  const [msg, setMsg] = React.useState<string | null>(null);

  const me = useQuery({
    queryKey: ["admin-me-security"],
    queryFn: () => apiFetch<Me>("/users/me"),
  });

  const canManage = Boolean(me.data?.data.permissions?.includes("settings.manage"));
  const mfaEnabled = Boolean(me.data?.data.mfaEnabled);

  const startSetup = useMutation({
    mutationFn: () => apiFetch<MfaSetup>("/auth/mfa/setup", { method: "POST", body: "{}" }),
    onSuccess: (res) => {
      setSetup(res.data);
      setMsg(null);
    },
    onError: (e: Error) => setMsg(e.message),
  });

  const confirm = useMutation({
    mutationFn: () =>
      apiFetch("/auth/mfa/enable", {
        method: "POST",
        body: JSON.stringify({ code }),
      }),
    onSuccess: async () => {
      setMsg("MFA enabled.");
      setSetup(null);
      setCode("");
      await qc.invalidateQueries({ queryKey: ["admin-me-security"] });
      await qc.invalidateQueries({ queryKey: ["admin-me-profile"] });
    },
    onError: (e: Error) => setMsg(e.message),
  });

  const qrSrc = setup?.otpauthUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(setup.otpauthUrl)}`
    : null;

  if (me.isLoading) return <LoadingState label="Loading security…" />;
  if (me.isError || !me.data) {
    return (
      <ErrorState
        title="Failed"
        description={me.error?.message}
        onRetry={() => me.refetch()}
        retryLabel="Retry"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Security</h1>
        <p className="text-sm text-muted">Password, MFA, and session controls</p>
      </div>

      <Card className="space-y-3">
        <p className="text-sm">
          MFA status: <strong>{mfaEnabled ? "Enabled" : "Off"}</strong>
        </p>
        <p className="text-sm text-muted">
          Manage password and active sessions from your profile.
        </p>
        <Link href="/profile">
          <Button type="button" variant="outline">
            Open profile
          </Button>
        </Link>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-display text-xl">Two-factor authentication (MFA)</h2>
        {!canManage ? (
          <p className="text-sm text-muted">
            MFA enrollment requires the <code>settings.manage</code> permission.
          </p>
        ) : mfaEnabled && !setup ? (
          <p className="text-sm text-muted">
            MFA is active on this account. Use your authenticator app when signing in.
          </p>
        ) : (
          <>
            {!setup ? (
              <Button
                type="button"
                disabled={startSetup.isPending}
                onClick={() => startSetup.mutate()}
              >
                {startSetup.isPending ? "Starting…" : mfaEnabled ? "Re-enroll MFA" : "Set up MFA"}
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted">
                  Scan this QR with Google Authenticator or Authy, then enter the 6-digit code.
                </p>
                {qrSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrSrc} alt="MFA QR code" className="h-44 w-44 rounded-md border border-border" />
                ) : null}
                <p className="break-all font-mono text-xs text-muted">Secret: {setup.secret}</p>
                <Input
                  label="Authentication code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    disabled={confirm.isPending || code.length !== 6}
                    onClick={() => confirm.mutate()}
                  >
                    {confirm.isPending ? "Confirming…" : "Enable MFA"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setSetup(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
        {msg ? <p className="text-sm text-muted">{msg}</p> : null}
      </Card>
    </div>
  );
}
