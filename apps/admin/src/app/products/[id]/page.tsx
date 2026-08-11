"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Badge, Button, Card, Input, LoadingState, ErrorState } from "@t360/ui";
import { apiFetch } from "../../../lib/api";

type Product = {
  id: string;
  name: string;
  slug: string;
  status: string;
  description: string;
  variants: Array<{ sku: string; price: string; salePrice?: string | null }>;
  images: Array<{ url: string }>;
};

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const query = useQuery({
    queryKey: ["admin-product", params.id],
    queryFn: () => apiFetch<Product>(`/admin/products/${params.id}`),
  });

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [status, setStatus] = React.useState("published");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (query.data?.data) {
      setName(query.data.data.name);
      setDescription(query.data.data.description);
      setStatus(query.data.data.status);
    }
  }, [query.data]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/admin/products/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name, description, status }),
      });
      await query.refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!confirm("Archive this product?")) return;
    await apiFetch(`/admin/products/${params.id}`, { method: "DELETE" });
    router.push("/products");
  }

  if (query.isLoading) return <LoadingState label="Loading product…" />;
  if (query.isError || !query.data) {
    return (
      <ErrorState
        title="Product not found"
        description={query.error?.message}
        retryLabel="Back"
        onRetry={() => router.push("/products")}
      />
    );
  }

  const p = query.data.data;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display text-2xl">Edit product</h1>
          <Badge tone={p.status === "published" ? "success" : "neutral"}>{p.status}</Badge>
        </div>
        <form className="mt-6 space-y-4" onSubmit={onSave}>
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Input label="Status" value={status} onChange={(e) => setStatus(e.target.value)} />
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button type="button" variant="outline" onClick={onDelete}>
              Archive
            </Button>
          </div>
        </form>
      </Card>
      <Card>
        <h2 className="font-display text-xl">Variants & images</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {p.variants.map((v) => (
            <li key={v.sku} className="flex justify-between border-b border-border py-2">
              <span>{v.sku}</span>
              <span>₹{v.salePrice ?? v.price}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {p.images.map((img) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={img.url} src={img.url} alt="" className="aspect-[4/5] rounded-md object-cover" />
          ))}
        </div>
      </Card>
    </div>
  );
}
