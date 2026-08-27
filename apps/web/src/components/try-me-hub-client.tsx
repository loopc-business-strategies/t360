"use client";

import * as React from "react";
import Link from "next/link";
import { Button, ProductCarousel, ProductCarouselItem } from "@t360/ui";
import { useLocale } from "../lib/locale";
import { API_URL, fetchProducts, type ProductListItem } from "../lib/catalog-api";
import { ProductCardInteractive } from "./store/product-card-interactive";
import { apiFetch, getCustomerToken } from "../lib/api";

export function TryMeHubClient() {
  const { t } = useLocale();
  const [products, setProducts] = React.useState<ProductListItem[]>([]);
  const [recent, setRecent] = React.useState<Array<{ id: string; productName?: string; createdAt: string }>>([]);

  React.useEffect(() => {
    void fetchProducts({ tryOnEnabled: "true", pageSize: "12" })
      .then((res) => setProducts(res.data))
      .catch(() => setProducts([]));
  }, []);

  React.useEffect(() => {
    if (!getCustomerToken()) return;
    void apiFetch<{ items: Array<{ id: string; product?: { name?: string }; createdAt: string }> }>(
      "/ai/fashion/try-on/history?pageSize=8",
    )
      .then((res) => {
        const items = res.data.items ?? [];
        setRecent(
          items.map((job) => ({
            id: job.id,
            productName: job.product?.name,
            createdAt: job.createdAt,
          })),
        );
      })
      .catch(() => setRecent([]));
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-display text-4xl">{t.tryMeTitle ?? "TRY ME"}</h1>
      <p className="mt-3 max-w-xl text-muted">{t.tryMeGuide ?? t.tryMeDisclaimer}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/account/try-ons">
          <Button variant="outline">{t.tryMeHistory ?? "Your try-ons"}</Button>
        </Link>
        <Link href="/products?tryOnEnabled=true">
          <Button>{t.tryMeShop ?? t.ctaShop}</Button>
        </Link>
      </div>

      {recent.length ? (
        <section className="mt-12">
          <h2 className="font-display text-2xl">{t.tryMeHistory ?? "Recent try-ons"}</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {recent.map((job) => (
              <li key={job.id} className="rounded-md border border-border px-4 py-3">
                {job.productName ?? "Try-on"} · {new Date(job.createdAt).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-12">
        <ProductCarousel title={t.tryMeShop ?? "Shop try-on styles"}>
          {products.map((p) => (
            <ProductCarouselItem key={p.id}>
              <ProductCardInteractive product={p} />
            </ProductCarouselItem>
          ))}
        </ProductCarousel>
      </section>
    </main>
  );
}
