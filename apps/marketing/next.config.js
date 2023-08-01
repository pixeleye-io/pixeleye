/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@pixeleye/ui", "@pixeleye/tailwind"],
  images: {
    domains: ['tailwindui.com'],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/home',
        permanent: false,
      },
    ]
  }
};

module.exports = nextConfig;
