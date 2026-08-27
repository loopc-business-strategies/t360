"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { ErrorState, LoadingState } from "@t360/ui";
import { HomeClient } from "../../../components/home-client";
import type { CategoryNode, StorefrontSettings } from "../../../lib/catalog-api";
import { API_URL, fetchCategories } from "../../../lib/catalog-api";

/**
 * Admin draft storefront preview. Pass ?token=<admin access JWT>
 * (admin storefront editor can open this in an iframe / new tab).
 */
export default function StorefrontPreviewClient() {
  const sp = useSearchParams();
  const token = sp.get("token");
  const [storefront, setStorefront] = React.useState<StorefrontSettings | null>(null);
  const [categories, setCategories] = React.useState<CategoryNode[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!token) {
      setError("Admin token required. Open from the storefront editor or append ?token=…");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [draftRes, cats] = await Promise.all([
          fetch(`${API_URL}/settings/storefront/draft`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then(async (r) => {
            const json = await r.json();
            if (!r.ok || !json.success) {
              throw new Error(json?.error?.message ?? "Failed to load draft storefront");
            }
            return json.data as StorefrontSettings;
          }),
          fetchCategories()
            .then((c) => c.data)
            .catch(() => [] as CategoryNode[]),
        ]);
        if (cancelled) return;
        setStorefront(draftRes);
        setCategories(cats);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Preview failed");
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) return <LoadingState label="Loading draft preview…" />;
  if (error) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16">
        <ErrorState title="Preview unavailable" description={error} />
      </main>
    );
  }

  return (
    <div>
      <div className="bg-wine px-4 py-2 text-center text-xs text-elevated">
        Draft storefront preview — not live
      </div>
      <HomeClient categories={categories} storefront={storefront} />
    </div>
  );
}
