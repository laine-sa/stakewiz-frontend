/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
}

module.exports = nextConfig

module.exports = {
  env: {
    API_BASE_URL: process.env.API_BASE_URL
  },
  images: {
    domains: ['s3.amazonaws.com', 'media.stakewiz.com']
  },
  redirects() {
    return [
      process.env.MAINTENANCE_MODE === "1"
        ? { source: "/((?!maintenance).*)", destination: "/maintenance", permanent: false }
        : null,
    ].filter(Boolean);
  }
}