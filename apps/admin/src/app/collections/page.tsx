"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@t360/ui";
import { apiFetch } from "../../lib/api";

type Collection = {
  id: string;
  name: string;
  slug: string;
  status: string;
  featured: boolean;
  sortOrder: number;
  _count?: { products: number };
};

type Product = { id: string; name: string; slug: string };

export default function CollectionsPage() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["admin-collections"],
    queryFn: () => apiFetch<Collection[]>("/admin/collections"),
  });
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<Collection | null>(null);
  const [productIds, setProductIds] = React.useState("");
  const [productSearch, setProductSearch] = React.useState("");
  const productsQuery = useQuery({
    queryKey: ["admin-products-search", productSearch],
    queryFn: () =>
      apiFetch<Product[]>(`/admin/products?q=${encodeURIComponent(productSearch)}&pageSize=20`),
    enabled: Boolean(editing),
  });

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch("/admin/collections", {
        method: "POST",
        body: JSON.stringify({ name, description: description || undefined }),
      });
      setName("");
      setDescription("");
      await qc.invalidateQueries({ queryKey: ["admin-collections"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  async function saveProducts() {
    if (!editing) return;
    setError(null);
    try {
      const ids = productIds
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      await apiFetch(`/admin/collections/${editing.id}/products`, {
        method: "PUT",
        body: JSON.stringify({ productIds: ids }),
      });
      await qc.invalidateQueries({ queryKey: ["admin-collections"] });
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Collections</h1>
      <Card>
        <form className="flex flex-wrap items-end gap-3" onSubmit={onCreate}>
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button type="submit">Add collection</Button>
        </form>
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      </Card>

      {query.isLoading ? <LoadingState label="Loading…" /> : null}
      {query.isError ? <ErrorState title="Failed" description={query.error.message} /> : null}
      {query.data?.data.length === 0 ? <EmptyState title="No collections" /> : null}

      {query.data && query.data.data.length > 0 ? (
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Slug</TH>
              <TH>Status</TH>
              <TH>Products</TH>
              <TH />
            </TR>
          </THead>
          <TBody>
            {query.data.data.map((c) => (
              <TR key={c.id}>
                <TD>{c.name}</TD>
                <TD>{c.slug}</TD>
                <TD>{c.status}</TD>
                <TD>{c._count?.products ?? 0}</TD>
                <TD>
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditing(c)}>
                    Assign products
                  </Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      ) : null}

      {editing ? (
        <Card>
          <h2 className="font-medium">Products in {editing.name}</h2>
          <p className="mt-1 text-sm text-muted">
            Enter product IDs (comma-separated) or pick from search below.
          </p>
          <Input
            label="Product IDs"
            className="mt-4"
            value={productIds}
            onChange={(e) => setProductIds(e.target.value)}
          />
          <Input
            label="Search products"
            className="mt-3"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
          />
          {productsQuery.data?.data?.length ? (
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-sm">
              {productsQuery.data.data.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="text-wine hover:underline"
                    onClick={() =>
                      setProductIds((ids) => (ids ? `${ids}, ${p.id}` : p.id))
                    }
                  >
                    {p.name} ({p.slug})
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-4 flex gap-2">
            <Button type="button" onClick={() => void saveProducts()}>
              Save products
            </Button>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
