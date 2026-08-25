"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button, Card, ErrorState, Input, LoadingState } from "@t360/ui";
import { apiFetch, clearAdminSession } from "../../lib/api";

type Me = {
  id: string;
  email?: string | null;
  roles: string[];
  permissions: string[];
  mfaEnabled: boolean;
  employee?: { name?: string; employeeCode?: string | null } | null;
};

type Session = {
  id: string;
  userAgent?: string | null;
  ip?: string | null;
  createdAt: string;
  current: boolean;
};

export default function ProfilePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const me = useQuery({
    queryKey: ["admin-me-profile"],
    queryFn: () => apiFetch<Me>("/users/me"),
  });
  const sessions = useQuery({
    queryKey: ["admin-sessions"],
    queryFn: () => apiFetch<Session[]>("/auth/sessions"),
  });

  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [msg, setMsg] = React.useState<string | null>(null);

  const changePw = useMutation({
    mutationFn: () =>
      apiFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
    onSuccess: () => {
      setMsg("Password changed. Sign in again.");
      clearAdminSession();
      router.push("/login");
    },
    onError: (e: Error) => setMsg(e.message),
  });

  const logoutAll = useMutation({
    mutationFn: () => apiFetch("/auth/logout-all", { method: "POST", body: "{}" }),
    onSuccess: () => {
      clearAdminSession();
      router.push("/login");
    },
  });

  if (me.isLoading) return <LoadingState label="Loading profile…" />;
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

  const u = me.data.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Profile</h1>
        <p className="text-sm text-muted">Account security and sessions</p>
      </div>
      <Card className="space-y-2 text-sm">
        <p>
          <span className="text-muted">Name:</span> {u.employee?.name ?? "—"}
        </p>
        <p>
          <span className="text-muted">Admin ID:</span> {u.employee?.employeeCode ?? "—"}
        </p>
        <p>
          <span className="text-muted">Email:</span> {u.email ?? "—"}
        </p>
        <p>
          <span className="text-muted">Roles:</span> {u.roles.join(", ") || "—"}
        </p>
        <p>
          <span className="text-muted">MFA:</span> {u.mfaEnabled ? "On" : "Off"}
        </p>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-display text-xl">Change password</h2>
        <Input
          label="Current password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <Input
          label="New password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <Button
          type="button"
          disabled={changePw.isPending || !currentPassword || !newPassword}
          onClick={() => changePw.mutate()}
        >
          Update password
        </Button>
        {msg ? <p className="text-sm text-muted">{msg}</p> : null}
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Sessions</h2>
          <Button type="button" variant="outline" onClick={() => logoutAll.mutate()}>
            Logout all devices
          </Button>
        </div>
        <ul className="space-y-2 text-sm">
          {(sessions.data?.data ?? []).map((s) => (
            <li key={s.id} className="border-b border-border py-2">
              {s.userAgent ?? "Unknown device"} · {s.ip ?? "—"}
              {s.current ? " · current" : ""}
              <span className="mt-0.5 block text-xs text-muted">
                {new Date(s.createdAt).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
