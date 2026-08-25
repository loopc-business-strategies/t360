"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, ErrorState, LoadingState } from "@t360/ui";
import { apiFetch } from "../../lib/api";
import { RequirePerm } from "../../components/require-perm";

type Role = { id: string; code: string; name: string; permissions: string[] };
type Permission = { id: string; code: string };

function RolesPageInner() {
  const qc = useQueryClient();
  const [selected, setSelected] = React.useState<string | null>(null);
  const [codes, setCodes] = React.useState<string[]>([]);

  const roles = useQuery({
    queryKey: ["admin-roles"],
    queryFn: () => apiFetch<Role[]>("/admin/roles"),
  });
  const perms = useQuery({
    queryKey: ["admin-permissions"],
    queryFn: () => apiFetch<Permission[]>("/admin/roles/permissions"),
  });

  React.useEffect(() => {
    const role = (roles.data?.data ?? []).find((r) => r.id === selected);
    if (role) setCodes(role.permissions);
  }, [selected, roles.data]);

  const selectedRole = (roles.data?.data ?? []).find((r) => r.id === selected);
  const isSuperAdmin = selectedRole?.code === "SuperAdmin";
  const saveBlocked = isSuperAdmin && codes.length === 0;

  const save = useMutation({
    mutationFn: () =>
      apiFetch(`/admin/roles/${selected}/permissions`, {
        method: "PATCH",
        body: JSON.stringify({ permissionCodes: codes }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-roles"] }),
  });

  if (roles.isLoading) return <LoadingState label="Loading roles…" />;
  if (roles.isError) {
    return (
      <ErrorState
        title="Failed"
        description={roles.error.message}
        onRetry={() => roles.refetch()}
        retryLabel="Retry"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Roles & permissions</h1>
        <p className="text-sm text-muted">Only SuperAdmin / roles.manage can edit</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <Card className="space-y-1 p-3">
          {(roles.data?.data ?? []).map((r) => (
            <button
              key={r.id}
              type="button"
              className={`block w-full rounded-md px-3 py-2 text-left text-sm ${
                selected === r.id ? "bg-linen" : "hover:bg-linen/60"
              }`}
              onClick={() => setSelected(r.id)}
            >
              <span className="font-medium">{r.name}</span>
              <span className="mt-0.5 block text-xs text-muted">{r.code}</span>
            </button>
          ))}
        </Card>
        <Card>
          {!selected ? (
            <p className="text-sm text-muted">Select a role to edit permissions.</p>
          ) : (
            <div className="space-y-4">
              {isSuperAdmin ? (
                <p className="text-sm text-muted">
                  SuperAdmin must keep at least one permission. Clearing all permissions is blocked.
                </p>
              ) : null}
              <div className="max-h-[480px] space-y-1 overflow-y-auto">
                {(perms.data?.data ?? []).map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={codes.includes(p.code)}
                      onChange={(e) => {
                        setCodes((prev) =>
                          e.target.checked
                            ? [...prev, p.code]
                            : prev.filter((c) => c !== p.code),
                        );
                      }}
                    />
                    {p.code}
                  </label>
                ))}
              </div>
              <Button
                type="button"
                onClick={() => save.mutate()}
                disabled={save.isPending || saveBlocked}
              >
                {save.isPending ? "Saving…" : "Save permissions"}
              </Button>
              {saveBlocked ? (
                <p className="text-sm text-danger">Cannot clear all SuperAdmin permissions.</p>
              ) : null}
              {save.isSuccess ? <p className="text-sm text-success">Saved.</p> : null}
              {save.isError ? <p className="text-sm text-danger">{save.error.message}</p> : null}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function RolesPage() {
  return (
    <RequirePerm anyOf={["roles.manage"]}>
      <RolesPageInner />
    </RequirePerm>
  );
}
