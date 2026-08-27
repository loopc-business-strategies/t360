import type { Metadata } from "next";
import { CatalogPlpPage } from "../../lib/catalog-plp";
import { SITE_URL } from "../../lib/catalog-api";

export const metadata: Metadata = {
  title: "Kids",
  description: "Shop kids' fashion at T360.",
  openGraph: { title: "Kids", url: `${SITE_URL}/kids` },
};

export default async function KidsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return <CatalogPlpPage searchParams={searchParams} defaults={{ category: "kids" }} />;
}
