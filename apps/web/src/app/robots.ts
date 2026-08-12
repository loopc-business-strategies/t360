import { MetadataRoute } from "next";
import { SITE_URL } from "../lib/catalog-api";

/** Allow full storefront crawl so Safe Browsing / Search Console can recrawl trust signals. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
