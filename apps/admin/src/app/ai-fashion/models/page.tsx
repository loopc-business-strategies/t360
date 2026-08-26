"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Card, Input, LoadingState, Select, ErrorState } from "@t360/ui";
import { apiFetch } from "../../../lib/api";
import { AiFashionNav } from "../../../components/ai-fashion-nav";
import { MediaImagePicker } from "../../../components/media-image-picker";

type FashionModel = {
  id: string;
  name: string;
  gender: string;
  ageRange?: string | null;
  style?: string | null;
  bodyType?: string | null;
  skinTone?: string | null;
  hairStyle?: string | null;
  imageUrl: string;
  isActive: boolean;
};

export default function AiFashionModelsPage() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["ai-fashion-models"],
    queryFn: () => apiFetch<FashionModel[]>("/admin/ai-fashion/models"),
  });

  const [name, setName] = React.useState("");
  const [gender, setGender] = React.useState("female");
  const [imageUrl, setImageUrl] = React.useState("");
  const [ageRange, setAgeRange] = React.useState("");
  const [style, setStyle] = React.useState("");
  const [bodyType, setBodyType] = React.useState("");
  const [skinTone, setSkinTone] = React.useState("");
  const [hairStyle, setHairStyle] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      apiFetch("/admin/ai-fashion/models", {
        method: "POST",
        body: JSON.stringify({
          name,
          gender,
          imageUrl,
          ageRange: ageRange || null,
          style: style || null,
          bodyType: bodyType || null,
          skinTone: skinTone || null,
          hairStyle: hairStyle || null,
        }),
      }),
    onSuccess: () => {
      setName("");
      setImageUrl("");
      setFormError(null);
      qc.invalidateQueries({ queryKey: ["ai-fashion-models"] });
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const generate = useMutation({
    mutationFn: () =>
      apiFetch("/admin/ai-fashion/models/generate", {
        method: "POST",
        body: JSON.stringify({
          name: name || undefined,
          gender,
          ageRange: ageRange || undefined,
          style: style || undefined,
          bodyType: bodyType || undefined,
          skinTone: skinTone || undefined,
          hairStyle: hairStyle || undefined,
          saveToLibrary: true,
        }),
      }),
    onSuccess: () => {
      setFormError(null);
      qc.invalidateQueries({ queryKey: ["ai-fashion-models"] });
      qc.invalidateQueries({ queryKey: ["ai-fashion-jobs"] });
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const toggle = useMutation({
    mutationFn: (m: FashionModel) =>
      apiFetch(`/admin/ai-fashion/models/${m.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !m.isActive }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-fashion-models"] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/admin/ai-fashion/models/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-fashion-models"] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">AI Models</h1>
        <p className="mt-1 text-sm text-muted">Reusable fashion models for product try-on</p>
      </div>
      <AiFashionNav />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-3">
          <h2 className="font-display text-xl">Add or generate model</h2>
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
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
          <Input label="Age range" value={ageRange} onChange={(e) => setAgeRange(e.target.value)} />
          <Input label="Style" value={style} onChange={(e) => setStyle(e.target.value)} />
          <Input label="Body type" value={bodyType} onChange={(e) => setBodyType(e.target.value)} />
          <Input label="Skin tone" value={skinTone} onChange={(e) => setSkinTone(e.target.value)} />
          <Input label="Hair style" value={hairStyle} onChange={(e) => setHairStyle(e.target.value)} />
          <MediaImagePicker
            label="Model image"
            value={imageUrl}
            onChange={(url) => setImageUrl(url)}
          />
          <Input
            label="Or paste image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          {formError ? <p className="text-sm text-danger">{formError}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={!name || !imageUrl || create.isPending}
              onClick={() => create.mutate()}
            >
              {create.isPending ? "Saving…" : "Save model"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={generate.isPending}
              onClick={() => generate.mutate()}
            >
              {generate.isPending ? "Queuing…" : "Generate with AI"}
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-xl">Library</h2>
          {list.isLoading ? <LoadingState label="Loading…" /> : null}
          {list.isError ? (
            <ErrorState
              title="Failed"
              description={list.error.message}
              onRetry={() => list.refetch()}
              retryLabel="Retry"
            />
          ) : null}
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {(list.data?.data ?? []).map((m) => (
              <li key={m.id} className="overflow-hidden rounded-md border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.imageUrl} alt={m.name} className="aspect-[3/4] w-full object-cover" />
                <div className="space-y-2 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{m.name}</p>
                    <Badge tone={m.isActive ? "success" : "neutral"}>
                      {m.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted">{m.gender}</p>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => toggle.mutate(m)}>
                      {m.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (confirm("Delete this model?")) remove.mutate(m.id);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
