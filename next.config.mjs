/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: "/use-cases/property-bookings",
        destination: "/use-cases",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
