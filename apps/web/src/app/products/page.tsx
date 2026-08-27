import { Suspense } from "react";
import { ProductsBrowser } from "../../components/products-browser";
import { fetchBrands, fetchCategories, fetchCollections, fetchProducts } from "../../lib/catalog-api";
import { LoadingState } from "@t360/ui";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const params: Record<string, string> = {
    pageSize: "24",
    sort: sp.sort ?? "newest",
  };
  if (sp.q) params.q = sp.q;
  if (sp.category) params.category = sp.category;
  if (sp.brand) params.brand = sp.brand;
  if (sp.size) params.size = sp.size;
  if (sp.colour) params.colour = sp.colour;
  if (sp.minPrice) params.minPrice = sp.minPrice;
  if (sp.maxPrice) params.maxPrice = sp.maxPrice;
  if (sp.availability) params.availability = sp.availability;
  if (sp.collection) params.collection = sp.collection;
  if (sp.tryOnEnabled) params.tryOnEnabled = sp.tryOnEnabled;

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
    collections = col.data.map((x) => ({ slug: x.slug, name: x.name }));
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
