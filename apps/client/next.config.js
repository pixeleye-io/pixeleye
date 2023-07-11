/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@pixeleye/ui"],
  rewrites: async () => [
    {
      source: "/api/:path*",
      destination: "http://localhost:51862/api/:path*",
    },
  ],
};

module.exports = nextConfig;
