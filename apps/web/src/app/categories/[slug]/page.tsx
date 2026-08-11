import { Suspense } from "react";
import { ProductsBrowser } from "../../../components/products-browser";
import { fetchBrands, fetchCategories, fetchProducts } from "../../../lib/catalog-api";
import { LoadingState } from "@t360/ui";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const query: Record<string, string> = {
    pageSize: "24",
    sort: sp.sort ?? "newest",
    category: slug,
  };
  if (sp.q) query.q = sp.q;
  if (sp.brand) query.brand = sp.brand;
  if (sp.size) query.size = sp.size;
  if (sp.colour) query.colour = sp.colour;
  if (sp.minPrice) query.minPrice = sp.minPrice;
  if (sp.maxPrice) query.maxPrice = sp.maxPrice;
  if (sp.availability) query.availability = sp.availability;

  let products: Awaited<ReturnType<typeof fetchProducts>>["data"] = [];
  let meta: { total?: number } | undefined;
  let categories: Awaited<ReturnType<typeof fetchCategories>>["data"] = [];
  let brands: Array<{ slug: string; name: string }> = [];
  try {
    const [p, c, b] = await Promise.all([
      fetchProducts(query),
      fetchCategories(),
      fetchBrands(),
    ]);
    products = p.data;
    meta = p.meta;
    categories = c.data;
    brands = b.data;
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
        initialParams={query}
      />
    </Suspense>
  );
}
