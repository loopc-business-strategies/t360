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

type Storefront = {
  businessName: string;
  hero: {
    imageUrl?: string;
    en?: HeroCopy;
    ta?: HeroCopy;
  } | null;
};

const emptyCopy = (): HeroCopy => ({ headline: "", support: "", ctaLabel: "" });

export default function StorefrontPage() {
  const queryClient = useQueryClient();
  const [imageUrl, setImageUrl] = React.useState("");
  const [en, setEn] = React.useState<HeroCopy>(emptyCopy());
  const [ta, setTa] = React.useState<HeroCopy>(emptyCopy());
  const [message, setMessage] = React.useState<string | null>(null);

  const query = useQuery({
    queryKey: ["admin-storefront"],
    queryFn: () => apiFetch<Storefront>("/settings/storefront"),
  });

  React.useEffect(() => {
    if (!query.data?.data) return;
    const hero = query.data.data.hero;
    setImageUrl(hero?.imageUrl ?? "");
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
  }, [query.data]);

  const save = useMutation({
    mutationFn: () =>
      apiFetch<Storefront>("/settings/storefront", {
        method: "PUT",
        body: JSON.stringify({
          hero: {
            imageUrl,
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
        }),
      }),
    onSuccess: async () => {
      setMessage("Homepage hero saved.");
      await queryClient.invalidateQueries({ queryKey: ["admin-storefront"] });
    },
    onError: (err: Error) => setMessage(err.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Storefront</h1>
        <p className="text-sm text-muted">Edit the customer homepage hero (EN + TA)</p>
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
          className="max-w-2xl space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            setMessage(null);
            save.mutate();
          }}
        >
          <Input
            label="Hero image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
          />

          <fieldset className="space-y-3">
            <legend className="font-medium">English</legend>
            <Input
              label="Headline"
              value={en.headline ?? ""}
              onChange={(e) => setEn((c) => ({ ...c, headline: e.target.value }))}
            />
            <Input
              label="Support"
              value={en.support ?? ""}
              onChange={(e) => setEn((c) => ({ ...c, support: e.target.value }))}
            />
            <Input
              label="CTA label (optional)"
              value={en.ctaLabel ?? ""}
              onChange={(e) => setEn((c) => ({ ...c, ctaLabel: e.target.value }))}
            />
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="font-medium">Tamil</legend>
            <Input
              label="Headline"
              value={ta.headline ?? ""}
              onChange={(e) => setTa((c) => ({ ...c, headline: e.target.value }))}
            />
            <Input
              label="Support"
              value={ta.support ?? ""}
              onChange={(e) => setTa((c) => ({ ...c, support: e.target.value }))}
            />
            <Input
              label="CTA label (optional)"
              value={ta.ctaLabel ?? ""}
              onChange={(e) => setTa((c) => ({ ...c, ctaLabel: e.target.value }))}
            />
          </fieldset>

          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save hero"}
          </Button>
          {message ? <p className="text-sm text-muted">{message}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
