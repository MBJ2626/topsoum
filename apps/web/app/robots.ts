import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

// /search reste explorable : ses pages sont en noindex mais leurs liens vers
// les fiches produit doivent etre suivis (un Disallow empecherait Google de
// lire ce noindex et de suivre ces liens).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin", "/favorites"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
