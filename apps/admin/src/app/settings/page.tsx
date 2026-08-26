"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Card, ErrorState, Input, LoadingState } from "@t360/ui";
import { RequirePerm } from "../../components/require-perm";
import { apiFetch } from "../../lib/api";

type Field = {
  key: string;
  label: string;
  type: string;
  editable: boolean;
  value: unknown;
  description?: string;
};

type Category = {
  id: string;
  title: string;
  description: string;
  fields: Field[];
  links?: Array<{ href: string; label: string }>;
  status?: Record<string, unknown>;
  branding?: { hero?: unknown; businessName?: string };
};

type Catalog = { categories: Category[] };

function fieldFormKey(key: string) {
  const map: Record<string, string> = {
    "business.name": "businessName",
    "business.phone": "phone",
    "business.email": "email",
    "business.address": "address",
    "business.timezone": "timezone",
    "business.currency": "currency",
    "business.language": "language",
    "commerce.codEnabled": "codEnabled",
    "commerce.shippingFee": "shippingFee",
    "commerce.freeShippingAbove": "freeShippingAbove",
    "media.maxUploadBytes": "maxUploadBytes",
  };
  return map[key] ?? key;
}

function SettingsControlCenter() {
  const qc = useQueryClient();
  const catalog = useQuery({
    queryKey: ["admin-settings-catalog"],
    queryFn: () => apiFetch<Catalog>("/admin/settings/catalog"),
  });

  const [drafts, setDrafts] = React.useState<Record<string, Record<string, unknown>>>({});
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!catalog.data?.data?.categories) return;
    const next: Record<string, Record<string, unknown>> = {};
    for (const cat of catalog.data.data.categories) {
      const form: Record<string, unknown> = {};
      for (const f of cat.fields) {
        form[fieldFormKey(f.key)] = f.value;
      }
      next[cat.id] = form;
    }
    setDrafts(next);
  }, [catalog.data]);

  const save = useMutation({
    mutationFn: ({ category, body }: { category: string; body: Record<string, unknown> }) =>
      apiFetch(`/admin/settings/${category}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      setMessage("Saved");
      void qc.invalidateQueries({ queryKey: ["admin-settings-catalog"] });
      setTimeout(() => setMessage(null), 2000);
    },
  });

  if (catalog.isLoading) return <LoadingState label="Loading settings…" />;
  if (catalog.isError || !catalog.data) {
    return (
      <ErrorState
        title="Settings unavailable"
        description={catalog.error?.message}
        onRetry={() => catalog.refetch()}
      />
    );
  }

  const categories = catalog.data.data.categories;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Settings</h1>
        <p className="text-sm text-muted">
          Shared with Admin Mobile — same API and database. Secrets stay on the server.
        </p>
        {message ? <p className="mt-2 text-sm text-success">{message}</p> : null}
        {save.isError ? (
          <p className="mt-2 text-sm text-danger">{(save.error as Error).message}</p>
        ) : null}
      </div>

      {categories.map((cat) => {
        const form = drafts[cat.id] ?? {};
        const editable = cat.fields.some((f) => f.editable);
        return (
          <Card key={cat.id} className="space-y-4">
            <div>
              <h2 className="font-display text-xl">{cat.title}</h2>
              <p className="text-sm text-muted">{cat.description}</p>
            </div>

            {cat.id === "system" && cat.status ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <StatusPill label="Overall" value={String(cat.status.overall ?? "—")} />
                <StatusPill label="Database" value={String(cat.status.database ?? "—")} />
                <StatusPill label="Redis" value={String(cat.status.redis ?? "—")} />
                <StatusPill
                  label="Storage"
                  value={String((cat.status.storage as { provider?: string })?.provider ?? "—")}
                />
                <StatusPill
                  label="Fashion AI"
                  value={
                    (cat.status.fashionAi as { configured?: boolean; provider?: string })?.configured
                      ? String((cat.status.fashionAi as { provider?: string }).provider)
                      : "not configured"
                  }
                />
                <StatusPill label="App version" value={String(cat.status.appVersion ?? "—")} />
              </div>
            ) : null}

            {cat.id === "storage" && cat.status ? (
              <Badge
                tone={(cat.status as { configured?: boolean }).configured ? "success" : "neutral"}
              >
                {(cat.status as { configured?: boolean }).configured
                  ? "Cloudinary configured"
                  : "Storage mock / not configured"}
              </Badge>
            ) : null}

            {cat.fields.map((f) => {
              const fk = fieldFormKey(f.key);
              const val = form[fk];
              if (f.type === "boolean") {
                return (
                  <label key={f.key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(val)}
                      disabled={!f.editable}
                      onChange={(e) =>
                        setDrafts((d) => ({
                          ...d,
                          [cat.id]: { ...d[cat.id], [fk]: e.target.checked },
                        }))
                      }
                    />
                    {f.label}
                  </label>
                );
              }
              return (
                <Input
                  key={f.key}
                  label={f.label}
                  type={f.type === "number" ? "number" : "text"}
                  value={val == null ? "" : String(val)}
                  disabled={!f.editable}
                  onChange={(e) =>
                    setDrafts((d) => ({
                      ...d,
                      [cat.id]: {
                        ...d[cat.id],
                        [fk]:
                          f.type === "number"
                            ? Number(e.target.value)
                            : e.target.value,
                      },
                    }))
                  }
                />
              );
            })}

            {cat.links?.length ? (
              <div className="flex flex-wrap gap-2">
                {cat.links.map((l) => (
                  <Link key={l.href} href={l.href}>
                    <Button type="button" variant="outline">
                      {l.label}
                    </Button>
                  </Link>
                ))}
              </div>
            ) : null}

            {editable ? (
              <Button
                type="button"
                disabled={save.isPending}
                onClick={() => save.mutate({ category: cat.id, body: form })}
              >
                {save.isPending ? "Saving…" : `Save ${cat.title}`}
              </Button>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  const tone =
    value === "healthy" || value === "up" || value === "cloudinary" || value === "fashn"
      ? "success"
      : value === "warning" || value === "mock" || value === "disabled" || value === "not configured"
        ? "neutral"
        : value === "error" || value === "down"
          ? "danger"
          : "neutral";
  return (
    <div className="rounded-md border border-border p-3">
      <p className="text-xs uppercase text-muted">{label}</p>
      <Badge tone={tone} className="mt-1">
        {value}
      </Badge>
    </div>
  );
}

export default function SettingsHomePage() {
  return (
    <RequirePerm anyOf={["settings.manage"]}>
      <SettingsControlCenter />
    </RequirePerm>
  );
}
