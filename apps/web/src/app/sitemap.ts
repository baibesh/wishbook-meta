import type { MetadataRoute } from "next";

const site = process.env.SITE_URL ?? "https://fabulka.com";
/** The starting catalog; books added in the admin are found through the catalog page. */
const CATALOG = ["first-day-kindergarten", "snow-leopard-alatau", "not-yet", "big-feelings", "nauryz-new-friend", "bath-time"];

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/catalog", "/create", "/privacy", "/terms", ...CATALOG.map((slug) => `/catalog/${slug}`)].map((path) => ({
    url: `${site}${path}`,
  }));
}
