import type { Metadata } from "next";
import { CatalogPlpPage } from "../../../lib/catalog-plp";
import { SITE_URL } from "../../../lib/catalog-api";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const title = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return {
    title: `${title} Collection`,
    description: `Shop the ${title} collection at T360.`,
    openGraph: { title: `${title} Collection`, url: `${SITE_URL}/collections/${slug}` },
  };
}

export default async function CollectionAliasPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { slug } = await params;
  return <CatalogPlpPage searchParams={searchParams} defaults={{ collection: slug }} />;
}
