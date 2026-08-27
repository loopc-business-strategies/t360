import type { Metadata } from "next";
import { CatalogPlpPage } from "../../../lib/catalog-plp";
import { SITE_URL } from "../../../lib/catalog-api";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sub: string }>;
}): Promise<Metadata> {
  const { sub } = await params;
  const category = sub.startsWith("kids-") ? sub : `kids-${sub}`;
  const title = category
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return {
    title,
    description: `Shop ${title} at T360.`,
    openGraph: { title, url: `${SITE_URL}/kids/${sub}` },
  };
}

export default async function KidsSubPage({
  params,
  searchParams,
}: {
  params: Promise<{ sub: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { sub } = await params;
  const category = sub.startsWith("kids-") ? sub : `kids-${sub}`;
  return <CatalogPlpPage searchParams={searchParams} defaults={{ category }} />;
}
