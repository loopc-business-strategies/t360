import { CatalogPlpPage } from "../../../lib/catalog-plp";

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
