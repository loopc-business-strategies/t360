"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, EmptyState, ErrorState, Input, LoadingState, Table, TBody, TD, TH, THead, TR } from "@t360/ui";
import { apiFetch, API_URL, getAdminToken } from "../../lib/api";

type Product = {
  id: string;
  name: string;
  slug: string;
  status: string;
  category?: { name: string };
  brand?: { name: string } | null;
  variants?: Array<{ price: string; salePrice?: string | null }>;
};

type ImportResult = {
  created: number;
  errors: Array<{ row?: number; sku?: string; errors?: string[]; message?: string } | string>;
};

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = React.useState("");
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [importing, setImporting] = React.useState(false);
  const [importSummary, setImportSummary] = React.useState<string | null>(null);
  const [importError, setImportError] = React.useState<string | null>(null);

  const query = useQuery({
    queryKey: ["admin-products", q],
    queryFn: async () => {
      const params = new URLSearchParams({ pageSize: "50" });
      if (q) params.set("q", q);
      return apiFetch<Product[]>(`/admin/products?${params}`);
    },
  });

  async function onImportMultipart(file: File) {
    setImporting(true);
    setImportSummary(null);
    setImportError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const headers = new Headers();
      const token = getAdminToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      const res = await fetch(`${API_URL}/admin/products/import`, {
        method: "POST",
        headers,
        body: form,
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json?.error?.message ?? `Import failed (${res.status})`);
      }
      const data = json.data as ImportResult;
      const errCount = Array.isArray(data.errors) ? data.errors.length : 0;
      setImportSummary(`Imported ${data.created} row(s); ${errCount} error(s).`);
      await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Products</h1>
          <p className="text-sm text-muted">Manage catalogue from the live API</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onImportMultipart(file);
            }}
          />
          <Button
            variant="outline"
            type="button"
            disabled={importing}
            onClick={() => fileRef.current?.click()}
          >
            {importing ? "Importing…" : "Import CSV"}
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={async () => {
              try {
                const token = getAdminToken();
                const res = await fetch(`${API_URL}/admin/products/export`, {
                  headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (!res.ok) throw new Error(`Export failed (${res.status})`);
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "products-export.csv";
                a.click();
                URL.revokeObjectURL(url);
              } catch (e) {
                setImportError(e instanceof Error ? e.message : "Export failed");
              }
            }}
          >
            Export CSV
          </Button>
          <Link href="/products/new">
            <Button>New product</Button>
          </Link>
        </div>
      </div>

      {importSummary ? <p className="text-sm text-muted">{importSummary}</p> : null}
      {importError ? <p className="text-sm text-red-700">{importError}</p> : null}

      <Input
        label="Search"
        placeholder="Name, description, SKU…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-md"
      />

      {query.isLoading ? <LoadingState label="Loading products…" /> : null}
      {query.isError ? (
        <ErrorState
          title="Could not load products"
          description={query.error.message}
          retryLabel="Retry"
          onRetry={() => query.refetch()}
        />
      ) : null}
      {query.data && query.data.data.length === 0 ? (
        <EmptyState title="No products" description="Create a product or run catalogue seed." />
      ) : null}

      {query.data && query.data.data.length > 0 ? (
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Category</TH>
              <TH>Brand</TH>
              <TH>Status</TH>
              <TH>From</TH>
            </TR>
          </THead>
          <TBody>
            {query.data.data.map((p) => {
              const price = p.variants?.[0]?.salePrice ?? p.variants?.[0]?.price;
              return (
                <TR key={p.id}>
                  <TD>
                    <Link className="font-medium text-wine hover:underline" href={`/products/${p.id}`}>
                      {p.name}
                    </Link>
                  </TD>
                  <TD>{p.category?.name ?? "—"}</TD>
                  <TD>{p.brand?.name ?? "—"}</TD>
                  <TD>
                    <Badge tone={p.status === "published" ? "success" : "neutral"}>{p.status}</Badge>
                  </TD>
                  <TD>{price != null ? `₹${price}` : "—"}</TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      ) : null}
    </div>
  );
}
