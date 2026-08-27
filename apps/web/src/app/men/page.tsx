import type { Metadata } from "next";
import { CatalogPlpPage } from "../../lib/catalog-plp";
import { SITE_URL } from "../../lib/catalog-api";

export const metadata: Metadata = {
  title: "Men",
  description: "Shop men's fashion at T360.",
  openGraph: { title: "Men", url: `${SITE_URL}/men` },
};

export default async function MenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return <CatalogPlpPage searchParams={searchParams} defaults={{ category: "men" }} />;
}
