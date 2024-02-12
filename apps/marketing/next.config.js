
const internalRewrites = ["dashboard", "billing", "settings", "usage", "add", "builds", "invites", "projects", "auth-error", "login", "logout", "registration", "verification"]


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

      ...internalRewrites.flatMap((name) => [
        {
          source: `/${name}`,
          destination: `https://app.pixeleye.io/${name}`
        },
        {
          source: `/${name}/:path*`,
          destination: `https://app.pixeleye.io/${name}/:path*`
        },
      ])
    ];
  },
  async redirects() {
    return [
      {
        source: "/docs",
        destination: "/docs/getting-started/introduction",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
