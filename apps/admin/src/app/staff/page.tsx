"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, ErrorState, Input, LoadingState, Table, TBody, TD, TH, THead, TR } from "@t360/ui";
import { apiFetch } from "../../lib/api";

type Employee = {
  id: string;
  name: string;
  branchId: string | null;
  roles?: string[];
  user: { email: string | null; status: string };
};

type Role = { id: string; code: string; name: string };

export default function StaffPage() {
  const qc = useQueryClient();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [roleCodes, setRoleCodes] = React.useState("store_manager");

  const employees = useQuery({
    queryKey: ["admin-employees"],
    queryFn: () => apiFetch<Employee[]>("/admin/employees"),
  });
  const roles = useQuery({
    queryKey: ["admin-roles"],
    queryFn: () => apiFetch<Role[]>("/admin/roles"),
  });

  const create = useMutation({
    mutationFn: () =>
      apiFetch("/admin/employees", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          roleCodes: roleCodes
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      }),
    onSuccess: () => {
      setName("");
      setEmail("");
      qc.invalidateQueries({ queryKey: ["admin-employees"] });
    },
  });

  const setRoles = useMutation({
    mutationFn: ({ id, codes }: { id: string; codes: string[] }) =>
      apiFetch(`/admin/employees/${id}/roles`, {
        method: "POST",
        body: JSON.stringify({ roleCodes: codes }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-employees"] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Staff</h1>
        <p className="text-sm text-muted">Invite employees and assign roles</p>
      </div>

      <div className="grid max-w-xl gap-3">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input
          label="Role codes (comma-separated)"
          value={roleCodes}
          onChange={(e) => setRoleCodes(e.target.value)}
        />
        {roles.data ? (
          <p className="text-xs text-muted">{roles.data.data.map((r) => r.code).join(", ")}</p>
        ) : null}
        <Button onClick={() => create.mutate()} disabled={create.isPending || !name || !email}>
          Create staff
        </Button>
        {create.isError ? <p className="text-sm text-wine">{create.error.message}</p> : null}
      </div>

      {employees.isLoading ? <LoadingState label="Loading staff…" /> : null}
      {employees.isError ? (
        <ErrorState
          title="Could not load staff"
          description={employees.error.message}
          retryLabel="Retry"
          onRetry={() => employees.refetch()}
        />
      ) : null}

      {employees.data && employees.data.data.length > 0 ? (
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Email</TH>
              <TH>Roles</TH>
              <TH>Status</TH>
              <TH />
            </TR>
          </THead>
          <TBody>
            {employees.data.data.map((e) => (
              <TR key={e.id}>
                <TD>{e.name}</TD>
                <TD>{e.user.email}</TD>
                <TD>{(e.roles ?? []).join(", ") || "—"}</TD>
                <TD>{e.user.status}</TD>
                <TD>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      const codes = window.prompt("Role codes (comma-separated)", (e.roles ?? []).join(","));
                      if (codes == null) return;
                      setRoles.mutate({
                        id: e.id,
                        codes: codes
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      });
                    }}
                  >
                    Roles
                  </Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      ) : null}
    </div>
  );
}
