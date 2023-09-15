/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@pixeleye/ui",
    "@pixeleye/reviewer",
    "@pixeleye/tailwind",
  ],
  images: {
    domains: ["tailwindui.com"],
  },
  experimental: {
    serverActions: true,
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
