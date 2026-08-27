"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FilterSidebar, Input, Pagination, Select } from "@t360/ui";
import { useLocale } from "../lib/locale";
import type { CategoryNode, ProductListItem } from "../lib/catalog-api";
import { API_URL } from "../lib/catalog-api";
import { ProductCardInteractive } from "./store/product-card-interactive";

function flattenCategories(nodes: CategoryNode[]): Array<{ slug: string; name: string }> {
  const out: Array<{ slug: string; name: string }> = [];
  for (const n of nodes) {
    out.push({ slug: n.slug, name: n.name });
    if (n.children?.length) out.push(...flattenCategories(n.children));
  }
  return out;
}

export function SearchClient({
  initialProducts,
  initialMeta,
  categories,
  brands,
  initialQuery = "",
  initialPage = 1,
}: {
  initialProducts: ProductListItem[];
  initialMeta?: { total?: number; pageSize?: number };
  categories: CategoryNode[];
  brands: Array<{ slug: string; name: string }>;
  initialQuery?: string;
  initialPage?: number;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [q, setQ] = React.useState(initialQuery);
  const [sort, setSort] = React.useState("relevance");
  const [category, setCategory] = React.useState("");
  const [brand, setBrand] = React.useState("");
  const [tryOnOnly, setTryOnOnly] = React.useState(false);
  const [page, setPage] = React.useState(initialPage);
  const [products, setProducts] = React.useState(initialProducts);
  const [total, setTotal] = React.useState(initialMeta?.total ?? initialProducts.length);
  const [pageSize] = React.useState(initialMeta?.pageSize ?? 24);
  const [loading, setLoading] = React.useState(false);

  const catOptions = flattenCategories(categories);

  async function runSearch(nextPage = page) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        pageSize: String(pageSize),
        page: String(nextPage),
        sort,
      });
      if (q) params.set("q", q);
      if (category) params.set("category", category);
      if (brand) params.set("brand", brand);
      if (tryOnOnly) params.set("tryOnEnabled", "true");
      const res = await fetch(`${API_URL}/products?${params}`);
      const json = await res.json();
      setProducts(json.data ?? []);
      setTotal(json.meta?.total ?? 0);
      setPage(nextPage);
      router.replace(`/search?${params.toString()}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-display text-3xl">{t.searchResults ?? t.search}</h1>
      {q ? <p className="mt-2 text-sm text-muted">&ldquo;{q}&rdquo; · {total} {t.results}</p> : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[16rem_1fr]">
        <FilterSidebar
          title={t.filters}
          applyLabel={t.applyFilters}
          clearLabel={t.clearFilters}
          loading={loading}
          onApply={() => void runSearch(1)}
          onClear={() => {
            setCategory("");
            setBrand("");
            setTryOnOnly(false);
            setSort("relevance");
            void runSearch(1);
          }}
        >
          <Select
            label={t.sort}
            value={sort}
            onValueChange={setSort}
            options={[
              { value: "relevance", label: t.sortRelevance },
              { value: "newest", label: t.sortNewest },
              { value: "price_asc", label: t.sortPriceAsc },
              { value: "price_desc", label: t.sortPriceDesc },
            ]}
          />
          <Select
            label={t.category}
            value={category || "__"}
            onValueChange={(v) => setCategory(v === "__" ? "" : v)}
            options={[{ value: "__", label: "—" }, ...catOptions.map((c) => ({ value: c.slug, label: c.name }))]}
          />
          <Select
            label={t.brandLabel}
            value={brand || "__"}
            onValueChange={(v) => setBrand(v === "__" ? "" : v)}
            options={[{ value: "__", label: "—" }, ...brands.map((b) => ({ value: b.slug, label: b.name }))]}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={tryOnOnly} onChange={(e) => setTryOnOnly(e.target.checked)} />
            {t.tryMeFilter ?? "TRY ME available"}
          </label>
        </FilterSidebar>

        <div>
          <form
            className="mb-6 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void runSearch(1);
            }}
          >
            <Input label={t.search} value={q} onChange={(e) => setQ(e.target.value)} className="flex-1" />
          </form>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCardInteractive key={p.id} product={p} />
            ))}
          </div>
          {!products.length ? (
            <p className="mt-10 text-center text-muted">
              {t.emptyTitle} — {t.emptyDescription}
            </p>
          ) : null}
          <div className="mt-10 flex justify-center">
            <Pagination
              page={page}
              pageCount={Math.max(1, Math.ceil(total / pageSize))}
              onPageChange={(p) => void runSearch(p)}
              previousLabel={t.paginationPrev ?? "Previous"}
              nextLabel={t.paginationNext ?? "Next"}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export { SearchClient as default };
