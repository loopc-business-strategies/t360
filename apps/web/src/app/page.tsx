import { HomeClient } from "../components/home-client";
import { fetchCategories, fetchProducts, fetchStorefront } from "../lib/catalog-api";

export default async function HomePage() {
  let products: Awaited<ReturnType<typeof fetchProducts>>["data"] = [];
  let categories: Awaited<ReturnType<typeof fetchCategories>>["data"] = [];
  let storefront: Awaited<ReturnType<typeof fetchStorefront>>["data"] | null = null;
  try {
    const [p, c, s] = await Promise.all([
      fetchProducts({ sort: "newest", pageSize: "6" }),
      fetchCategories(),
      fetchStorefront(),
    ]);
    products = p.data;
    categories = c.data;
    storefront = s.data;
  } catch {
    products = [];
    categories = [];
  }
  return <HomeClient products={products} categories={categories} storefront={storefront} />;
}
