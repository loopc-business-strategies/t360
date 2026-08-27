"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, ErrorState, Input, LoadingState } from "@t360/ui";
import { apiFetch } from "../../lib/api";

type HeroCopy = {
  headline?: string;
  support?: string;
  ctaLabel?: string;
};

type StorefrontSection = {
  type: string;
  visible: boolean;
  order: number;
  message?: string;
  href?: string;
  title?: string;
  query?: { sort?: string; tryOnOnly?: boolean };
  headline?: string;
  body?: string;
  imageUrl?: string;
  ctaHref?: string;
  ctaLabel?: string;
};

type Storefront = {
  businessName: string;
  hero: {
    imageUrl?: string;
    videoUrl?: string;
    en?: HeroCopy;
    ta?: HeroCopy;
  } | null;
  sections?: StorefrontSection[];
};

const emptyCopy = (): HeroCopy => ({ headline: "", support: "", ctaLabel: "" });

export default function StorefrontPage() {
  const queryClient = useQueryClient();
  const [imageUrl, setImageUrl] = React.useState("");
  const [videoUrl, setVideoUrl] = React.useState("");
  const [en, setEn] = React.useState<HeroCopy>(emptyCopy());
  const [ta, setTa] = React.useState<HeroCopy>(emptyCopy());
  const [sections, setSections] = React.useState<StorefrontSection[]>([]);
  const [message, setMessage] = React.useState<string | null>(null);

  const query = useQuery({
    queryKey: ["admin-storefront"],
    queryFn: () => apiFetch<Storefront>("/settings/storefront"),
  });

  React.useEffect(() => {
    if (!query.data?.data) return;
    const hero = query.data.data.hero;
    setImageUrl(hero?.imageUrl ?? "");
    setVideoUrl(hero?.videoUrl ?? "");
    setEn({
      headline: hero?.en?.headline ?? "",
      support: hero?.en?.support ?? "",
      ctaLabel: hero?.en?.ctaLabel ?? "",
    });
    setTa({
      headline: hero?.ta?.headline ?? "",
      support: hero?.ta?.support ?? "",
      ctaLabel: hero?.ta?.ctaLabel ?? "",
    });
    setSections(query.data.data.sections ?? []);
  }, [query.data]);

  const save = useMutation({
    mutationFn: () =>
      apiFetch<Storefront>("/settings/storefront", {
        method: "PUT",
        body: JSON.stringify({
          hero: {
            imageUrl,
            ...(videoUrl.trim() ? { videoUrl: videoUrl.trim() } : {}),
            en: {
              headline: en.headline,
              support: en.support,
              ...(en.ctaLabel?.trim() ? { ctaLabel: en.ctaLabel.trim() } : {}),
            },
            ta: {
              headline: ta.headline,
              support: ta.support,
              ...(ta.ctaLabel?.trim() ? { ctaLabel: ta.ctaLabel.trim() } : {}),
            },
          },
          sections,
        }),
      }),
    onSuccess: async () => {
      setMessage("Storefront saved.");
      await queryClient.invalidateQueries({ queryKey: ["admin-storefront"] });
    },
    onError: (err: Error) => setMessage(err.message),
  });

  function moveSection(index: number, dir: -1 | 1) {
    const next = [...sections];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next.map((s, i) => ({ ...s, order: i })));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Storefront</h1>
        <p className="text-sm text-muted">Homepage hero and section visibility</p>
      </div>

      {query.isLoading ? <LoadingState label="Loading storefront…" /> : null}
      {query.isError ? (
        <ErrorState
          title="Could not load storefront"
          description={query.error.message}
          retryLabel="Retry"
          onRetry={() => query.refetch()}
        />
      ) : null}

      {query.data ? (
        <form
          className="max-w-3xl space-y-8"
          onSubmit={(e) => {
            e.preventDefault();
            setMessage(null);
            save.mutate();
          }}
        >
          <fieldset className="space-y-3">
            <legend className="font-medium">Hero</legend>
            <Input label="Hero image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            <Input
              label="Hero video URL (optional)"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
            <Input
              label="English headline"
              value={en.headline ?? ""}
              onChange={(e) => setEn((c) => ({ ...c, headline: e.target.value }))}
            />
            <Input
              label="English support"
              value={en.support ?? ""}
              onChange={(e) => setEn((c) => ({ ...c, support: e.target.value }))}
            />
            <Input
              label="Tamil headline"
              value={ta.headline ?? ""}
              onChange={(e) => setTa((c) => ({ ...c, headline: e.target.value }))}
            />
            <Input
              label="Tamil support"
              value={ta.support ?? ""}
              onChange={(e) => setTa((c) => ({ ...c, support: e.target.value }))}
            />
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="font-medium">Homepage sections</legend>
            {sections.map((section, index) => (
              <div key={`${section.type}-${index}`} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium capitalize">{section.type.replace(/([A-Z])/g, " $1")}</p>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={section.visible}
                        onChange={(e) =>
                          setSections((rows) =>
                            rows.map((r, i) => (i === index ? { ...r, visible: e.target.checked } : r)),
                          )
                        }
                      />
                      Visible
                    </label>
                    <Button type="button" variant="outline" size="sm" onClick={() => moveSection(index, -1)}>
                      ↑
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => moveSection(index, 1)}>
                      ↓
                    </Button>
                  </div>
                </div>
                {section.type === "announcement" ? (
                  <Input
                    label="Message"
                    className="mt-3"
                    value={section.message ?? ""}
                    onChange={(e) =>
                      setSections((rows) =>
                        rows.map((r, i) => (i === index ? { ...r, message: e.target.value } : r)),
                      )
                    }
                  />
                ) : null}
                {section.type === "productCarousel" ? (
                  <Input
                    label="Carousel title"
                    className="mt-3"
                    value={section.title ?? ""}
                    onChange={(e) =>
                      setSections((rows) =>
                        rows.map((r, i) => (i === index ? { ...r, title: e.target.value } : r)),
                      )
                    }
                  />
                ) : null}
              </div>
            ))}
          </fieldset>

          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save storefront"}
          </Button>
          {message ? <p className="text-sm text-muted">{message}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
