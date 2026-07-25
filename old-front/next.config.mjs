/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  allowedDevOrigins: ['127.0.0.1', '192.168.0.103'],
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  async redirects() {
    return [
      { source: '/products', destination: '/#products', permanent: false },
      {
        source: '/products/tshirt',
        destination: '/products/t-shirt',
        permanent: true,
      },
      { source: '/basket', destination: '/cart', permanent: true },
      { source: '/baskets', destination: '/cart', permanent: true },
      { source: '/checkouts', destination: '/checkout', permanent: true },
      { source: '/payment', destination: '/orders', permanent: true },
      { source: '/payments', destination: '/orders', permanent: true },
    ];
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';

    return [
      { source: '/api/:path*', destination: `${backendUrl}/api/:path*` },
      { source: '/media/:path*', destination: `${backendUrl}/media/:path*` },
      { source: '/static/:path*', destination: `${backendUrl}/static/:path*` },
    ];
  },
};

export default nextConfig;
