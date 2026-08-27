"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FilterSidebar, Input, Pagination, Select } from "@t360/ui";
import { useLocale } from "../lib/locale";
import type { CategoryNode, CollectionItem, ProductListItem } from "../lib/catalog-api";
import { API_URL } from "../lib/catalog-api";
import { ProductCardInteractive } from "./store/product-card-interactive";
import { QuickViewModal } from "./store/quick-view-modal";

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
  collections = [],
  initialParams = {},
}: {
  initialProducts: ProductListItem[];
  initialMeta?: { total?: number; pageSize?: number; page?: number };
  categories: CategoryNode[];
  brands: Array<{ slug: string; name: string }>;
  collections?: Array<{ slug: string; name: string }>;
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
  const [tryOnOnly, setTryOnOnly] = React.useState(initialParams.tryOnEnabled === "true");
  const [collection, setCollection] = React.useState(initialParams.collection ?? "");
  const [quickView, setQuickView] = React.useState<ProductListItem | null>(null);
  const [page, setPage] = React.useState(Number(initialParams.page ?? initialMeta?.page ?? 1));
  const [products, setProducts] = React.useState(initialProducts);
  const [total, setTotal] = React.useState(initialMeta?.total ?? initialProducts.length);
  const [pageSize] = React.useState(initialMeta?.pageSize ?? 24);
  const [loading, setLoading] = React.useState(false);
  const requestSeq = React.useRef(0);
  const syncedCategory = React.useRef(initialParams.category ?? "");

  React.useEffect(() => {
    const nextCat = initialParams.category ?? "";
    if (syncedCategory.current === nextCat) return;
    syncedCategory.current = nextCat;
    setCategory(nextCat);
    setQ(initialParams.q ?? "");
    setSort(initialParams.sort ?? "newest");
    setProducts(initialProducts);
    setTotal(initialMeta?.total ?? initialProducts.length);
    setPage(Number(initialParams.page ?? initialMeta?.page ?? 1));
  }, [initialParams.category, initialParams.q, initialParams.sort, initialParams.page, initialProducts, initialMeta]);

  const catOptions = flattenCategories(categories);

  async function runSearch(overrides: Record<string, string> = {}, nextPage = page) {
    const seq = ++requestSeq.current;
    setLoading(true);
    setProducts([]);
    setTotal(0);
    try {
      const params = new URLSearchParams({ pageSize: String(pageSize), page: String(nextPage), sort });
      if (q) params.set("q", q);
      if (category) params.set("category", category);
      if (brand) params.set("brand", brand);
      if (size) params.set("size", size);
      if (colour) params.set("colour", colour);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      if (inStockOnly) params.set("availability", "in_stock");
      if (tryOnOnly) params.set("tryOnEnabled", "true");
      if (collection) params.set("collection", collection);
      if (initialParams.isNew) params.set("isNew", initialParams.isNew);
      if (initialParams.isBestseller) params.set("isBestseller", initialParams.isBestseller);
      if (initialParams.isTrending) params.set("isTrending", initialParams.isTrending);
      if (initialParams.isFeatured) params.set("isFeatured", initialParams.isFeatured);
      if (initialParams.onSale) params.set("onSale", initialParams.onSale);
      Object.entries(overrides).forEach(([k, v]) => {
        if (v) params.set(k, v);
        else params.delete(k);
      });
      const res = await fetch(`${API_URL}/products?${params}`);
      const json = await res.json();
      if (seq !== requestSeq.current) return;
      setProducts(json.data ?? []);
      setTotal(json.meta?.total ?? 0);
      setPage(nextPage);
      const path = category ? `/categories/${category}` : "/products";
      router.replace(`${path}?${params.toString()}`);
    } finally {
      if (seq === requestSeq.current) setLoading(false);
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

      <div className="mt-8 grid gap-8 lg:grid-cols-[16rem_1fr]">
        <FilterSidebar
          title={t.filters}
          applyLabel={t.applyFilters}
          clearLabel={t.clearFilters}
          loading={loading}
          onApply={() => void runSearch({}, 1)}
          onClear={() => {
            setQ("");
            setCategory("");
            setBrand("");
            setSize("");
            setColour("");
            setMinPrice("");
            setMaxPrice("");
            setInStockOnly(false);
            setTryOnOnly(false);
            setCollection("");
            setSort("newest");
            void runSearch(
              {
                q: "",
                category: "",
                brand: "",
                collection: "",
                size: "",
                colour: "",
                minPrice: "",
                maxPrice: "",
                availability: "",
                tryOnEnabled: "",
                sort: "newest",
              },
              1,
            );
          }}
        >
          <Input label={t.search} value={q} onChange={(e) => setQ(e.target.value)} />
          <Select
            label={t.sort}
            value={sort}
            onValueChange={setSort}
            options={[
              { value: "newest", label: t.sortNewest },
              { value: "relevance", label: t.sortRelevance },
              { value: "featured", label: "Featured" },
              { value: "trending", label: "Trending" },
              { value: "rating", label: "Top rated" },
              { value: "bestselling", label: "Best selling" },
              { value: "price_asc", label: t.sortPriceAsc },
              { value: "price_desc", label: t.sortPriceDesc },
            ]}
          />
          {collections.length ? (
            <Select
              label="Collection"
              value={collection || "__"}
              onValueChange={(v) => setCollection(v === "__" ? "" : v)}
              options={[
                { value: "__", label: "—" },
                ...collections.map((c) => ({ value: c.slug, label: c.name })),
              ]}
            />
          ) : null}
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
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
            />
            {t.inStockOnly}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={tryOnOnly} onChange={(e) => setTryOnOnly(e.target.checked)} />
            {t.tryMeFilter ?? "TRY ME available"}
          </label>
        </FilterSidebar>

        <div>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((p) => (
              <ProductCardInteractive
                key={p.id}
                product={p}
                onQuickView={() => setQuickView(p)}
              />
            ))}
          </div>
          {!products.length ? (
            <p className="mt-10 text-center text-muted">
              {loading ? "Loading…" : `${t.emptyTitle} — ${t.emptyDescription}`}
            </p>
          ) : null}
          <div className="mt-10 flex justify-center">
            <Pagination
              page={page}
              pageCount={Math.max(1, Math.ceil(total / pageSize))}
              onPageChange={(p) => void runSearch({}, p)}
              previousLabel={t.paginationPrev ?? "Previous"}
              nextLabel={t.paginationNext ?? "Next"}
            />
          </div>
        </div>
      </div>
      <QuickViewModal
        product={quickView}
        open={Boolean(quickView)}
        onClose={() => setQuickView(null)}
        addLabel={t.addToCart}
        tryMeLabel={t.tryMe}
      />
    </main>
  );
}
