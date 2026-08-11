"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, ProductCard, Select } from "@t360/ui";
import { useLocale } from "../lib/locale";
import type { CategoryNode, ProductListItem } from "../lib/catalog-api";
import { API_URL, productPrice } from "../lib/catalog-api";

function flattenCategories(nodes: CategoryNode[]): Array<{ slug: string; name: string }> {
  const out: Array<{ slug: string; name: string }> = [];
  for (const n of nodes) {
    out.push({ slug: n.slug, name: n.name });
    if (n.children?.length) out.push(...flattenCategories(n.children));
  }
  return out;
}

export function ProductsBrowser({
  initialProducts,
  initialMeta,
  categories,
  brands,
  initialParams = {},
}: {
  initialProducts: ProductListItem[];
  initialMeta?: { total?: number };
  categories: CategoryNode[];
  brands: Array<{ slug: string; name: string }>;
  initialParams?: Record<string, string>;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [q, setQ] = React.useState(initialParams.q ?? "");
  const [sort, setSort] = React.useState(initialParams.sort ?? "newest");
  const [category, setCategory] = React.useState(initialParams.category ?? "");
  const [brand, setBrand] = React.useState(initialParams.brand ?? "");
  const [size, setSize] = React.useState(initialParams.size ?? "");
  const [colour, setColour] = React.useState(initialParams.colour ?? "");
  const [minPrice, setMinPrice] = React.useState(initialParams.minPrice ?? "");
  const [maxPrice, setMaxPrice] = React.useState(initialParams.maxPrice ?? "");
  const [inStockOnly, setInStockOnly] = React.useState(initialParams.availability === "in_stock");
  const [products, setProducts] = React.useState(initialProducts);
  const [total, setTotal] = React.useState(initialMeta?.total ?? initialProducts.length);
  const [loading, setLoading] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<
    Array<{ text: string; type: string; slug?: string }>
  >([]);
  const [showSuggest, setShowSuggest] = React.useState(false);

  const catOptions = flattenCategories(categories);

  React.useEffect(() => {
    if (!q.trim() || q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const handle = window.setTimeout(() => {
      void fetch(`${API_URL}/products/suggest?q=${encodeURIComponent(q.trim())}&limit=8`)
        .then((r) => r.json())
        .then((json) => {
          setSuggestions(Array.isArray(json.data) ? json.data : []);
          setShowSuggest(true);
        })
        .catch(() => setSuggestions([]));
    }, 250);
    return () => window.clearTimeout(handle);
  }, [q]);

  async function runSearch(overrides: Record<string, string> = {}) {
    setLoading(true);
    setShowSuggest(false);
    try {
      const params = new URLSearchParams({ pageSize: "24", sort });
      if (q) params.set("q", q);
      if (category) params.set("category", category);
      if (brand) params.set("brand", brand);
      if (size) params.set("size", size);
      if (colour) params.set("colour", colour);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      if (inStockOnly) params.set("availability", "in_stock");
      Object.entries(overrides).forEach(([k, v]) => {
        if (v) params.set(k, v);
        else params.delete(k);
      });
      const res = await fetch(`${API_URL}/products?${params}`);
      const json = await res.json();
      setProducts(json.data ?? []);
      setTotal(json.meta?.total ?? 0);
      const path = category ? `/categories/${category}` : "/products";
      router.replace(`${path}?${params.toString()}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">{t.navProducts}</h1>
          <p className="text-sm text-muted">
            {total} {t.results}
          </p>
        </div>
      </div>

      <form
        className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          void runSearch();
        }}
      >
        <div className="relative">
          <Input
            label={t.search}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => suggestions.length && setShowSuggest(true)}
            onBlur={() => window.setTimeout(() => setShowSuggest(false), 150)}
          />
          {showSuggest && suggestions.length > 0 ? (
            <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto border border-border bg-elevated shadow-sm">
              {suggestions.map((s) => (
                <li key={`${s.type}-${s.text}-${s.slug ?? ""}`}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-linen"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      if (s.type === "product" && s.slug) {
                        router.push(`/products/${s.slug}`);
                        return;
                      }
                      if (s.type === "category" && s.slug) {
                        setCategory(s.slug);
                        setQ("");
                        void runSearch({ category: s.slug, q: "" });
                        return;
                      }
                      if (s.type === "brand" && s.slug) {
                        setBrand(s.slug);
                        setQ(s.text);
                        void runSearch({ brand: s.slug, q: s.text });
                        return;
                      }
                      setQ(s.text);
                      void runSearch({ q: s.text });
                    }}
                  >
                    <span>{s.text}</span>
                    <span className="text-xs uppercase text-muted">{s.type}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <Select
          label={t.sort}
          value={sort}
          onValueChange={(v) => {
            setSort(v);
            void runSearch({ sort: v });
          }}
          options={[
            { value: "newest", label: t.sortNewest },
            { value: "relevance", label: t.sortRelevance },
            { value: "price_asc", label: t.sortPriceAsc },
            { value: "price_desc", label: t.sortPriceDesc },
          ]}
        />
        <Select
          label={t.category}
          value={category || "__"}
          onValueChange={(v) => setCategory(v === "__" ? "" : v)}
          options={[
            { value: "__", label: "—" },
            ...catOptions.map((c) => ({ value: c.slug, label: c.name })),
          ]}
        />
        <Select
          label={t.brandLabel}
          value={brand || "__"}
          onValueChange={(v) => setBrand(v === "__" ? "" : v)}
          options={[
            { value: "__", label: "—" },
            ...brands.map((b) => ({ value: b.slug, label: b.name })),
          ]}
        />
        <Input label={t.size} value={size} onChange={(e) => setSize(e.target.value)} />
        <Input label={t.colour} value={colour} onChange={(e) => setColour(e.target.value)} />
        <Input
          label={t.minPrice}
          type="number"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
        />
        <Input
          label={t.maxPrice}
          type="number"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
          />
          {t.inStockOnly}
        </label>
        <div className="flex flex-wrap gap-2 self-end">
          <Button type="submit" disabled={loading}>
            {loading ? t.loading : t.applyFilters}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setQ("");
              setCategory("");
              setBrand("");
              setSize("");
              setColour("");
              setMinPrice("");
              setMaxPrice("");
              setInStockOnly(false);
              setSort("newest");
              void runSearch({
                q: "",
                category: "",
                brand: "",
                size: "",
                colour: "",
                minPrice: "",
                maxPrice: "",
                availability: "",
                sort: "newest",
              });
            }}
          >
            {t.clearFilters}
          </Button>
        </div>
      </form>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => {
          const price = productPrice(p);
          const inStock = p.inStock ?? (p.availableQty ?? 0) > 0;
          return (
            <Link key={p.id} href={`/products/${p.slug}`} className="block">
              <ProductCard
                name={p.name}
                brand={p.brand?.name}
                imageUrl={
                  p.images?.[0]?.url ??
                  "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80"
                }
                imageAlt={p.name}
                price={price.amount}
                compareAt={price.compareAt}
                addToCartLabel={inStock ? t.addToCart : t.outOfStock}
              />
              <p className={`mt-2 text-xs ${inStock ? "text-teal" : "text-muted"}`}>
                {inStock ? t.inStock : t.outOfStock}
              </p>
            </Link>
          );
        })}
      </div>
      {!products.length ? (
        <p className="mt-10 text-center text-muted">
          {t.emptyTitle} — {t.emptyDescription}
        </p>
      ) : null}
    </main>
  );
}
