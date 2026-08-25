"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Card, Input, LoadingState, Select } from "@t360/ui";
import { apiFetch } from "../../../lib/api";
import { AiFashionNav } from "../../../components/ai-fashion-nav";

type ProductListItem = {
  id: string;
  name: string;
};

type ProductDetail = {
  id: string;
  name: string;
  images: Array<{ id: string; url: string }>;
};

type FashionModel = { id: string; name: string; gender: string; imageUrl: string; isActive: boolean };

type Job = {
  id: string;
  status: string;
  type: string;
  outputImageUrl?: string | null;
  error?: string | null;
  warning?: string;
  mediaKind?: string;
};

export default function GenerateClient() {
  const search = useSearchParams();
  const qc = useQueryClient();
  const presetProductId = search.get("productId") ?? "";

  const products = useQuery({
    queryKey: ["admin-products-ai"],
    queryFn: () => apiFetch<ProductListItem[]>("/admin/products?pageSize=100"),
  });
  const models = useQuery({
    queryKey: ["ai-fashion-models-active"],
    queryFn: () => apiFetch<FashionModel[]>("/admin/ai-fashion/models?activeOnly=true"),
  });

  const [productId, setProductId] = React.useState(presetProductId);
  const [productImageId, setProductImageId] = React.useState("");
  const [modelId, setModelId] = React.useState("none");
  const [gender, setGender] = React.useState("female");
  const [pose, setPose] = React.useState("standing");
  const [background, setBackground] = React.useState("studio");
  const [numImages, setNumImages] = React.useState("1");
  const [resolution, setResolution] = React.useState("1k");
  const [generationMode, setGenerationMode] = React.useState("fast");
  const [customPrompt, setCustomPrompt] = React.useState("");
  const [jobId, setJobId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [warning, setWarning] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (presetProductId) setProductId(presetProductId);
  }, [presetProductId]);

  const product = useQuery({
    queryKey: ["admin-product-ai", productId],
    queryFn: () => apiFetch<ProductDetail>(`/admin/products/${productId}`),
    enabled: Boolean(productId),
  });

  React.useEffect(() => {
    const imgs = product.data?.data?.images ?? [];
    if (imgs[0] && !productImageId) setProductImageId(imgs[0].id);
  }, [product.data, productImageId]);

  const job = useQuery({
    queryKey: ["ai-fashion-job", jobId],
    queryFn: () => apiFetch<Job>(`/admin/ai-fashion/jobs/${jobId}`),
    enabled: Boolean(jobId),
    refetchInterval: (q) => {
      const s = q.state.data?.data?.status;
      return s === "QUEUED" || s === "PROCESSING" ? 2500 : false;
    },
  });

  const generate = useMutation({
    mutationFn: () =>
      apiFetch<Job>("/admin/ai-fashion/generate", {
        method: "POST",
        body: JSON.stringify({
          productId,
          productImageId: productImageId || undefined,
          type: "PRODUCT_TO_MODEL",
          modelId: modelId === "none" ? null : modelId,
          gender: modelId === "none" ? gender : undefined,
          pose,
          background,
          numImages: Number(numImages),
          resolution,
          generationMode,
          customPrompt: customPrompt || undefined,
        }),
      }),
    onSuccess: (res) => {
      setJobId(res.data.id);
      setWarning((res.data as Job & { warning?: string }).warning ?? null);
      setError(null);
      qc.invalidateQueries({ queryKey: ["ai-fashion-dashboard"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const approve = useMutation({
    mutationFn: (as: "primary" | "gallery") =>
      apiFetch(`/admin/ai-fashion/jobs/${jobId}/approve`, {
        method: "POST",
        body: JSON.stringify({ as }),
      }),
  });

  const retry = useMutation({
    mutationFn: () =>
      apiFetch<Job>(`/admin/ai-fashion/jobs/${jobId}/retry`, { method: "POST" }),
    onSuccess: (res) => {
      setJobId(res.data.id);
      qc.invalidateQueries({ queryKey: ["ai-fashion-job", jobId] });
    },
  });

  const productOptions = (products.data?.data ?? []).map((p) => ({
    value: p.id,
    label: p.name,
  }));
  const images = product.data?.data?.images ?? [];
  const jobData = job.data?.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Generate AI Image</h1>
        <p className="mt-1 text-sm text-muted">Product image → AI model wearing the garment</p>
      </div>
      <AiFashionNav />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <Select
            label="Product"
            value={productId || "none"}
            onValueChange={(v) => {
              setProductId(v === "none" ? "" : v);
              setProductImageId("");
            }}
            options={[{ value: "none", label: "Select product" }, ...productOptions]}
          />

          {productId ? (
            <div>
              <p className="mb-2 text-sm font-medium">Product image</p>
              {product.isLoading ? <LoadingState label="Loading images…" /> : null}
              <div className="grid grid-cols-3 gap-2">
                {images.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setProductImageId(img.id)}
                    className={`overflow-hidden rounded-md border-2 ${
                      productImageId === img.id ? "border-wine" : "border-border"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" className="aspect-[4/5] w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <Select
            label="AI Model"
            value={modelId}
            onValueChange={setModelId}
            options={[
              { value: "none", label: "Auto (product-to-model)" },
              ...(models.data?.data ?? []).map((m) => ({
                value: m.id,
                label: `${m.name} (${m.gender})`,
              })),
            ]}
          />

          {modelId === "none" ? (
            <Select
              label="Gender"
              value={gender}
              onValueChange={setGender}
              options={[
                { value: "female", label: "Female" },
                { value: "male", label: "Male" },
                { value: "unisex", label: "Unisex" },
              ]}
            />
          ) : null}

          <Select
            label="Pose"
            value={pose}
            onValueChange={setPose}
            options={[
              { value: "standing", label: "Standing" },
              { value: "casual", label: "Casual" },
              { value: "fashion", label: "Fashion" },
              { value: "custom", label: "Custom (prompt)" },
            ]}
          />
          <Select
            label="Background"
            value={background}
            onValueChange={setBackground}
            options={[
              { value: "studio", label: "Studio" },
              { value: "white", label: "White" },
              { value: "outdoor", label: "Outdoor" },
              { value: "custom", label: "Custom (prompt)" },
            ]}
          />
          <Select
            label="Number of images"
            value={numImages}
            onValueChange={setNumImages}
            options={[
              { value: "1", label: "1" },
              { value: "2", label: "2" },
              { value: "4", label: "4" },
            ]}
          />
          <Select
            label="Resolution"
            value={resolution}
            onValueChange={setResolution}
            options={[
              { value: "1k", label: "1K" },
              { value: "2k", label: "2K" },
              { value: "4k", label: "4K" },
            ]}
          />
          <Select
            label="Quality"
            value={generationMode}
            onValueChange={setGenerationMode}
            options={[
              { value: "fast", label: "Fast" },
              { value: "balanced", label: "Balanced" },
              { value: "quality", label: "Quality" },
            ]}
          />
          <Input
            label="Custom prompt (optional)"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
          />

          {warning ? <p className="text-sm text-brass">{warning}</p> : null}
          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <Button
            type="button"
            disabled={!productId || !productImageId || generate.isPending}
            onClick={() => generate.mutate()}
          >
            {generate.isPending ? "Submitting…" : "Generate AI Image"}
          </Button>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-display text-xl">Result</h2>
          {!jobId ? (
            <p className="text-sm text-muted">Generate an image to see status and preview.</p>
          ) : null}
          {job.isLoading ? <LoadingState label="Loading job…" /> : null}
          {jobData ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge
                  tone={
                    jobData.status === "COMPLETED"
                      ? "success"
                      : jobData.status === "FAILED"
                        ? "danger"
                        : "neutral"
                  }
                >
                  {jobData.status === "COMPLETED"
                    ? "Ready"
                    : jobData.status === "FAILED"
                      ? "Generation failed"
                      : jobData.status === "PROCESSING"
                        ? "Processing…"
                        : "Queued"}
                </Badge>
                {(jobData.status === "QUEUED" || jobData.status === "PROCESSING") && (
                  <Button type="button" variant="outline" onClick={() => job.refetch()}>
                    Refresh status
                  </Button>
                )}
              </div>
              {jobData.error ? <p className="text-sm text-danger">{jobData.error}</p> : null}
              {jobData.outputImageUrl ? (
                jobData.type === "IMAGE_TO_VIDEO" || jobData.mediaKind === "video" ? (
                  <video
                    src={jobData.outputImageUrl}
                    className="max-h-[480px] w-full rounded-md"
                    controls
                    playsInline
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={jobData.outputImageUrl}
                    alt="Generated"
                    className="max-h-[480px] w-full rounded-md object-contain"
                  />
                )
              ) : null}
              {jobData.status === "COMPLETED" ? (
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={() => approve.mutate("gallery")}>
                    Add to gallery
                  </Button>
                  <Button type="button" variant="outline" onClick={() => approve.mutate("primary")}>
                    Use as primary
                  </Button>
                  {jobData.type !== "IMAGE_TO_VIDEO" && jobData.mediaKind !== "video" ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={generate.isPending}
                      onClick={() => {
                        if (!productId || !jobId) return;
                        setError(null);
                        apiFetch<Job>("/admin/ai-fashion/generate", {
                          method: "POST",
                          body: JSON.stringify({
                            type: "IMAGE_TO_VIDEO",
                            sourceJobId: jobId,
                            productId,
                            duration: 5,
                            videoResolution: "720p",
                          }),
                        })
                          .then((res) => {
                            setJobId(res.data.id);
                            qc.invalidateQueries({ queryKey: ["ai-fashion-dashboard"] });
                          })
                          .catch((err: Error) => setError(err.message));
                      }}
                    >
                      Generate video
                    </Button>
                  ) : null}
                </div>
              ) : null}
              {jobData.status === "FAILED" ? (
                <Button type="button" onClick={() => retry.mutate()} disabled={retry.isPending}>
                  Retry
                </Button>
              ) : null}
              {approve.isSuccess ? (
                <p className="text-sm text-success">Saved to product images.</p>
              ) : null}
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
