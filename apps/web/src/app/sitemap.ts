import { MetadataRoute } from "next";
import { API_URL, SITE_URL } from "../lib/catalog-api";

async function fetchAllProductSlugs(): Promise<Array<{ slug: string }>> {
  const out: Array<{ slug: string }> = [];
  let page = 1;
  for (;;) {
    const res = await fetch(`${API_URL}/products?pageSize=100&page=${page}&sort=newest`, {
      next: { revalidate: 3600 },
    });
    const json = await res.json();
    const batch = (json.data ?? []) as Array<{ slug: string }>;
    out.push(...batch);
    const total = json.meta?.total ?? batch.length;
    if (out.length >= total || batch.length === 0 || page > 20) break;
    page++;
  }
  return out;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/men`, changeFrequency: "daily", priority: 0.85 },
    { url: `${SITE_URL}/women`, changeFrequency: "daily", priority: 0.85 },
    { url: `${SITE_URL}/kids`, changeFrequency: "daily", priority: 0.85 },
    { url: `${SITE_URL}/sale`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/policies/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/policies/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/policies/shipping`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/policies/returns`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/policies/refunds`, changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const [products, categoriesRes, collectionsRes] = await Promise.all([
      fetchAllProductSlugs(),
      fetch(`${API_URL}/categories`, { next: { revalidate: 3600 } }),
      fetch(`${API_URL}/collections`, { next: { revalidate: 3600 } }),
    ]);
    const categoriesJson = await categoriesRes.json();
    const collectionsJson = await collectionsRes.json();

    type Cat = { slug: string; children?: Cat[] };
    const flatCats: string[] = [];
    const walk = (nodes: Cat[]) => {
      for (const n of nodes) {
        flatCats.push(n.slug);
        if (n.children?.length) walk(n.children);
      }
    };
    walk((categoriesJson.data ?? []) as Cat[]);

    const collections = (collectionsJson.data ?? []) as Array<{ slug: string }>;

    return [
      ...staticRoutes,
      ...flatCats.map((slug) => ({
        url: `${SITE_URL}/categories/${slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.75,
      })),
      ...collections.map((c) => ({
        url: `${SITE_URL}/collections/${c.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
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
