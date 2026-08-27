import { HomeClient } from "../components/home-client";
import { fetchCategories, fetchStorefront } from "../lib/catalog-api";

export default async function HomePage() {
  let categories: Awaited<ReturnType<typeof fetchCategories>>["data"] = [];
  let storefront: Awaited<ReturnType<typeof fetchStorefront>>["data"] | null = null;
  try {
    const [c, s] = await Promise.all([fetchCategories(), fetchStorefront()]);
    categories = c.data;
    storefront = s.data;
  } catch {
    categories = [];
  }
  return <HomeClient categories={categories} storefront={storefront} />;
}
