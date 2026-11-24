/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 80, 85],
  },
  async headers() {
    return [
      {
        source: "/login",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/signup",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: "/use-cases/property-bookings",
        destination: "/use-cases",
        permanent: true,
      },
      {
        source: "/pricing",
        destination: "/book-consultation",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
