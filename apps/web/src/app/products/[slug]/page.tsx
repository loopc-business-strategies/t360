import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailClient } from "../../../components/product-detail-client";
import { fetchBranches, fetchProduct, SITE_URL } from "../../../lib/catalog-api";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await fetchProduct(slug);
    return {
      title: res.data.name,
      description: res.data.description?.slice(0, 160) || undefined,
      openGraph: {
        title: res.data.name,
        images: res.data.images?.[0]?.url ? [res.data.images[0].url] : undefined,
        url: `${SITE_URL}/products/${slug}`,
      },
    };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  try {
    const [res, branches] = await Promise.all([fetchProduct(slug), fetchBranches().catch(() => ({ data: [] }))]);
    return <ProductDetailClient product={res.data} branches={branches.data} />;
  } catch {
    notFound();
  }
}
