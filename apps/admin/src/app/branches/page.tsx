"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, EmptyState, ErrorState, Input, LoadingState, Table, TBody, TD, TH, THead, TR } from "@t360/ui";
import { apiFetch } from "../../lib/api";

type Branch = {
  id: string;
  code: string;
  name: string;
  address: string;
  phone?: string | null;
  status: string;
};

export default function BranchesPage() {
  const qc = useQueryClient();
  const [code, setCode] = React.useState("");
  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const query = useQuery({
    queryKey: ["admin-branches"],
    queryFn: () => apiFetch<Branch[]>("/admin/branches"),
  });

  const create = useMutation({
    mutationFn: () =>
      apiFetch<Branch>("/admin/branches", {
        method: "POST",
        body: JSON.stringify({ code, name, address }),
      }),
    onSuccess: async () => {
      setCode("");
      setName("");
      setAddress("");
      setError(null);
      await qc.invalidateQueries({ queryKey: ["admin-branches"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Branches</h1>
        <p className="text-sm text-muted">Store locations for multi-branch inventory</p>
      </div>

      <form
        className="grid max-w-2xl gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <Input label="Code" value={code} onChange={(e) => setCode(e.target.value)} required />
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input
          label="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="sm:col-span-2"
        />
        {error ? <p className="text-sm text-wine sm:col-span-2">{error}</p> : null}
        <Button type="submit" disabled={create.isPending} className="sm:col-span-2 sm:w-fit">
          {create.isPending ? "Creating…" : "Create branch"}
        </Button>
      </form>

      {query.isLoading ? <LoadingState label="Loading branches…" /> : null}
      {query.isError ? (
        <ErrorState
          title="Could not load branches"
          description={query.error.message}
          retryLabel="Retry"
          onRetry={() => query.refetch()}
        />
      ) : null}
      {query.data && query.data.data.length === 0 ? (
        <EmptyState title="No branches" description="Create PDK01 or run inventory seed." />
      ) : null}

      {query.data && query.data.data.length > 0 ? (
        <Table>
          <THead>
            <TR>
              <TH>Code</TH>
              <TH>Name</TH>
              <TH>Address</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {query.data.data.map((b) => (
              <TR key={b.id}>
                <TD className="font-medium">{b.code}</TD>
                <TD>{b.name}</TD>
                <TD>{b.address || "—"}</TD>
                <TD>{b.status}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      ) : null}
    </div>
  );
}
