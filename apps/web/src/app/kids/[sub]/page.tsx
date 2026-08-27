import { CatalogPlpPage } from "../../../lib/catalog-plp";

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
