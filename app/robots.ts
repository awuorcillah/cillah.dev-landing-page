import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/site-config"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api",
          "/api/",
          "/dashboard",
          "/dashboard/",
          "/client",
          "/client/",
          "/user",
          "/user/",
          "/unauthorized",
          "/client-portal",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
