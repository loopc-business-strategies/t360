import { Injectable } from "@nestjs/common";
import type { ProductListQuery } from "@t360/validation";
import { PrismaService } from "../../prisma/prisma.service";
import { expandSearchQuery, type SynonymRow } from "../search.utils";
import type { SearchHit, SearchProvider, SuggestItem } from "./search-provider";

@Injectable()
export class PostgresSearchProvider implements SearchProvider {
  constructor(private readonly prisma: PrismaService) {}

  private async loadSynonyms(): Promise<SynonymRow[]> {
    const rows = await this.prisma.searchSynonym.findMany({
      where: { deletedAt: null, active: true },
    });
    return rows.map((r) => ({
      term: r.term,
      aliases: Array.isArray(r.aliases) ? (r.aliases as string[]) : [],
    }));
  }

  async searchProducts(query: ProductListQuery, opts?: { admin?: boolean }): Promise<SearchHit> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const offset = (page - 1) * pageSize;
    const statusFilter = opts?.admin ? query.status : "published";

    const params: unknown[] = [];
    const where: string[] = [`p."deletedAt" IS NULL`];

    if (statusFilter) {
      params.push(statusFilter);
      where.push(`p.status = $${params.length}`);
    }

    if (query.category) {
      params.push(query.category);
      where.push(`(c.slug = $${params.length} OR c.id::text = $${params.length})`);
    }
    if (query.brand) {
      params.push(query.brand);
      where.push(`(b.slug = $${params.length} OR b.id::text = $${params.length})`);
    }
    if (query.minPrice != null) {
      params.push(query.minPrice);
      where.push(
        `EXISTS (SELECT 1 FROM "ProductVariant" v WHERE v."productId" = p.id AND v."deletedAt" IS NULL AND COALESCE(v."salePrice", v.price) >= $${params.length})`,
      );
    }
    if (query.maxPrice != null) {
      params.push(query.maxPrice);
      where.push(
        `EXISTS (SELECT 1 FROM "ProductVariant" v WHERE v."productId" = p.id AND v."deletedAt" IS NULL AND COALESCE(v."salePrice", v.price) <= $${params.length})`,
      );
    }
    if (query.size) {
      params.push(JSON.stringify({ size: query.size }));
      where.push(
        `EXISTS (SELECT 1 FROM "ProductVariant" v WHERE v."productId" = p.id AND v."deletedAt" IS NULL AND v.attributes @> $${params.length}::jsonb)`,
      );
    }
    if (query.colour) {
      params.push(JSON.stringify({ colour: query.colour }));
      where.push(
        `EXISTS (SELECT 1 FROM "ProductVariant" v WHERE v."productId" = p.id AND v."deletedAt" IS NULL AND v.attributes @> $${params.length}::jsonb)`,
      );
    }

    if (query.availability === "in_stock") {
      const branchClause = query.branch
        ? (() => {
            params.push(query.branch);
            return `AND (i."branchId"::text = $${params.length} OR bch.code = $${params.length})`;
          })()
        : "";
      where.push(`EXISTS (
        SELECT 1 FROM "ProductVariant" v
        JOIN "Inventory" i ON i."variantId" = v.id
        JOIN "Branch" bch ON bch.id = i."branchId" AND bch."deletedAt" IS NULL
        WHERE v."productId" = p.id AND v."deletedAt" IS NULL
          AND (i."physicalQty" - i."reservedQty") > 0
          ${branchClause}
      )`);
    }

    let orderBy = `p."createdAt" DESC`;
    let rankSelect = `0::float AS rank`;
    if (query.q && query.q.trim()) {
      const synonyms = await this.loadSynonyms();
      const q = expandSearchQuery(query.q.trim(), synonyms);
      params.push(q);
      const qIdx = params.length;
      where.push(`(
        p.search_vector @@ websearch_to_tsquery('english', $${qIdx})
        OR p.name % $${qIdx}
        OR p.description % $${qIdx}
        OR EXISTS (
          SELECT 1 FROM "ProductVariant" v
          WHERE v."productId" = p.id AND v.sku % $${qIdx}
        )
      )`);
      rankSelect = `GREATEST(
        ts_rank(p.search_vector, websearch_to_tsquery('english', $${qIdx})),
        similarity(p.name, $${qIdx})
      ) AS rank`;
      if (!query.sort || query.sort === "relevance") {
        orderBy = `rank DESC, p."createdAt" DESC`;
      }
    }

