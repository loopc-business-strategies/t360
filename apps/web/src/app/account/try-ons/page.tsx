"use client";

import * as React from "react";
import Link from "next/link";
import { Button, LoadingState } from "@t360/ui";
import { apiFetch, getCustomerToken } from "../../../lib/api";
import { useLocale } from "../../../lib/locale";

type HistoryItem = {
  id: string;
  status: string;
  resultImageUrl?: string | null;
  inputImageUrl?: string | null;
  productId: string;
  product?: { name?: string; slug?: string } | null;
  createdAt: string;
  expiresAt?: string | null;
};

export default function TryOnHistoryPage() {
  const { t } = useLocale();
  const [items, setItems] = React.useState<HistoryItem[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    if (!getCustomerToken()) {
      window.location.href = "/account?redirect=/account/try-ons";
      return;
    }
    void apiFetch<{ items: HistoryItem[] } | HistoryItem[]>("/ai/fashion/try-on/history")
      .then((res) => {
        const data = res.data;
        setItems(Array.isArray(data) ? data : data.items ?? []);
        setReady(true);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load");
        setReady(true);
      });
  }, []);

  async function remove(id: string) {
    try {
      await apiFetch(`/ai/fashion/try-on/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  if (!ready) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <LoadingState />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/account" className="text-sm text-wine hover:underline">
            ← {t.accountTitle}
          </Link>
          <h1 className="mt-2 font-display text-3xl">{t.tryMeHistory}</h1>
        </div>
        <Link href="/products">
          <Button type="button" variant="secondary">
            {t.tryMeAnother}
          </Button>
        </Link>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {!items.length ? (
        <p className="text-sm text-muted">{t.emptyTitle}</p>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id} className="flex flex-wrap gap-4 border border-border bg-elevated p-4">
              {item.resultImageUrl || item.inputImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.resultImageUrl || item.inputImageUrl || ""}
                  alt=""
                  className="h-28 w-20 rounded object-cover"
                />
              ) : (
                <div className="flex h-28 w-20 items-center justify-center rounded bg-canvas text-xs text-muted">
                  —
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-1 text-sm">
                <p className="font-medium">{item.product?.name ?? item.productId}</p>
                <p className="text-muted">
                  {item.status} · {new Date(item.createdAt).toLocaleString()}
                </p>
                {item.status === "EXPIRED" ? (
                  <p className="text-xs text-muted">{t.tryMeExpired}</p>
                ) : null}
                <div className="flex flex-wrap gap-2 pt-2">
                  {item.product?.slug ? (
                    <Link href={`/products/${item.product.slug}`}>
                      <Button type="button" variant="outline">
                        {t.viewProduct}
                      </Button>
                    </Link>
                  ) : null}
                  <Button type="button" variant="outline" onClick={() => void remove(item.id)}>
                    {t.delete}
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
