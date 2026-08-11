import { MetadataRoute } from "next";
import { API_URL, SITE_URL } from "../lib/catalog-api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/policies/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/policies/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/policies/shipping`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/policies/returns`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/policies/refunds`, changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const res = await fetch(`${API_URL}/products?pageSize=100&sort=newest`, {
      next: { revalidate: 3600 },
    });
    const json = await res.json();
    const products = (json.data ?? []) as Array<{ slug: string; updatedAt?: string }>;
    return [
      ...staticRoutes,
      ...products.map((p) => ({
        url: `${SITE_URL}/products/${p.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