    if (query.sort === "newest") orderBy = `p."createdAt" DESC`;
    if (query.sort === "price_asc") {
      orderBy = `(SELECT MIN(COALESCE(v."salePrice", v.price)) FROM "ProductVariant" v WHERE v."productId" = p.id AND v."deletedAt" IS NULL) ASC NULLS LAST`;
    }
    if (query.sort === "price_desc") {
      orderBy = `(SELECT MIN(COALESCE(v."salePrice", v.price)) FROM "ProductVariant" v WHERE v."productId" = p.id AND v."deletedAt" IS NULL) DESC NULLS LAST`;
    }

    params.push(pageSize);
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const sql = `
      SELECT p.id, ${rankSelect}
      FROM "Product" p
      LEFT JOIN "Category" c ON c.id = p."categoryId"
      LEFT JOIN "Brand" b ON b.id = p."brandId"
      WHERE ${where.join(" AND ")}
      ORDER BY ${orderBy}
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const countSql = `
      SELECT COUNT(*)::int AS count
      FROM "Product" p
      LEFT JOIN "Category" c ON c.id = p."categoryId"
      LEFT JOIN "Brand" b ON b.id = p."brandId"
      WHERE ${where.join(" AND ")}
    `;

    const rows = await this.prisma.$queryRawUnsafe<Array<{ id: string; rank?: number }>>(
      sql,
      ...params,
    );
    const countParams = params.slice(0, params.length - 2);
    const countRows = await this.prisma.$queryRawUnsafe<Array<{ count: number }>>(
      countSql,
      ...countParams,
    );

    const scores: Record<string, number> = {};
    for (const r of rows) {
      if (r.rank != null) scores[r.id] = Number(r.rank);
    }

    return {
      ids: rows.map((r) => r.id),
      total: countRows[0]?.count ?? 0,
      scores,
    };
  }

  async suggest(q: string, limit = 8): Promise<SuggestItem[]> {
    const term = q.trim();
    if (!term) return [];
    const lim = Math.min(Math.max(limit, 1), 20);

    const [products, categories, brands] = await Promise.all([
      this.prisma.$queryRawUnsafe<Array<{ name: string; slug: string }>>(
        `
        SELECT name, slug FROM "Product"
        WHERE "deletedAt" IS NULL AND status = 'published'
          AND (name ILIKE $1 OR name % $2)
        ORDER BY similarity(name, $2) DESC NULLS LAST, name ASC
        LIMIT $3
        `,
        `${term}%`,
        term,
        lim,
      ),
      this.prisma.$queryRawUnsafe<Array<{ name: string; slug: string }>>(
        `
        SELECT name, slug FROM "Category"
        WHERE "deletedAt" IS NULL AND status = 'active'
          AND (name ILIKE $1 OR name % $2)
        ORDER BY name ASC
        LIMIT $3
        `,
        `${term}%`,
        term,
        Math.min(lim, 5),
      ),
      this.prisma.$queryRawUnsafe<Array<{ name: string; slug: string }>>(
        `
        SELECT name, slug FROM "Brand"
        WHERE "deletedAt" IS NULL AND status = 'active'
          AND (name ILIKE $1 OR name % $2)
        ORDER BY name ASC
        LIMIT $3
        `,
        `${term}%`,
        term,
        Math.min(lim, 5),
      ),
    ]);

    const out: SuggestItem[] = [];
    for (const p of products) out.push({ text: p.name, type: "product", slug: p.slug });
    for (const c of categories) out.push({ text: c.name, type: "category", slug: c.slug });
    for (const b of brands) out.push({ text: b.name, type: "brand", slug: b.slug });
    return out.slice(0, lim);
  }
}
