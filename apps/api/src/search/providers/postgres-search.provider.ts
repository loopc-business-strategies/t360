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
      // Match category by slug/id, or any descendant under that parent (e.g. /men → men-t-shirts).
      where.push(`(
        (c.slug = $${params.length} OR c.id::text = $${params.length}) AND c."deletedAt" IS NULL AND c.status = 'active'
        OR c.id IN (
          WITH RECURSIVE cat_tree AS (
            SELECT id FROM "Category"
            WHERE (slug = $${params.length} OR id::text = $${params.length}) AND "deletedAt" IS NULL AND status = 'active'
            UNION ALL
            SELECT child.id FROM "Category" child
            INNER JOIN cat_tree parent ON child."parentId" = parent.id
            WHERE child."deletedAt" IS NULL AND child.status = 'active'
          )
          SELECT id FROM cat_tree
        )
      )`);
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

    if (query.tryOnEnabled === true) {
      where.push(`p."tryOnEnabled" = true`);
    }
    if (query.isNew === true) where.push(`p."isNew" = true`);
    if (query.isBestseller === true) where.push(`p."isBestseller" = true`);
    if (query.isTrending === true) where.push(`p."isTrending" = true`);
    if (query.isFeatured === true) where.push(`p."isFeatured" = true`);
    if (query.onSale === true) {
      where.push(
        `EXISTS (SELECT 1 FROM "ProductVariant" v WHERE v."productId" = p.id AND v."deletedAt" IS NULL AND v."salePrice" IS NOT NULL)`,
      );
    }

    const attributeFilter = (code: string, value: string | undefined) => {
      if (!value?.trim()) return;
      params.push(code, value.trim().toLowerCase());
      where.push(`EXISTS (
        SELECT 1 FROM "ProductAttributeValue" pav
        JOIN "AttributeDefinition" ad ON ad.id = pav."attributeId"
        WHERE pav."productId" = p.id
          AND ad.code = $${params.length - 1}
          AND LOWER(pav.value) = $${params.length}
      )`);
    };
    attributeFilter("fabric", query.fabric);
    attributeFilter("occasion", query.occasion);
    attributeFilter("pattern", query.pattern);

    if (query.minRating != null) {
      params.push(query.minRating);
      where.push(`(
        SELECT COALESCE(AVG(r.rating), 0) FROM "ProductReview" r
        WHERE r."productId" = p.id AND r.status = 'approved'
      ) >= $${params.length}`);
    }

    // Hide demo catalog in production unless explicitly enabled
    const includeDemo =
      process.env.DEMO_CATALOG_ENABLED === "true" || process.env.NODE_ENV !== "production";
    if (!includeDemo && !opts?.admin) {
      where.push(`p."isDemo" = false`);
    }

    if (query.collection) {
      params.push(query.collection);
      where.push(`EXISTS (
        SELECT 1 FROM "CollectionProduct" cp
        JOIN "Collection" col ON col.id = cp."collectionId" AND col."deletedAt" IS NULL AND col.status = 'active'
        WHERE cp."productId" = p.id
          AND (col.slug = $${params.length} OR col.id::text = $${params.length})
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
    if (query.sort === "rating") {
      orderBy = `(SELECT COALESCE(AVG(r.rating), 0) FROM "ProductReview" r WHERE r."productId" = p.id AND r.status = 'approved') DESC NULLS LAST, p."createdAt" DESC`;
    }
    if (query.sort === "featured") {
      orderBy = `p."isFeatured" DESC, p."createdAt" DESC`;
    }
    if (query.sort === "trending") {
      orderBy = `p."isTrending" DESC, p."isBestseller" DESC, p."createdAt" DESC`;
    }
    if (query.sort === "bestselling") {
      orderBy = `p."isBestseller" DESC, (SELECT COALESCE(SUM(oi.qty), 0) FROM "OrderItem" oi JOIN "ProductVariant" v ON v.id = oi."variantId" WHERE v."productId" = p.id) DESC NULLS LAST, p."createdAt" DESC`;
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

    const [products, categories, brands, collections] = await Promise.all([
      this.prisma.$queryRawUnsafe<Array<{ name: string; slug: string; tryOnEnabled: boolean }>>(
        `
        SELECT name, slug, "tryOnEnabled" FROM "Product"
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
      this.prisma.$queryRawUnsafe<Array<{ name: string; slug: string }>>(
        `
        SELECT name, slug FROM "Collection"
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
    for (const p of products)
      out.push({ text: p.name, type: "product", slug: p.slug, tryOnEnabled: Boolean(p.tryOnEnabled) });
    for (const c of categories) out.push({ text: c.name, type: "category", slug: c.slug });
    for (const b of brands) out.push({ text: b.name, type: "brand", slug: b.slug });
    for (const col of collections) out.push({ text: col.name, type: "collection", slug: col.slug });
    return out.slice(0, lim);
  }
}
