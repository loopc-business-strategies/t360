"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, ErrorState, Input, LoadingState } from "@t360/ui";
import { apiFetch } from "../../lib/api";
import { MediaImagePicker } from "../../components/media-image-picker";

type HeroCopy = {
  headline?: string;
  support?: string;
  ctaLabel?: string;
  subtitle?: string;
};

type StorefrontSection = {
  type: string;
  visible: boolean;
  order: number;
  message?: string;
  href?: string;
  title?: string;
  query?: { sort?: string; tryOnOnly?: boolean; collectionSlug?: string; categorySlug?: string };
  headline?: string;
  body?: string;
  subtitle?: string;
  imageUrl?: string;
  ctaHref?: string;
  ctaLabel?: string;
  collectionSlug?: string;
  videoUrl?: string;
};

type Storefront = {
  businessName: string;
  hasDraft?: boolean;
  hero: {
    imageUrl?: string;
    desktopImageUrl?: string;
    mobileImageUrl?: string;
    videoUrl?: string;
    ctaHref?: string;
    en?: HeroCopy;
    ta?: HeroCopy;
  } | null;
  sections?: StorefrontSection[];
};

const emptyCopy = (): HeroCopy => ({ headline: "", support: "", ctaLabel: "" });

export default function StorefrontPage() {
  const queryClient = useQueryClient();
  const [useDraft, setUseDraft] = React.useState(true);
  const [desktopImageUrl, setDesktopImageUrl] = React.useState("");
  const [mobileImageUrl, setMobileImageUrl] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [videoUrl, setVideoUrl] = React.useState("");
  const [ctaHref, setCtaHref] = React.useState("/products");
  const [en, setEn] = React.useState<HeroCopy>(emptyCopy());
  const [ta, setTa] = React.useState<HeroCopy>(emptyCopy());
  const [sections, setSections] = React.useState<StorefrontSection[]>([]);
  const [message, setMessage] = React.useState<string | null>(null);

  const query = useQuery({
    queryKey: ["admin-storefront", useDraft ? "draft" : "live"],
    queryFn: () =>
      apiFetch<Storefront>(useDraft ? "/settings/storefront/draft" : "/settings/storefront"),
  });

  React.useEffect(() => {
    if (!query.data?.data) return;
    const hero = query.data.data.hero;
    setDesktopImageUrl(hero?.desktopImageUrl ?? hero?.imageUrl ?? "");
    setMobileImageUrl(hero?.mobileImageUrl ?? hero?.imageUrl ?? "");
    setImageUrl(hero?.imageUrl ?? "");
    setVideoUrl(hero?.videoUrl ?? "");
    setCtaHref(hero?.ctaHref ?? "/products");
    setEn({
      headline: hero?.en?.headline ?? "",
      support: hero?.en?.support ?? "",
      ctaLabel: hero?.en?.ctaLabel ?? "",
      subtitle: hero?.en?.subtitle ?? "",
    });
    setTa({
      headline: hero?.ta?.headline ?? "",
      support: hero?.ta?.support ?? "",
      ctaLabel: hero?.ta?.ctaLabel ?? "",
      subtitle: hero?.ta?.subtitle ?? "",
    });
    setSections(query.data.data.sections ?? []);
  }, [query.data]);

  const save = useMutation({
    mutationFn: (draft: boolean) =>
      apiFetch<Storefront>("/settings/storefront", {
        method: "PUT",
        body: JSON.stringify({
          draft,
          hero: {
            imageUrl: imageUrl || desktopImageUrl,
            desktopImageUrl,
            mobileImageUrl,
            ctaHref,
            ...(videoUrl.trim() ? { videoUrl: videoUrl.trim() } : {}),
            en: {
              headline: en.headline,
              support: en.support,
              subtitle: en.subtitle,
              ...(en.ctaLabel?.trim() ? { ctaLabel: en.ctaLabel.trim() } : {}),
            },
            ta: {
              headline: ta.headline,
              support: ta.support,
              subtitle: ta.subtitle,
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

  const publish = useMutation({
    mutationFn: () => apiFetch<Storefront>("/settings/storefront/publish", { method: "POST" }),
    onSuccess: async () => {
      setMessage("Published to live storefront.");
      setUseDraft(false);
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

  function addSection(type: string) {
    setSections((rows) => [
      ...rows,
      {
        type,
        visible: true,
        order: rows.length,
        title: type === "productCarousel" ? "Featured" : undefined,
        message: type === "announcement" ? "Welcome" : undefined,
      },
    ]);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Storefront</h1>
          <p className="text-sm text-muted">Draft / preview / publish homepage CMS</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => setUseDraft((v) => !v)}>
            {useDraft ? "View live" : "Edit draft"}
          </Button>
          <Button type="button" variant="outline" disabled>
            Preview (save draft first)
          </Button>
          <Button type="button" disabled={publish.isPending} onClick={() => publish.mutate()}>
            {publish.isPending ? "Publishing…" : "Publish"}
          </Button>
        </div>
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
            save.mutate(useDraft);
          }}
        >
          <fieldset className="space-y-3">
            <legend className="font-medium">Hero</legend>
            <MediaImagePicker
              label="Desktop hero image"
              value={desktopImageUrl}
              onChange={(url) => {
                setDesktopImageUrl(url);
                if (!imageUrl) setImageUrl(url);
              }}
            />
            <Input label="Desktop image URL" value={desktopImageUrl} onChange={(e) => setDesktopImageUrl(e.target.value)} />
            <MediaImagePicker
              label="Mobile hero image"
              value={mobileImageUrl}
              onChange={(url) => setMobileImageUrl(url)}
            />
            <Input label="Mobile image URL" value={mobileImageUrl} onChange={(e) => setMobileImageUrl(e.target.value)} />
            <MediaImagePicker
              label="Fallback hero image"
              value={imageUrl}
              onChange={(url) => setImageUrl(url)}
            />
            <Input label="Fallback image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            <Input label="Hero video URL (optional)" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
            <Input label="CTA href" value={ctaHref} onChange={(e) => setCtaHref(e.target.value)} />
            <Input label="English headline" value={en.headline ?? ""} onChange={(e) => setEn((c) => ({ ...c, headline: e.target.value }))} />
            <Input label="English support" value={en.support ?? ""} onChange={(e) => setEn((c) => ({ ...c, support: e.target.value }))} />
            <Input label="Tamil headline" value={ta.headline ?? ""} onChange={(e) => setTa((c) => ({ ...c, headline: e.target.value }))} />
            <Input label="Tamil support" value={ta.support ?? ""} onChange={(e) => setTa((c) => ({ ...c, support: e.target.value }))} />
          </fieldset>

          <fieldset className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <legend className="font-medium">Homepage sections</legend>
              <div className="flex flex-wrap gap-2">
                {["announcement", "productCarousel", "collection", "editorial", "tryMePromo", "sale"].map((type) => (
                  <Button key={type} type="button" variant="outline" size="sm" onClick={() => addSection(type)}>
                    + {type}
                  </Button>
                ))}
              </div>
            </div>
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSections((rows) => rows.filter((_, i) => i !== index))}
                    >
                      Remove
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
                {section.type === "productCarousel" || section.type === "collection" ? (
                  <>
                    <Input
                      label="Title"
                      className="mt-3"
                      value={section.title ?? ""}
                      onChange={(e) =>
                        setSections((rows) =>
                          rows.map((r, i) => (i === index ? { ...r, title: e.target.value } : r)),
                        )
                      }
                    />
                    {section.type === "collection" ? (
                      <Input
                        label="Collection slug"
                        className="mt-3"
                        value={section.collectionSlug ?? ""}
                        onChange={(e) =>
                          setSections((rows) =>
                            rows.map((r, i) => (i === index ? { ...r, collectionSlug: e.target.value } : r)),
                          )
                        }
                      />
                    ) : null}
                  </>
                ) : null}
                {section.type === "editorial" || section.type === "sale" || section.type === "promotion" ? (
                  <div className="mt-3 space-y-3">
                    <MediaImagePicker
                      label="Section image"
                      value={section.imageUrl}
                      onChange={(url) =>
                        setSections((rows) =>
                          rows.map((r, i) => (i === index ? { ...r, imageUrl: url } : r)),
                        )
                      }
                    />
                    <Input
                      label="Headline"
                      value={section.headline ?? ""}
                      onChange={(e) =>
                        setSections((rows) =>
                          rows.map((r, i) => (i === index ? { ...r, headline: e.target.value } : r)),
                        )
                      }
                    />
                    <Input
                      label="CTA href"
                      value={section.ctaHref ?? ""}
                      onChange={(e) =>
                        setSections((rows) =>
                          rows.map((r, i) => (i === index ? { ...r, ctaHref: e.target.value } : r)),
                        )
                      }
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </fieldset>

          <div className="flex gap-2">
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : useDraft ? "Save draft" : "Save live"}
            </Button>
          </div>
          {message ? <p className="text-sm text-muted">{message}</p> : null}
          {query.data.data.hasDraft ? (
            <p className="text-sm text-brass">Draft changes pending publish.</p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
