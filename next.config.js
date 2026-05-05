/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
        ],
      },
    ]
  },
}
module.exports = nextConfig
