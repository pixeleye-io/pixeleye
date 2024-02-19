/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@pixeleye/ui", "@pixeleye/api", "@pixeleye/tailwind"],
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  output: process.env.PX_HOST === "docker" ? "standalone" : undefined,
  images: {
    domains: ["avatars.githubusercontent.com"],
  },
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  assetPrefix: process.env.NEXT_PUBLIC_PIXELEYE_HOSTING === "true" && process.env.NODE_ENV === "production" ? "https://app.pixeleye.io" : undefined
};

module.exports = nextConfig;
