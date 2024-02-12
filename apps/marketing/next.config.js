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
      {
        source: "/dashboard/:path*",
        destination: "https://app.pixeleye.io/dashboard/:path*",
      },
      {
        source: "/billing/:path*",
        destination: "https://app.pixeleye.io/billing/:path*",
      },
      {
        source: "/settings/:path*",
        destination: "https://app.pixeleye.io/settings/:path*",
      },
      {
        source: "/usage/:path*",
        destination: "https://app.pixeleye.io/usage/:path*",
      },
      {
        source: "/add/:path*",
        destination: "https://docs.pixeleye.io/add/:path*",
      },
      {
        source: "/builds/:path*",
        destination: "https://app.pixeleye.io/builds/:path*",
      },
      {
        source: "/invites/:path*",
        destination: "https://app.pixeleye.io/invites/:path*",
      },
      {
        source: "/projects/:path*",
        destination: "https://app.pixeleye.io/projects/:path*",
      },
      {
        source: "/auth-error",
        destination: "https://app.pixeleye.io/auth-error",
      },
      {
        source: "/login",
        destination: "https://app.pixeleye.io/login",
      },
      {
        source: "/logout",
        destination: "https://app.pixeleye.io/logout",
      },
      {
        source: "/registration",
        destination: "https://app.pixeleye.io/registration",
      },
      {
        source: "/verification",
        destination: "https://app.pixeleye.io/verification",
      },

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
