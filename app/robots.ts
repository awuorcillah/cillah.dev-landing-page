import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://cillah.dev"

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
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
