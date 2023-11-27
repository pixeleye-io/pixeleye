/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@pixeleye/ui", "@pixeleye/api", "@pixeleye/tailwind"],
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  output: process.env.PX_HOST === "docker" ? "standalone" : undefined,
  images: {
    domains: ["avatars.githubusercontent.com"],
  },
};

module.exports = nextConfig;
