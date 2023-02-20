// @ts-check
/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 * This is especially useful for Docker builds and Linting.
 */
!process.env.SKIP_ENV_VALIDATION && (await import("./src/env.mjs"));

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  /** Enables hot reloading for local packages without a build step */
  transpilePackages: [
    "@pixeleye/api",
    "@pixeleye/auth",
    "@pixeleye/db",
    "@pixeleye/utils",
    "@pixeleye/hooks",
    "@pixeleye/ui",
  ],
  modularizeImports: {
    "@pixeleye/ui": {
      transform: "@pixeleye/ui/src/{{member}}/index.ts",
    },
  },
  images: {
    domains: ["avatars.githubusercontent.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pixeleye-images-dev.s3.eu-west-2.amazonaws.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  /** We already do linting and typechecking as separate tasks in CI */
  eslint: { ignoreDuringBuilds: !!process.env.CI },
  typescript: { ignoreBuildErrors: !!process.env.CI },
  experimental: {
    appDir: true,
    scrollRestoration: true,
  },
};

export default config;
