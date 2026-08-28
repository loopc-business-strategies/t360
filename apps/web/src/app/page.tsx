import { HomeClient } from "../components/home-client";
import { fetchBranches, fetchCategories, fetchStorefront } from "../lib/catalog-api";

export default async function HomePage() {
  let categories: Awaited<ReturnType<typeof fetchCategories>>["data"] = [];
  let storefront: Awaited<ReturnType<typeof fetchStorefront>>["data"] | null = null;
  let branches: Awaited<ReturnType<typeof fetchBranches>>["data"] = [];
  try {
    const [c, s, b] = await Promise.all([fetchCategories(), fetchStorefront(), fetchBranches()]);
    categories = c.data;
    storefront = s.data;
    branches = b.data ?? [];
  } catch {
    categories = [];
  }
  return <HomeClient categories={categories} storefront={storefront} branches={branches} />;
}
