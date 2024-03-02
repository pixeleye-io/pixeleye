/* eslint-disable turbo/no-undeclared-env-vars */
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@pixeleye/ui", "@pixeleye/api", "@pixeleye/tailwind"],
  output: process.env.PX_HOST === "docker" ? "standalone" : undefined,
  images: {
    domains: ["avatars.githubusercontent.com"],
  },
  assetPrefix: process.env.NEXT_PUBLIC_PIXELEYE_HOSTING === "true" && process.env.NODE_ENV === "production" ? "https://app.pixeleye.io" : undefined,
  output: process.env.DOCKER_BUILD === "true" ? "standalone" : undefined,
  async rewrites() {
    return [
      ...(process.env.BACKEND_URL ? [{
        source: "/api/:path*",
        destination: process.env.BACKEND_URL + "/:path*",
      }] : []),
    ];
  }
};

module.exports = nextConfig;
