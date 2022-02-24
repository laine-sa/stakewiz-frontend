/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig

module.exports = {
  env: {
    API_BASE_URL: 'https://api.stakewiz.com/'
  },
  images: {
    domains: ['s3.amazonaws.com']
  }
}
