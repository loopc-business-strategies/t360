import { Suspense } from "react";
import { ProductsBrowser } from "../components/products-browser";
import { fetchBrands, fetchCategories, fetchCollections, fetchProducts } from "./catalog-api";
import { LoadingState } from "@t360/ui";

/** Shared PLP loader for /products aliases (/men, /sale, /collections/…). */
export async function CatalogPlpPage({
  searchParams,
  defaults = {},
}: {
  searchParams: Promise<Record<string, string | undefined>> | Record<string, string | undefined>;
  defaults?: Record<string, string>;
}) {
  const sp = await Promise.resolve(searchParams);
  const params: Record<string, string> = {
    pageSize: "24",
    sort: sp.sort ?? defaults.sort ?? "newest",
    ...defaults,
  };
  for (const key of [
    "q",
    "category",
    "brand",
    "size",
    "colour",
    "minPrice",
    "maxPrice",
    "availability",
    "collection",
    "tryOnEnabled",
    "isNew",
    "isBestseller",
    "isTrending",
    "isFeatured",
    "onSale",
  ] as const) {
    if (sp[key]) params[key] = sp[key]!;
  }

  let products: Awaited<ReturnType<typeof fetchProducts>>["data"] = [];
  let meta: { total?: number } | undefined;
  let categories: Awaited<ReturnType<typeof fetchCategories>>["data"] = [];
  let brands: Array<{ slug: string; name: string }> = [];
  let collections: Array<{ slug: string; name: string }> = [];
  try {
    const [p, c, b, col] = await Promise.all([
      fetchProducts(params),
      fetchCategories(),
      fetchBrands(),
      fetchCollections(),
    ]);
    products = p.data;
    meta = p.meta;
    categories = c.data;
    brands = b.data;
    collections = col.data.map((x: { slug: string; name: string }) => ({
      slug: x.slug,
      name: x.name,
    }));
  } catch {
    products = [];
  }

  return (
    <Suspense fallback={<LoadingState label="Loading…" />}>
      <ProductsBrowser
        initialProducts={products}
        initialMeta={meta}
        categories={categories}
        brands={brands}
        collections={collections}
        initialParams={params}
      />
    </Suspense>
  );
}
