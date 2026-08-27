"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Badge, Button, Card, Input, LoadingState, ErrorState } from "@t360/ui";
import { apiFetch } from "../../../lib/api";
import { MediaImagePicker } from "../../../components/media-image-picker";

type Product = {
  id: string;
  name: string;
  slug: string;
  status: string;
  description: string;
  tryOnEnabled?: boolean;
  variants: Array<{ sku: string; price: string; salePrice?: string | null }>;
  images: Array<{ id?: string; url: string; isTryOnSource?: boolean; sortOrder?: number }>;
};

type FashionJob = {
  id: string;
  status: string;
  type: string;
  createdAt: string;
  outputImageUrl?: string | null;
};

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const query = useQuery({
    queryKey: ["admin-product", params.id],
    queryFn: () => apiFetch<Product>(`/admin/products/${params.id}`),
  });

  const fashionJobs = useQuery({
    queryKey: ["ai-fashion-product-jobs", params.id],
    queryFn: () =>
      apiFetch<FashionJob[]>(`/admin/ai-fashion/jobs?productId=${params.id}&pageSize=5`),
  });

  const collectionsQuery = useQuery({
    queryKey: ["admin-collections"],
    queryFn: () =>
      apiFetch<Array<{ id: string; name: string }>>("/admin/collections"),
  });

  const productCollections = useQuery({
    queryKey: ["admin-product-collections", params.id],
    queryFn: () => apiFetch<string[]>(`/admin/collections/by-product/${params.id}`),
  });

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [status, setStatus] = React.useState("published");
  const [tryOnEnabled, setTryOnEnabled] = React.useState(false);
  const [tryOnImageId, setTryOnImageId] = React.useState<string | null>(null);
  const [collectionIds, setCollectionIds] = React.useState<string[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (query.data?.data) {
      setName(query.data.data.name);
      setDescription(query.data.data.description);
      setStatus(query.data.data.status);
      setTryOnEnabled(Boolean(query.data.data.tryOnEnabled));
      const src = query.data.data.images.find((i) => i.isTryOnSource);
      setTryOnImageId(src?.id ?? null);
    }
  }, [query.data]);

  React.useEffect(() => {
    if (productCollections.data?.data) {
      setCollectionIds(productCollections.data.data);
    }
  }, [productCollections.data]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/admin/products/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name,
          description,
          status,
          tryOnEnabled,
          tryOnImageId,
        }),
      });
      await apiFetch(`/admin/collections/by-product/${params.id}`, {
        method: "PUT",
        body: JSON.stringify({ collectionIds }),
      });
      await query.refetch();
      await productCollections.refetch();
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

  async function onImageUploaded(url: string) {
    setUploadingImage(true);
    setError(null);
    try {
      await apiFetch(`/admin/products/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({ imageUrls: [url] }),
      });
      const refreshed = await query.refetch();
      const imgs = refreshed.data?.data.images ?? [];
      const added = [...imgs].reverse().find((i) => i.url === url) ?? imgs[imgs.length - 1];
      if (added?.id) {
        const asPrimary = confirm("Set this image as the primary product image?");
        const asTryOn = confirm("Use this image as the TRY ME garment source?");
        const patch: Record<string, string> = {};
        if (asPrimary) patch.primaryImageId = added.id;
        if (asTryOn) {
          patch.tryOnImageId = added.id;
          setTryOnImageId(added.id);
        }
        if (Object.keys(patch).length) {
          await apiFetch(`/admin/products/${params.id}`, {
            method: "PATCH",
            body: JSON.stringify(patch),
          });
          await query.refetch();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image attach failed");
    } finally {
      setUploadingImage(false);
    }
  }

  async function setPrimary(imageId: string) {
    setSaving(true);
    try {
      await apiFetch(`/admin/products/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({ primaryImageId: imageId }),
      });
      await query.refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set primary");
    } finally {
      setSaving(false);
    }
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
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={tryOnEnabled}
              onChange={(e) => setTryOnEnabled(e.target.checked)}
            />
            Enable Virtual Try-On (TRY ME) for this product
          </label>
          {(collectionsQuery.data?.data?.length ?? 0) > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Collections</p>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                {collectionsQuery.data!.data.map((c) => (
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
          {p.images.length ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Try-On garment image</p>
              <p className="text-xs text-muted">
                Preferred product photo used as the garment for try-on (defaults to first gallery image).
              </p>
              <div className="grid grid-cols-3 gap-2">
                {p.images.map((img) => (
                  <button
                    key={img.id ?? img.url}
                    type="button"
                    className={`overflow-hidden rounded-md border-2 ${
                      tryOnImageId === img.id ? "border-wine" : "border-transparent"
                    }`}
                    onClick={() => setTryOnImageId(img.id ?? null)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" className="aspect-[4/5] w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          ) : null}
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
      <div className="space-y-6">
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
              <div key={img.url} className="space-y-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="aspect-[4/5] rounded-md object-cover" />
                <div className="flex flex-wrap gap-1">
                  {p.images[0]?.url === img.url ? (
                    <Badge tone="success">Primary</Badge>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!img.id || saving}
                      onClick={() => img.id && void setPrimary(img.id)}
                    >
                      Set primary
                    </Button>
                  )}
                  {img.isTryOnSource ? <Badge tone="neutral">TRY ME</Badge> : null}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <MediaImagePicker
              label="Add shirt image"
              onChange={(url) => void onImageUploaded(url)}
            />
            {uploadingImage ? <p className="mt-2 text-xs text-muted">Saving to product…</p> : null}
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl">AI Fashion</h2>
            <Link href={`/ai-fashion/generate?productId=${params.id}&quick=1`}>
              <Button type="button">Quick Generate</Button>
            </Link>
          </div>
          <p className="mt-2 text-sm text-muted">
            Create on-model fashion images from this product&apos;s photos.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {(fashionJobs.data?.data ?? []).length === 0 ? (
              <li className="text-muted">No AI generations yet.</li>
            ) : (
              (fashionJobs.data?.data ?? []).map((j) => (
                <li key={j.id} className="flex items-center justify-between border-b border-border py-2">
                  <span>{new Date(j.createdAt).toLocaleString()}</span>
                  <Badge
                    tone={
                      j.status === "COMPLETED"
                        ? "success"
                        : j.status === "FAILED"
                          ? "danger"
                          : "neutral"
                    }
                  >
                    {j.status}
                  </Badge>
                </li>
              ))
            )}
          </ul>
          <Link href="/ai-fashion/images" className="mt-3 inline-block text-sm text-wine underline">
            View all generated images
          </Link>
        </Card>
      </div>
    </div>
  );
}
