"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, ErrorState, Input, LoadingState, Table, TBody, TD, TH, THead, TR } from "@t360/ui";
import { apiFetch } from "../../lib/api";

type Coupon = {
  id: string;
  code: string;
  type: string;
  value: string | number;
  minOrder: string | number;
  maxUses: number | null;
  active: boolean;
};

export default function CouponsPage() {
  const qc = useQueryClient();
  const [code, setCode] = React.useState("");
  const [type, setType] = React.useState<"percent" | "fixed">("percent");
  const [value, setValue] = React.useState("10");

  const query = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: () => apiFetch<Coupon[]>("/admin/coupons"),
  });

  const create = useMutation({
    mutationFn: () =>
      apiFetch("/admin/coupons", {
        method: "POST",
        body: JSON.stringify({ code, type, value: Number(value), active: true }),
      }),
    onSuccess: () => {
      setCode("");
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/admin/coupons/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-coupons"] }),
  });

  const toggle = useMutation({
    mutationFn: (c: Coupon) =>
      apiFetch(`/admin/coupons/${c.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !c.active }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-coupons"] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Coupons</h1>
        <p className="text-sm text-muted">Percent / fixed checkout discounts</p>
      </div>

      <div className="grid max-w-xl gap-3 sm:grid-cols-3">
        <Input label="Code" value={code} onChange={(e) => setCode(e.target.value)} />
        <label className="text-sm">
          Type
          <select
            className="mt-1 w-full border border-border bg-elevated px-3 py-2"
            value={type}
            onChange={(e) => setType(e.target.value as "percent" | "fixed")}
          >
            <option value="percent">Percent</option>
            <option value="fixed">Fixed</option>
          </select>
        </label>
        <Input label="Value" value={value} onChange={(e) => setValue(e.target.value)} />
        <Button className="sm:col-span-3" onClick={() => create.mutate()} disabled={!code || create.isPending}>
          Create coupon
        </Button>
      </div>

      {query.isLoading ? <LoadingState label="Loading coupons…" /> : null}
      {query.isError ? (
        <ErrorState
          title="Could not load coupons"
          description={query.error.message}
          retryLabel="Retry"
          onRetry={() => query.refetch()}
        />
      ) : null}

      {query.data && query.data.data.length > 0 ? (
        <Table>
          <THead>
            <TR>
              <TH>Code</TH>
              <TH>Type</TH>
              <TH>Value</TH>
              <TH>Min</TH>
              <TH>Status</TH>
              <TH />
            </TR>
          </THead>
          <TBody>
            {query.data.data.map((c) => (
              <TR key={c.id}>
                <TD className="font-medium">{c.code}</TD>
                <TD>{c.type}</TD>
                <TD>{c.value}</TD>
                <TD>{c.minOrder}</TD>
                <TD>
                  <Badge tone={c.active ? "success" : "neutral"}>{c.active ? "active" : "off"}</Badge>
                </TD>
                <TD className="space-x-2">
                  <Button variant="outline" type="button" onClick={() => toggle.mutate(c)}>
                    Toggle
                  </Button>
                  <Button variant="outline" type="button" onClick={() => remove.mutate(c.id)}>
                    Delete
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
