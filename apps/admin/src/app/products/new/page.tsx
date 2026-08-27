"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, Input, Select } from "@t360/ui";
import { apiFetch } from "../../../lib/api";
import { MediaImagePicker } from "../../../components/media-image-picker";

type Category = { id: string; name: string };
type Brand = { id: string; name: string };

export default function NewProductPage() {
  const router = useRouter();
  const categories = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => apiFetch<Category[]>("/admin/categories"),
  });
  const brands = useQuery({
    queryKey: ["admin-brands"],
    queryFn: () => apiFetch<Brand[]>("/admin/brands"),
  });

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [brandId, setBrandId] = React.useState("");
  const [sku, setSku] = React.useState("");
  const [price, setPrice] = React.useState("1299");
  const [status, setStatus] = React.useState("published");
  const [imageUrls, setImageUrls] = React.useState<string[]>([]);
  const [generateAiFashion, setGenerateAiFashion] = React.useState(false);
  const [collectionIds, setCollectionIds] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const collections = useQuery({
    queryKey: ["admin-collections"],
    queryFn: () =>
      apiFetch<Array<{ id: string; name: string }>>("/admin/collections"),
  });

  React.useEffect(() => {
    if (!categoryId && categories.data?.data?.[0]) {
      setCategoryId(categories.data.data[0].id);
    }
  }, [categories.data, categoryId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await apiFetch<{ id: string }>("/admin/products", {
        method: "POST",
        body: JSON.stringify({
          name,
          description,
          categoryId,
          brandId: brandId || null,
          status,
          imageUrls,
          generateAiFashion,
          variants: [{ sku, price: Number(price), attributes: { size: "M", colour: "Blue" } }],
        }),
      });
      if (collectionIds.length) {
        await apiFetch(`/admin/collections/by-product/${res.data.id}`, {
          method: "PUT",
          body: JSON.stringify({ collectionIds }),
        });
      }
      router.push(`/products/${res.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <h1 className="font-display text-2xl">New product</h1>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Select
          label="Category"
          value={categoryId}
          onValueChange={setCategoryId}
          options={(categories.data?.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
        />
        <Select
          label="Brand"
          value={brandId || "none"}
          onValueChange={(v) => setBrandId(v === "none" ? "" : v)}
          options={[
            { value: "none", label: "None" },
            ...(brands.data?.data ?? []).map((b) => ({ value: b.id, label: b.name })),
          ]}
        />
        <Select
          label="Status"
          value={status}
          onValueChange={setStatus}
          options={[
            { value: "draft", label: "Draft" },
            { value: "published", label: "Published" },
          ]}
        />
        <Input label="SKU" value={sku} onChange={(e) => setSku(e.target.value)} required />
        <Input label="Price" value={price} onChange={(e) => setPrice(e.target.value)} required />
        <MediaImagePicker
          label="Product images"
          urls={imageUrls}
          onChange={() => {}}
          onUrlsChange={setImageUrls}
        />
        {(collections.data?.data?.length ?? 0) > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Collections</p>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border p-2">
              {collections.data!.data.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={collectionIds.includes(c.id)}
                    onChange={(e) =>
                      setCollectionIds((ids) =>
                        e.target.checked ? [...ids, c.id] : ids.filter((id) => id !== c.id),
                      )
                    }
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </div>
        ) : null}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={generateAiFashion}
            onChange={(e) => setGenerateAiFashion(e.target.checked)}
          />
          Generate AI Fashion Images
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Create"}
        </Button>
      </form>
    </Card>
  );
}
