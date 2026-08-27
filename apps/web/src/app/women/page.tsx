import { CatalogPlpPage } from "../../lib/catalog-plp";

export default async function WomenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return <CatalogPlpPage searchParams={searchParams} defaults={{ category: "women" }} />;
}
