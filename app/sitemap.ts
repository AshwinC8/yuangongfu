import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/links";

// Single-page site — one canonical entry. Add more URLs here if/when standalone
// routes (e.g. /privacy, /terms) get their own pages.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
