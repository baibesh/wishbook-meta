import type { MetadataRoute } from "next";

const site = process.env.SITE_URL ?? "https://fabulka.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/books", "/orders", "/my"] },
    sitemap: `${site}/sitemap.xml`,
  };
}
