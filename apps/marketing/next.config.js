/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@pixeleye/ui", "@pixeleye/tailwind"],
  images: {
    domains: ["tailwindui.com"],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.md$/,
      use: "raw-loader",
    });
    return config;
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
        destination: "/docs/introduction/getting-started",
        permanent: true,
      }
    ];
  },
};

module.exports = nextConfig;
