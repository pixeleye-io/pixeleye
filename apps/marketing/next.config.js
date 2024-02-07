/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@pixeleye/ui",
    "@pixeleye/reviewer",
    "@pixeleye/tailwind",
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tailwindui.com',
        port: '',
        pathname: '/img/**',
      }
    ]
  },
  async rewrites() {
    return [
      {
        source: "/ingest/:path*",
        destination: "https://eu.posthog.com/:path*",
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/home",
        permanent: false,
      },
      {
        source: "/docs",
        destination: "/docs/getting-started/introduction",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
