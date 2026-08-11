import { Injectable, NotFoundException } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import type { ProductListQuery } from "@t360/validation";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { SEARCH_PROVIDER, type SearchProvider } from "./providers/search-provider";

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Inject(SEARCH_PROVIDER) private readonly provider: SearchProvider,
  ) {}

  suggest(q: string, limit?: number) {
    return this.provider.suggest(q, limit);
  }

  async facets(query: ProductListQuery) {
    const hit = await this.provider.searchProducts(
      { ...query, page: 1, pageSize: 500 },
      { admin: false },
    );
    if (!hit.ids.length) {
      return { categories: [], brands: [], sizes: [], colours: [] };
    }

    const products = await this.prisma.product.findMany({
      where: { id: { in: hit.ids }, deletedAt: null },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        variants: { where: { deletedAt: null }, select: { attributes: true } },
      },
    });

    const cat = new Map<string, { slug: string; name: string; count: number }>();
    const brand = new Map<string, { slug: string; name: string; count: number }>();
    const sizes = new Map<string, number>();
    const colours = new Map<string, number>();

    for (const p of products) {
      if (p.category) {
        const cur = cat.get(p.category.slug) ?? {
          slug: p.category.slug,
          name: p.category.name,
          count: 0,
        };
        cur.count += 1;
        cat.set(p.category.slug, cur);
      }
      if (p.brand) {
        const cur = brand.get(p.brand.slug) ?? {
          slug: p.brand.slug,
          name: p.brand.name,
          count: 0,
        };
        cur.count += 1;
        brand.set(p.brand.slug, cur);
      }
      for (const v of p.variants) {
        const attrs = (v.attributes ?? {}) as Record<string, string>;
        if (attrs.size) sizes.set(attrs.size, (sizes.get(attrs.size) ?? 0) + 1);
        if (attrs.colour) colours.set(attrs.colour, (colours.get(attrs.colour) ?? 0) + 1);
      }
    }

    return {
      categories: [...cat.values()].sort((a, b) => b.count - a.count),
      brands: [...brand.values()].sort((a, b) => b.count - a.count),
      sizes: [...sizes.entries()].map(([value, count]) => ({ value, count })),
      colours: [...colours.entries()].map(([value, count]) => ({ value, count })),
    };
  }

  listSynonyms() {
    return this.prisma.searchSynonym.findMany({
      where: { deletedAt: null },
      orderBy: { term: "asc" },
    });
  }

  async createSynonym(
    input: { term: string; aliases: string[]; locale?: string; active?: boolean },
    actorId?: string,
  ) {
    const row = await this.prisma.searchSynonym.create({
      data: {
        term: input.term.toLowerCase().trim(),
        aliases: input.aliases.map((a) => a.trim()).filter(Boolean),
        locale: input.locale ?? "en",
        active: input.active ?? true,
      },
    });
    await this.audit.log({
      actorId,
      action: "search.synonym.create",
      entityType: "SearchSynonym",
      entityId: row.id,
    });
    return row;
  }

  async updateSynonym(
    id: string,
    input: Partial<{ term: string; aliases: string[]; locale: string; active: boolean }>,
    actorId?: string,
  ) {
    const existing = await this.prisma.searchSynonym.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException({ code: "SYNONYM_NOT_FOUND", message: "Synonym not found" });
    }
    const row = await this.prisma.searchSynonym.update({
      where: { id },
      data: {
        term: input.term?.toLowerCase().trim(),
        aliases: input.aliases?.map((a) => a.trim()).filter(Boolean),
        locale: input.locale,
        active: input.active,
      },
    });
    await this.audit.log({
      actorId,
      action: "search.synonym.update",
      entityType: "SearchSynonym",
      entityId: id,
    });
    return row;
  }
}
