import { SearchClient } from "../../components/search-client";
import { fetchBrands, fetchCategories, fetchProducts } from "../../lib/catalog-api";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const page = typeof sp.page === "string" ? sp.page : "1";

  let products: Awaited<ReturnType<typeof fetchProducts>>["data"] = [];
  let meta: Awaited<ReturnType<typeof fetchProducts>>["meta"] = {};
  let categories: Awaited<ReturnType<typeof fetchCategories>>["data"] = [];
  let brands: Awaited<ReturnType<typeof fetchBrands>>["data"] = [];

  try {
    const params: Record<string, string> = {
      pageSize: "24",
      page,
      sort: "relevance",
    };
    if (q) params.q = q;
    const [p, c, b] = await Promise.all([
      fetchProducts(params),
      fetchCategories(),
      fetchBrands(),
    ]);
    products = p.data;
    meta = p.meta;
    categories = c.data;
    brands = b.data;
  } catch {
    /* empty */
  }

  return (
    <SearchClient
      initialProducts={products}
      initialMeta={meta}
      categories={categories}
      brands={brands.map((b) => ({ slug: b.slug, name: b.name }))}
      initialQuery={q}
      initialPage={Number(page) || 1}
    />
  );
}
