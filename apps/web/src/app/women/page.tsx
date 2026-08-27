import type { Metadata } from "next";
import { CatalogPlpPage } from "../../lib/catalog-plp";
import { SITE_URL } from "../../lib/catalog-api";

export const metadata: Metadata = {
  title: "Women",
  description: "Shop women's fashion at T360.",
  openGraph: { title: "Women", url: `${SITE_URL}/women` },
};

export default async function WomenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return <CatalogPlpPage searchParams={searchParams} defaults={{ category: "women" }} />;
}
