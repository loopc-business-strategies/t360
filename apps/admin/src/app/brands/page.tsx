"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, EmptyState, ErrorState, Input, LoadingState, Table, TBody, TD, TH, THead, TR } from "@t360/ui";
import { apiFetch } from "../../lib/api";

type Brand = { id: string; name: string; slug: string; status: string };

export default function BrandsPage() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["admin-brands"],
    queryFn: () => apiFetch<Brand[]>("/admin/brands"),
  });
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch("/admin/brands", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      setName("");
      await qc.invalidateQueries({ queryKey: ["admin-brands"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Brands</h1>
      <Card>
        <form className="flex flex-wrap items-end gap-3" onSubmit={onCreate}>
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Button type="submit">Add</Button>
        </form>
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      </Card>
      {query.isLoading ? <LoadingState label="Loading…" /> : null}
      {query.isError ? <ErrorState title="Failed" description={query.error.message} /> : null}
      {query.data?.data.length === 0 ? <EmptyState title="No brands" /> : null}
      {query.data && query.data.data.length > 0 ? (
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Slug</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {query.data.data.map((b) => (
              <TR key={b.id}>
                <TD>{b.name}</TD>
                <TD>{b.slug}</TD>
                <TD>{b.status}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      ) : null}
    </div>
  );
}
